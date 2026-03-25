import React, { useState, useEffect } from "react";
import { Order, DeliveryPartner, User } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { retailerApi } from "@/components/utils/retailerApi";
import { UserApi } from "@/components/utils/userApi";
import { OrderApi } from "@/components/utils/orderApi";
import { createEcho } from "@/utils/echo";
import {
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  Shield,
  Eye,
  Download,
  Phone,
  MapPin,
  Store,
  CheckCircle,
  Search,
  Mail,
  Image,
  FileText,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";
import { API_BASE_URL, ASSET_BASE_URL } from "@/config";

export default function SuperAdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [success, setSuccess] = useState(null); // New state for success messages
  const [actionLoading, setActionLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const echo = createEcho();

    echo.private("channel-name").listen(".user.status", (e) => {
      console.log("User Status:", e);

      if (e.status === "online") {
        console.log("🟢 Online:", e.user);
        loadData(); 
      }

      if (e.status === "offline") {
        console.log("🔴 Offline:", e.user);
        loadData();
      }
    });

    return () => {
      echo.leave("channel-name"); 
    };
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000); // Clear success message after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Removed cleanupDuplicates function as it's not relevant for mock API and was not part of the outline's changes.

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock API list methods typically return all data.
      // We apply sorting and limiting logic here to mimic the original API calls.
      const [ordersData, retailersData, deliveryPartnersData, usersData] =
        await Promise.all([
          OrderApi.list().then((data) =>
            data
              .sort(
                (a, b) => new Date(b.created_date) - new Date(a.created_date),
              )
              .slice(0, 200),
          ),
          retailerApi
            .list()
            .then((data) =>
              data.sort(
                (a, b) => new Date(b.created_date) - new Date(a.created_date),
              ),
            ),
          deliveryPartnerApi
            .list()
            .then((data) =>
              data.sort(
                (a, b) => new Date(b.created_date) - new Date(a.created_date),
              ),
            ),
          UserApi.list(),
        ]);

      setOrders(ordersData);
      setRetailers(retailersData);
      setDeliveryPartners(deliveryPartnersData);
      setAdmins(usersData);

      // Extract unique customers from orders
      const customerMap = new Map();

      ordersData.forEach((order) => {
        const phone = order.customer_phone;
        if (!phone) return;

        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            phone: phone,
            name: order.customer_name,
            orders: [],
            totalOrders: 0,
            totalSpent: 0,
          });
        }

        const customer = customerMap.get(phone);
        customer.orders.push(order);
        customer.totalOrders++;
        customer.totalSpent += order.amount || 0;
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter((o) =>
      ["assigned", "en_route", "arrived"].includes(o.status),
    ).length,
    totalRetailers: retailers.length,
    activeRetailers: retailers.filter((r) => r.availability_status === "online")
      .length,
    pendingRetailerVerifications: retailers.filter(
      (r) => r.onboarding_status === "admin_approval_pending",
    ).length,
    totalDeliveryPartners: deliveryPartners.length,
    activeDeliveryPartners: deliveryPartners.filter(
      (dp) => dp?.availability_status === "online",
    ).length,
    pendingDPVerifications: deliveryPartners.filter(
      (dp) => dp.onboarding_status === "retailers_pending",
    ).length,
    totalCustomers: customers.length,
    totalAdmins: admins.length,
    onlineAdmins: admins.filter((a) => a.status === "online").length,
    slaBreaches: orders.filter((o) => o.sla_breach === true).length,
  };

  const handleStatClick = (type) => {
    switch (type) {
      case "totalOrders":
        setActiveTab("orders"); // No 'orders' tab, will default to 'overview'
        break;
      case "retailers":
        setActiveTab("sellers");
        break;
      case "deliveryPartners":
        setActiveTab("delivery_partners");
        break;
      case "customers":
        setActiveTab("customers");
        break;
      case "slaBreaches":
        window.location.href = createPageUrl("Orders") + "?filter=sla_breach";
        break;
      default:
        break;
    }
  };

  const resolveImageUrl = (url) => {
    if (!url) return "";

    try {
      const parsed = new URL(url);

      return `${ASSET_BASE_URL}${parsed.pathname}`;
    } catch {
      return `${ASSET_BASE_URL}/${url.replace(/^\/+/, "")}`;
    }
  };

  const handleBanSeller = async (seller) => {
    const reason = prompt(`Enter ban reason`);
    if (!reason) return;

    try {
      const user = await UserApi.me();
      await retailerApi.ban(seller.id, {
        status: "suspended",
        ban_reason: reason,
        banned_by: user.id,
        banned_at: new Date().toISOString(),
      });
      setSuccess(`${seller.name} has been banned successfully.`);
      loadData(); // refresh the list
    } catch (error) {
      console.error("Error banning seller:", error);
      alert("Failed to ban seller.");
    }
  };

  const handleUnbanSeller = async (seller) => {
    try {
      await retailerApi.unban(seller.id, {
        status: "active",
        ban_reason: null,
        banned_by: null,
        banned_at: null,
      });
      setSuccess("Seller unbanned successfully");
      loadData();
    } catch (error) {
      console.error("Error unbanning seller:", error);
      setSuccess("Failed to unban seller.");
    }
  };

  const handleRateSeller = async (seller) => {
    const ratingInput = prompt(`Rate ${seller.name} (0-5 stars):`);
    if (!ratingInput) return;

    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      alert("Invalid rating. Please enter a number between 0 and 5.");
      return;
    }

    // const notes = prompt("Add notes (optional):");

    try {
      await retailerApi.rating(seller.id, {
        rating: rating,
      });
      setSuccess("Rating updated successfully");
      loadData();
    } catch (error) {
      console.error("Error rating seller:", error);
      setSuccess("Failed to update seller rating.");
    }
  };

  const handleBanDeliveryPartner = async (dp) => {
    const reason = prompt("Enter ban reason:");
    if (!reason) return;

    try {
      const user = await UserApi.me();
      await deliveryPartnerApi.ban(dp.id, {
        status: "suspended",
        ban_reason: reason,
        banned_by: user.id,
        banned_at: new Date().toISOString(),
      });
      setSuccess("Delivery partner banned successfully");
      loadData();
    } catch (error) {
      console.error("Error banning delivery partner:", error);
      setSuccess("Failed to ban delivery partner.");
    }
  };

  const handleUnbanDeliveryPartner = async (dp) => {
    try {
      await deliveryPartnerApi.unban(dp.id, {
        status: "active",
        ban_reason: null,
        banned_by: null,
        banned_at: null,
      });
      setSuccess("Delivery partner unbanned successfully");
      loadData();
    } catch (error) {
      console.error("Error unbanning delivery partner:", error);
      setSuccess("Failed to unban delivery partner.");
    }
  };

  const handleRateDeliveryPartner = async (dp) => {
    const ratingInput = prompt(`Rate ${dp.name} (0-5 stars):`);
    if (!ratingInput) return;

    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      alert("Invalid rating. Please enter a number between 0 and 5.");
      return;
    }

    //const notes = prompt("Add notes (optional):");

    try {
      await deliveryPartnerApi.rating(dp.id, {
        rating: rating,
      });
      setSuccess("Rating updated successfully");
      loadData();
    } catch (error) {
      console.error("Error rating delivery partner:", error);
      setSuccess("Failed to update delivery partner rating.");
    }
  };

  const filteredSellers = retailers.filter(
    (r) =>
      !searchTerm ||
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.includes(searchTerm) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredDeliveryPartners = deliveryPartners.filter(
    (dp) =>
      !searchTerm ||
      dp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dp.phone?.includes(searchTerm) ||
      dp.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const downloadReport = async (type) => {
    setShowMenu(false);
    const token = sessionStorage.getItem("token");
    let endpoint = "";
    if (type === "orders") endpoint = "/api/reports/orders/export";
    else if (type === "retailers") endpoint = "/api/reports/retailers/export";
    else if (type === "revenue") endpoint = "/api/reports/revenue/export";
    else return;

    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Export error response:", text);
        throw new Error("Failed to download report");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition");
      let filename = `${type}.xlsx`;
      if (disposition && disposition.indexOf("filename=") !== -1) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download report. Check console for details.");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEB3B] mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Super Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Super Admin Dashboard
            </h1>
            <p className="text-white opacity-90 mt-1">
              Global operations monitoring & management
            </p>
          </div>
          <div className="flex gap-3">
            <Badge className="bg-[#FFEB3B] text-black px-4 py-2 text-base font-bold">
              {stats.onlineAdmins}/{stats.totalAdmins} Admins Online
            </Badge>
            <Button
              onClick={() => setShowMenu((prev) => !prev)}
              variant="outline"
              className="bg-white text-[#075E66] border-2 border-[#F4B321] hover:bg-[#F4B321] hover:text-gray-900 font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Reports
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-8 bg-white shadow-lg border rounded-md w-56 z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => downloadReport("orders")}
                >
                  📦 Export Orders
                </button>

                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => downloadReport("retailers")}
                >
                  🛒 Export Retailers
                </button>

                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => downloadReport("revenue")}
                >
                  💰 Export Revenue
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            className="border-none shadow-lg bg-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleStatClick("totalOrders")}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-black">
                    {stats.totalOrders}
                  </p>
                  <p className="text-xs text-[#075E66] mt-1">
                    {stats.activeOrders} active now
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#075E66] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#075E66]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-none shadow-lg bg-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleStatClick("retailers")}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sellers</p>
                  <p className="text-3xl font-bold text-black">
                    {stats.totalRetailers}
                  </p>
                  <p className="text-xs text-[#075E66] mt-1">
                    {stats.activeRetailers} online
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#FFEB3B] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-[#075E66]" />
                </div>
              </div>
              {stats.pendingRetailerVerifications > 0 && (
                <Badge className="mt-2 bg-[#FFEB3B] text-black border-2 border-[#075E66]">
                  {stats.pendingRetailerVerifications} pending
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-none shadow-lg bg-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleStatClick("deliveryPartners")}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Delivery Partners
                  </p>
                  <p className="text-3xl font-bold text-black">
                    {stats.totalDeliveryPartners}
                  </p>
                  <p className="text-xs text-[#075E66] mt-1">
                    {stats.activeDeliveryPartners} online
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#075E66] bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#075E66]" />
                </div>
              </div>
              {stats.pendingDPVerifications > 0 && (
                <Badge className="mt-2 bg-[#FFEB3B] text-black border-2 border-[#075E66]">
                  {stats.pendingDPVerifications} pending
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card
            className="border-none shadow-lg bg-white cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleStatClick("customers")}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customers</p>
                  <p className="text-3xl font-bold text-black">
                    {stats.totalCustomers}
                  </p>
                  <p className="text-xs text-[#075E66] mt-1">
                    Total registered
                  </p>
                </div>
                <div className="w-12 h-12 bg-[#FFEB3B] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#075E66]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white bg-opacity-20">
            <TabsTrigger
              value="overview"
              className="text-white data-[state=active]:bg-[#FFEB3B] data-[state=active]:text-black font-bold"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="sellers"
              className="text-white data-[state=active]:bg-[#FFEB3B] data-[state=active]:text-black font-bold"
            >
              Sellers ({stats.totalRetailers})
            </TabsTrigger>
            <TabsTrigger
              value="delivery_partners"
              className="text-white data-[state=active]:bg-[#FFEB3B] data-[state=active]:text-black font-bold"
            >
              Delivery Partners ({stats.totalDeliveryPartners})
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="text-white data-[state=active]:bg-[#FFEB3B] data-[state=active]:text-black font-bold"
            >
              Customers ({stats.totalCustomers})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-black">
                            {order.customer_name}
                          </p>
                          {order.active_retailer_info && (
                            <p className="text-xs text-gray-600">
                              {order.active_retailer_info.retailer_name} •{" "}
                              {
                                order.active_retailer_info
                                  .retailer_business_name
                              }
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            order.status === "delivered"
                              ? "bg-[#075E66] text-white"
                              : order.status === "en_route"
                                ? "bg-[#FFEB3B] text-black"
                                : "bg-gray-400 text-white"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Sellers Online
                      </span>
                      <span className="font-bold text-black">
                        {stats.activeRetailers}/{stats.totalRetailers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Delivery Partners Online
                      </span>
                      <span className="font-bold text-black">
                        {stats.activeDeliveryPartners}/
                        {stats.totalDeliveryPartners}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Admins Online
                      </span>
                      <span className="font-bold text-black">
                        {stats.onlineAdmins}/{stats.totalAdmins}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Active Deliveries
                      </span>
                      <span className="font-bold text-[#075E66]">
                        {stats.activeOrders}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        SLA Breaches
                      </span>
                      <span className="font-bold text-red-600">
                        {stats.slaBreaches}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>All Sellers</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search sellers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredSellers.map((seller) => (
                    <div
                      key={seller.id}
                      onClick={() =>
                        setSelectedDetail({ type: "seller", data: seller })
                      }
                      className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {seller.shop_photos?.[0]?.url ? (
                          <img
                            src={resolveImageUrl(seller.shop_photos[0].url)}
                            alt={seller.business_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#FFEB3B]"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#FFEB3B] bg-opacity-20 rounded-full flex items-center justify-center">
                            <Store className="w-6 h-6 text-[#075E66]" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-black">
                            {seller.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {seller.business_name}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {seller.phone}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {seller.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            seller.availability_status === "online"
                              ? "bg-[#075E66] text-white"
                              : "bg-gray-400 text-white"
                          }
                        >
                          {seller.availability_status || "offline"}
                        </Badge>
                        {seller.rating && (
                          <Badge className="bg-[#FFEB3B] text-black">
                            ⭐ {seller.rating}
                          </Badge>
                        )}
                        {seller.banned_status === 1 && (
                          <Badge className="bg-red-600 text-white">
                            BANNED
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setSelectedDetail({ type: "seller", data: seller })
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {seller.banned_status === 1 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanSeller(seller);
                            }}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            className="border-red-600 text-red-600"
                            disabled={actionLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBanSeller(seller);
                            }}
                          >
                            Ban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#FFEB3B] text-[#075E66]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateSeller(seller);
                          }}
                        >
                          Rate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Partners Tab */}
          <TabsContent value="delivery_partners" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>All Delivery Partners</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search delivery partners..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredDeliveryPartners.map((dp) => (
                    <div
                      key={dp.id}
                      onClick={() =>
                        setSelectedDetail({
                          type: "delivery_partner",
                          data: dp,
                        })
                      }
                      className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        {dp.selfie && !imgError ? (
                          <img
                            src={dp.selfie}
                            alt={dp.name}
                            onError={() => setImgError(true)} // IMAGE FAILS → SWITCH TO LETTER
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#FFEB3B]"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#075E66] bg-opacity-10 rounded-full flex items-center justify-center">
                            <span className="text-[#075E66] font-bold text-lg">
                              {dp.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-black">{dp.name}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {dp.vehicle_type?.replace("_", " ")}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {dp.phone}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {dp.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            dp?.availability_status === "online"
                              ? "bg-[#075E66] text-white"
                              : "bg-gray-400 text-white"
                          }
                        >
                          {dp?.availability_status || "offline"}
                        </Badge>
                        {dp?.delivery_partner?.rating && (
                          <Badge className="bg-[#FFEB3B] text-black">
                            ⭐ {dp?.delivery_partner?.rating}
                          </Badge>
                        )}
                        {dp.banned === 1 && (
                          <Badge className="bg-red-600 text-white">
                            BANNED
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setSelectedDetail({
                              type: "delivery_partner",
                              data: dp,
                            })
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {dp.banned === 1 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnbanDeliveryPartner(dp);
                            }}
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBanDeliveryPartner(dp);
                            }}
                          >
                            Ban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#FFEB3B] text-[#075E66]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateDeliveryPartner(dp);
                          }}
                        >
                          Rate
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>All Customers</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredCustomers.map((customer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setSelectedDetail({ type: "customer", data: customer })
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FFEB3B] bg-opacity-20 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-[#075E66]" />
                        </div>
                        <div>
                          <p className="font-semibold text-black">
                            {customer.name}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {customer.totalOrders} orders
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ₹{customer.totalSpent}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        {selectedDetail && (
          <Dialog open onOpenChange={() => setSelectedDetail(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedDetail.type === "seller" && "Seller Details"}
                  {selectedDetail.type === "delivery_partner" &&
                    "Delivery Partner Details"}
                  {selectedDetail.type === "customer" && "Customer Details"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Seller Details */}
                {selectedDetail.type === "seller" && (
                  <>
                    <div className="flex items-center gap-4">
                      {selectedDetail.data.shop_photos?.[0]?.url ? (
                        <img
                          src={resolveImageUrl(
                            selectedDetail.data.shop_photos[0].url,
                          )}
                          alt={selectedDetail.data.business_name}
                          className="w-24 h-24 rounded-lg object-cover border-4 border-[#FFEB3B]"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-[#FFEB3B] bg-opacity-20 rounded-lg flex items-center justify-center">
                          <Store className="w-12 h-12 text-[#075E66]" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-black">
                          {selectedDetail.data.name}
                        </h3>
                        <p className="text-gray-600">
                          {selectedDetail.data.business_name}
                        </p>
                        <Badge className="mt-2 bg-[#075E66] text-white">
                          {selectedDetail.data.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Primary Phone</p>
                        <p className="font-semibold text-black flex items-center gap-2">
                          <Phone className="w-4 h-4" />{" "}
                          {selectedDetail.data.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-black flex items-center gap-2">
                          <Mail className="w-4 h-4" />{" "}
                          {selectedDetail.data.email}
                        </p>
                      </div>
                      {selectedDetail?.data?.alternate_phones?.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500 mb-2">
                            Additional Contacts
                          </p>
                          {selectedDetail.data.alternate_phones.map(
                            (phone, idx) => (
                              <p
                                key={idx}
                                className="text-sm text-black flex items-center gap-2 mb-1"
                              >
                                <Phone className="w-3 h-3" /> {phone.number} (
                                {phone.label})
                              </p>
                            ),
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-gray-500">GST Number</p>
                        <p className="font-semibold text-black">
                          {selectedDetail.data.gst_number || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-semibold text-black">
                          {selectedDetail?.data?.account_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IFSC</p>
                        <p className="font-semibold text-black">
                          {selectedDetail?.data?.ifsc || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge
                          className={
                            selectedDetail.data.availability_status === "online"
                              ? "bg-[#075E66] text-white"
                              : "bg-gray-400 text-white"
                          }
                        >
                          {selectedDetail.data.availability_status || "offline"}
                        </Badge>
                      </div>
                    </div>

                    {selectedDetail.data.shop_photos?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">
                          Shop Photos
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedDetail.data.shop_photos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={resolveImageUrl(photo.url)}
                              alt={`Shop ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-[#FFEB3B]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Delivery Partner Details */}
                {selectedDetail.type === "delivery_partner" && (
                  <>
                    <div className="flex items-center gap-4">
                      {selectedDetail.data.selfie ? (
                        <img
                          src={selectedDetail.data.selfie}
                          alt={selectedDetail.data.name}
                          className="w-24 h-24 rounded-lg object-cover border-4 border-[#FFEB3B]"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-[#075E66] bg-opacity-10 rounded-lg flex items-center justify-center">
                          <Users className="w-12 h-12 text-[#075E66]" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-black">
                          {selectedDetail.data.name}
                        </h3>
                        <p className="text-gray-600 capitalize">
                          {selectedDetail.data.vehicle_type?.replace("_", " ")}
                        </p>
                        {/* <Badge className="mt-2 bg-[#075E66] text-white">
                          {selectedDetail.data.status}
                        </Badge> */}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Primary Phone</p>
                        <p className="font-semibold text-black flex items-center gap-2">
                          <Phone className="w-4 h-4" />{" "}
                          {selectedDetail.data.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-semibold text-black flex items-center gap-2">
                          <Mail className="w-4 h-4" />{" "}
                          {selectedDetail.data.email}
                        </p>
                      </div>
                      {selectedDetail.data.delivery_partner.alternate_phone && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500 mb-2">
                            Additional Contact
                          </p>
                          {selectedDetail.data.delivery_partner.alternate_phone}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Driving License</p>
                        <p className="font-semibold text-black">
                          {selectedDetail.data.delivery_partner.dl_number ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vehicle Number</p>
                        <p className="font-semibold text-black">
                          {selectedDetail.data.delivery_partner
                            .vehicle_number || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge
                          className={
                            selectedDetail.data.delivery_partner
                              .availability_status === "online"
                              ? "bg-[#075E66] text-white"
                              : "bg-gray-400 text-white"
                          }
                        >
                          {selectedDetail.data.delivery_partner
                            .availability_status || "offline"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Deliveries
                        </p>
                        <p className="font-semibold text-black">
                          {selectedDetail.data.total_deliveries || 0}
                        </p>
                      </div>
                    </div>

                    {selectedDetail.data.bank_account && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Bank Details
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Account:</span>
                            <p className="font-mono text-black">
                              {selectedDetail.data.bank_account.account_number}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">IFSC:</span>
                            <p className="font-mono text-black">
                              {selectedDetail.data.bank_account.ifsc}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Customer Details */}
                {selectedDetail.type === "customer" && (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-[#FFEB3B] bg-opacity-20 rounded-lg flex items-center justify-center">
                        <Users className="w-12 h-12 text-[#075E66]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black">
                          {selectedDetail.data.name}
                        </h3>
                        <p className="text-gray-600">Customer</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold text-black flex items-center gap-2">
                          <Phone className="w-4 h-4" />{" "}
                          {selectedDetail.data.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Orders</p>
                        <p className="font-semibold text-black">
                          {selectedDetail.data.totalOrders}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Spent</p>
                        <p className="font-semibold text-black">
                          ₹{selectedDetail.data.totalSpent}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Recent Orders
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedDetail.data.orders
                          ?.slice(0, 5)
                          .map((order) => (
                            <div
                              key={order.id}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-sm text-black">
                                    {order.website_ref ||
                                      `#${order.id.slice(0, 8)}`}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(
                                      order.created_date,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-black">
                                    ₹{order.amount}
                                  </p>
                                  <Badge className="text-xs mt-1">
                                    {order.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg z-50">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

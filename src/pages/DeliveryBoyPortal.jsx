import React, { useState, useEffect, useRef } from "react";
import {
  DeliveryPartner,
  Order,
  Retailer,
  User,
} from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, NavigationIcon } from "lucide-react";
import {
  Package,
  LogOut,
  RefreshCw,
  AlertCircle,
  Store,
  Monitor,
  Smartphone,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";
import { AuthApi } from "@/components/utils/authApi";

import SelectRetailers from "../components/delivery/SelectRetailers";
import { API_BASE_URL } from "@/config";
import DeliveryStatusModal from "@/components/DeliveryStatusModal";
import LiveTrackingMapAvailableOrders from "@/components/LiveTrackingMapAvailableOrders";

export default function DeliveryBoyPortal() {
  const [partner, setPartner] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [directions, setDirections] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    today: 0,
    available: 0,
  });
  const watchIdRef = useRef(null);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("user");

    if (!token || !user) {
      window.location.href = createPageUrl("DeliveryBoyLogin");
      return;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const data = await deliveryPartnerApi.getNotifications(token);
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch (error) {
        console.error("Notification fetch error:", error);
      }
    };
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      const user = JSON.parse(sessionStorage.getItem("user"));

      const allPartners = await deliveryPartnerApi.list();

      const myPartners = await deliveryPartnerApi.getByUserId(user.id);

      if (!myPartners) {
        setError("No delivery partner found for this user.");
        setLoading(false);
        return;
      }

      if (myPartners.length === 0) {
        window.location.href = createPageUrl("DeliveryPartnerOnboarding");
        return;
      }

      let partnerData = myPartners[0];

      setPartner(partnerData);

      const notifyData = await deliveryPartnerApi.getNotifications(token);
      setNotifications(notifyData.notifications);
      setUnreadCount(notifyData.unread_count);

      const statsData = await deliveryPartnerApi.getStats(partnerData.id);
      setStats(statsData);

      const allOrders = await deliveryPartnerApi.getAvailableOrders();
      const myDeliveries = await deliveryPartnerApi.getMyDeliveries(
        partnerData.id
      );
      const combinedOrders = [...allOrders, ...myDeliveries];
      //const combinedOrders = [ ...myDeliveries];

      setOrders(combinedOrders);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem("token");
      console.log(token);
      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/notifications/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      console.log(data);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/notifications/${id}/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking single notification as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await AuthApi.logout();

      if (!response.ok) throw new Error("Logout failed");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      window.location.href = createPageUrl("PortalSelector");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  useEffect(() => {
    if (!partner) return;

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Sending live location:", latitude, longitude);

        try {
          await fetch(`${API_BASE_URL}/api/delivery-partner/live-location`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              delivery_partner_id: partner.id,
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          console.error("Error sending live location:", error);
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [partner]);

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-white mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#FFEB3B] text-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={loadData}
                variant="outline"
                size="icon"
                className="border-2 border-[#FFEB3B] text-[#FFEB3B] relative"
              >
                <div
                  className="relative cursor-pointer"
                  onClick={markAllAsRead}
                >
                  <Bell className="w-6 h-6 text-[#FFEB3B]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Button>
              <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => alert("Notifications coming soon!")}
                >
                  <Bell className="w-6 h-6 text-[#FFEB3B]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-2 border-[#FFEB3B] text-[#FFEB3B] hover:bg-[#FFEB3B] hover:text-black"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEB3B] mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Delivery Portal...</p>
        </div>
      </div>
    );
  }

  // NO PARTNER STATE
  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              No Profile Found
            </h2>
            <p className="text-white mb-4">Complete onboarding first.</p>
            <Button
              onClick={() =>
                (window.location.href = createPageUrl(
                  "DeliveryPartnerOnboarding"
                ))
              }
              className="bg-[#FFEB3B] text-black"
            >
              Go to Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate orders
  const availableOrders = orders.filter(
    (o) =>
      o.delivery_status !== "delivered" &&
      o.delivery_status !== "cancelled" &&
      !o.assign_delivery_boy
  );

  const myActiveDeliveries = orders.filter(
    (o) =>
      o.assign_delivery_boy === partner.id &&
      !["delivered", "cancelled"].includes(o.delivery_status)
  );

  const completedToday = orders.filter((o) => {
    if (
      o.assign_delivery_boy?.id !== partner.id ||
      o.delivery_status !== "delivered"
    )
      return false;
    const today = new Date().toDateString();
    return (
      new Date(o.actual_delivery_time || o.updated_date).toDateString() ===
      today
    );
  }).length;

  // MAIN RENDER
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] ${
        mobileView ? "max-w-md mx-auto" : ""
      }`}
    >
      {/* Mobile View Toggle */}
      {typeof window !== "undefined" && window.innerWidth > 768 && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setMobileView(!mobileView)}
            variant="outline"
            size="sm"
            className="bg-white border-2 border-[#FFEB3B]"
          >
            {mobileView ? (
              <Monitor className="w-4 h-4 mr-2" />
            ) : (
              <Smartphone className="w-4 h-4 mr-2" />
            )}
            <span className="text-black">
              {mobileView ? "Desktop" : "Mobile"} View
            </span>
          </Button>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4">
        {/* Header Card */}
        <div className="mb-6">
          <Card className="bg-[#075E66] border-2 border-[#FFEB3B]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFEB3B] rounded-full flex items-center justify-center text-black font-bold text-xl">
                    {partner.name?.[0]?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {partner.name}
                    </h2>
                    <p className="text-[#FFEB3B] text-base">{partner.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setShowDropdown(!showDropdown);
                        if (!showDropdown && unreadCount > 0) {
                          markAllAsRead();
                        }
                      }}
                    >
                      <Bell className="w-6 h-6 text-[#FFEB3B]" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-2 z-50">
                        {notifications.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-2">
                            No notifications
                          </p>
                        ) : (
                          notifications.map((n, index) => (
                            <div
                              key={n.id}
                              className={`p-2 border-b last:border-0 text-sm cursor-pointer ${
                                n.read_at ? "bg-gray-100" : "bg-yellow-50"
                              }`}
                              onClick={() => markNotificationAsRead(n.id)}
                            >
                              <p className="font-semibold">
                                {n.data?.title || "Notification"}
                              </p>
                              <p>{n.data?.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* 🚪 Logout Button */}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-2 border-[#FFEB3B] text-[#FFEB3B] hover:bg-[#FFEB3B] hover:text-black"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Card */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">My Stats</h3>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Active</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {stats.active}
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-gray-600">Today</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {stats.today}
                </p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Available</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {stats.available}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available">
                  Available Orders
                  {availableOrders.length > 0 && (
                    <Badge className="ml-2 bg-red-500">
                      {availableOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">
                  My Deliveries
                  {myActiveDeliveries.length > 0 && (
                    <Badge className="ml-2 bg-blue-500">
                      {myActiveDeliveries.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="retailers">
                  <Store className="w-4 h-4 mr-2" />
                  My Sellers
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-4">
              <TabsContent value="available" className="mt-0">
                {availableOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Orders Available
                    </h3>
                    <p className="text-gray-500 text-sm">
                      New delivery requests will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableOrders.map((order) => (
                      <Card
                        key={order.id}
                        className="rounded-xl shadow-md border border-gray-300 overflow-hidden"
                      >
                        <CardContent className="p-4 space-y-4">
                          {/* Header */}
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">
                              {order.website_ref ||
                                `Order #${String(order.id)}`}
                            </h3>
                            <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full capitalize">
                              {order.payment_status}
                            </span>
                          </div>

                          {/* Product Section */}
                          <div className="border rounded-lg p-3 bg-white shadow-sm">
                            <p className="font-semibold text-gray-800 mb-1">
                              📦 Product Details
                            </p>
                            {order.items?.map((item, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-700 leading-5"
                              >
                                <p className="font-semibold">{item.name}</p>
                                <p>
                                  Qty: {item.quantity} | Price: ₹{item.price}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Pickup → Delivery UI block */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            {/* PICKUP */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-blue-600 text-white grid place-content-center rounded-full text-xs font-semibold">
                                P
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">
                                  Pickup Location
                                </p>
                                <p className="text-gray-700 text-sm">
                                  <span className="font-semibold">
                                    Retailer:
                                  </span>{" "}
                                  {order.retailer?.retailer_name} 
                                </p>
                                <p className="text-gray-700 text-sm">
                                  {order.pickup_address?.street},{" "}
                                  {order.pickup_address?.city}
                                </p>
                              </div>
                            </div>

                            {/* Route line */}
                            <div className="h-7 border-l-2 border-dashed border-gray-400 ml-[13px] my-1"></div>

                            {/* DELIVERY */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-red-600 text-white grid place-content-center rounded-full text-xs font-semibold">
                                D
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">
                                  Delivery Location
                                </p>
                                <p className="text-gray-700 text-sm">
                                  {order.drop_address?.street},{" "}
                                  {order.drop_address?.city} —{" "}
                                  {order.drop_address?.pincode}
                                </p>
                                <p className="text-gray-700 text-sm">
                                  <span className="font-semibold">
                                    Customer:
                                  </span>{" "}
                                  {order.customer_name} ({order.customer_phone})
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Map */}
                          
                          <div className="rounded-lg overflow-hidden border shadow-sm">
                            <LiveTrackingMapAvailableOrders
                              orderId={order.id}
                              deliveryBoyId={partner.id}
                              pickupLat={order?.pickup_address?.latitude ?? null}
                              pickupLng={order?.pickup_address?.longitude ?? null}
                              dropLat={order?.drop_address?.latitude ?? null}
                              dropLng={order?.drop_address?.longitude ?? null}
                            />
                          </div>
                            
                          {/* Distance + Amount */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">
                              Distance:{" "}
                              <span className="font-bold">
                                {order.distance_km} km away
                              </span>
                            </span>
                            <span className="text-2xl font-bold text-gray-900">
                              ₹{order.amount}
                            </span>
                          </div>

                          {/* Accept */}
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg"
                            onClick={async () => {
                              try {
                                const response =
                                  await deliveryPartnerApi.acceptOrder(
                                    order.id,
                                    partner.id
                                  );
                                loadData();
                              } catch (error) {
                                console.log(error.message);
                              }
                            }}
                          >
                            Accept Delivery
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                {/* If NO active deliveries */}
                {myActiveDeliveries.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    No active deliveries found.
                  </p>
                ) : (
                  // If deliveries exist
                  <div className="space-y-4">
                    {myActiveDeliveries.map((order) => (
                      <Card
                        key={order.id}
                        className="border-2 border-blue-500"
                       
                      >
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg mb-2">
                            {order.website_ref || `Order #${order.id}`}
                          </h3>

                          <div className="border rounded-lg p-3 bg-white shadow-sm">
                            <p className="font-semibold text-gray-800 mb-1">
                              📦 Product Details
                            </p>
                            {order.items?.map((item, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-700 leading-5"
                              >
                                <p className="font-semibold">{item.name}</p>
                                <p>
                                  Qty: {item.quantity} | Price: ₹{item.price}
                                </p>
                              </div>
                            ))}
                          </div>

                           <div className="bg-gray-50 rounded-xl p-4">
                           

                            {/* DELIVERY */}
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 bg-red-600 text-white grid place-content-center rounded-full text-xs font-semibold">
                                D
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">
                                  Delivery Location
                                </p>
                                <p className="text-gray-700 text-sm">
                                  {order.drop_address?.street},{" "}
                                  {order.drop_address?.city} —{" "}
                                  {order.drop_address?.pincode}
                                </p>
                                <p className="text-gray-700 text-sm">
                                  <span className="font-semibold">
                                    Customer:
                                  </span>{" "}
                                  {order.customer_name} ({order.customer_phone})
                                </p>
                              </div>
                            </div>
                          </div>


                          <div className="mt-3">
                            <LiveTrackingMapAvailableOrders
                              orderId={order.id}
                              deliveryBoyId={partner.id}
                              pickupLat={order?.pickup_address?.latitude ?? null}
                              pickupLng={order?.pickup_address?.longitude ?? null}
                              dropLat={order?.drop_address?.latitude ?? null}
                              dropLng={order?.drop_address?.longitude ?? null}
                            />
                          </div>

                          <p className="text-sm text-gray-600 mb-4">
                            📍 {order.drop_address?.street},{" "}
                            {order.drop_address?.city}
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            <span>Distance:</span>
                            <span className="font-medium">
                              {order.distance_km} km
                            </span>
                          </p>

                          <Badge className="bg-blue-500 text-white cursor-pointer"  onClick={() => setSelectedOrder(order)} >
                            Status: {order.delivery_status === "accepted_db" ? 'Accepted' : order.delivery_status}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Modal OUTSIDE list */}
                {selectedOrder && (
                  <DeliveryStatusModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={loadData}
                  />
                )}
              </TabsContent>

              <TabsContent value="retailers" className="mt-0">
                <SelectRetailers deliveryPartnerId={partner.id} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

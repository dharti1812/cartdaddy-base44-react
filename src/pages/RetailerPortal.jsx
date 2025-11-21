import React, { useState, useEffect } from "react";
import { OrderApi } from "@/components/utils/orderApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuthApi } from "@/components/utils/authApi";

import {
  Bell,
  Package,
  AlertCircle,
  LogOut,
  RefreshCw,
  Users,
  Monitor,
  Smartphone,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";
import { API_BASE_URL } from "../../src/config";
import AvailableOrders from "../components/retailer/AvailableOrders";
import ActiveDeliveries from "../components/retailer/ActiveDeliveries";
import TrackOrderMap from "../components/TrackOrderMap";
import CompletedOrders from "../components/retailer/CompletedOrders";
import RetailerStats from "../components/retailer/RetailerStats";
import OrderNotificationSound from "../components/retailer/OrderNotificationSound";
import DeviceSessionManager from "../components/retailer/DeviceSessionManager";
import CODToggle from "../components/retailer/CODToggle";
import AssignDeliveryBoy from "../components/retailer/AssignDeliveryBoy";
import HandoffDeliveryBoy from "../components/retailer/HandoffDeliveryBoy";
import ManageDeliveryBoys from "../components/retailer/ManageDeliveryBoys";

export default function SellerPortal() {
  const [sellerProfile, setSellerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState(false);

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);
  const [showHandoffDialog, setShowHandoffDialog] = useState(false);
  const [selectedOrderForHandoff, setSelectedOrderForHandoff] = useState(null);
  const [myAcceptedOrders, setMyAcceptedOrders] = useState([]);
  const [completedOrders, setMyCompletedOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const loadData = async () => {
    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        window.location.href = createPageUrl("RetailerLogin");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/retailer`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        window.location.href = createPageUrl("RetailerLogin");
        return;
      }

      const sellerProfile = await res.json();
      console.log("🚀 Loaded seller profile:", sellerProfile);

      if (!sellerProfile.id) {
        window.location.href = createPageUrl("RetailerOnboarding");
        return;
      }

      setSellerProfile(sellerProfile);

      const allOrders = await OrderApi.PendingAcceptanceOrders();
      setOrders(allOrders?.data || []);

      const acceptedOrders = await OrderApi.AcceptedOrders();

      setMyAcceptedOrders(acceptedOrders?.data || []);

      const completedOrders = await OrderApi.CompletedOrders();
      setMyCompletedOrders(completedOrders.data || []);

      try {
        const statsData = await OrderApi.getSellerStats();
        console.log("Stats:", statsData);

        setStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error loading portal:", error);
        setError(error.message || "Something went wrong");
        setLoading(false);
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Error loading portal:", error);
      setError(error.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleNewOrder = (newOrders) => {
    loadData();
    setShowNewOrderAlert(true);
    setActiveTab("available");
    setTimeout(() => setShowNewOrderAlert(false), 5000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userData = sessionStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;

      if (user && token) {
        await fetch(`${API_BASE_URL}/api/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: user.id,
            availability_status: "offline",
            last_seen: new Date().toISOString(),
          }),
        });
      }

      if (window.heartbeatInterval) clearInterval(window.heartbeatInterval);
      if (window.statusInterval) clearInterval(window.statusInterval);

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      window.location.href = createPageUrl("PortalSelector");
    } catch (error) {
      console.error("❌ Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Error Loading Portal
            </h2>
            <p className="text-white text-opacity-80 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-[#F4B321]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex-1 border-white text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4B321] mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading Seller Portal...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-white text-opacity-80 mb-4">
              Your seller profile could not be loaded or is not approved.
            </p>
            <Button
              onClick={() =>
                (window.location.href = createPageUrl("RetailerOnboarding"))
              }
              className="bg-[#F4B321]"
            >
              Go to Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  console.log("All Orders:", orders);
  const availableOrders = orders.filter((o) => {
    const alreadyAccepted = o.accepted_retailers?.some(
      (ar) => ar.retailer_id === sellerProfile?.id
    );
    return o.status === "pending" && !alreadyAccepted;
  });
  console.log("Available Orders:", availableOrders);
  const myActiveOrders = myAcceptedOrders;

  const activeOrders = myAcceptedOrders.filter((o) =>
    o.accepted_retailers?.some(
      (ar) =>
        ar.retailer_id === sellerProfile?.id &&
        !["delivered", "cancelled"].includes(ar.status)
    )
  );

  // const myCompletedOrders = orders.filter((o) =>
  //   o.accepted_retailers?.some(
  //     (ar) =>
  //       ar.retailer_id === sellerProfile?.id &&
  //       ["delivered", "cancelled"].includes(ar.status)
  //   )
  // );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] font-sans ${
        mobileView ? "max-w-md mx-auto" : ""
      }`}
    >
      {/* <DeviceSessionManager
        retailerId={sellerProfile?.id}
        onSessionConflict={() => setSessionConflict(true)}
      /> */}

      <div className="bg-[#075E66] text-white p-3 sm:p-4 sticky top-0 z-10 shadow-lg border-b-4 border-[#FFEB3B]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png"
                alt="Cart Daddy Logo"
                className="h-12 sm:h-15 w-auto"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  {sellerProfile?.name}
                </h1>
                <p className="text-[#FFEB3B] text-base sm:text-lg font-bold">
                  {sellerProfile?.business_name || "Seller Portal"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                className={`${
                  sellerProfile?.user?.availability_status === "online"
                    ? "bg-[#FFEB3B] text-gray-900 font-bold"
                    : "bg-gray-500 text-white font-bold"
                } border-0 text-base sm:text-lg px-3 py-1.5`}
              >
                <div className="w-2 h-2 bg-white rounded-full mr-1 sm:mr-2 animate-pulse"></div>
                {sellerProfile?.availability_status}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="text-[#FFEB3B] h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/20"
                onClick={loadData}
                title="Refresh orders"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 h-8 w-8 sm:h-10 sm:w-10 hover:bg-white/20"
                onClick={handleLogout}
                title="Logout from seller profile"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>

          <RetailerStats
            retailer={sellerProfile}
            stats={stats}
            activeOrders={stats?.active_orders_count ?? myActiveOrders.length}
            completedToday={stats?.todays_orders_count ?? 0}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* <OrderNotificationSound
          retailerId={sellerProfile?.id}
          onNewOrder={handleNewOrder}
        />

        {sessionConflict && (
          <Alert className="mb-4 bg-amber-50 border-2 border-amber-500">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <AlertDescription className="text-amber-900 font-semibold">
              ⚠️ Another device is trying to login. Only one device can be
              active at a time.
            </AlertDescription>
          </Alert>
        )} */}

        {showNewOrderAlert && (
          <Alert className="mb-4 bg-[#F4B321] border-[#F4B321] border-2 animate-pulse">
            <Bell className="w-5 h-5 text-gray-900" />
            <AlertDescription className="text-gray-900 font-bold text-lg">
              🎉 New Order Just Arrived! Check Available Orders Tab
            </AlertDescription>
          </Alert>
        )}

        {availableOrders.length > 0 && activeTab !== "available" && (
          <Alert className="mb-3 sm:mb-4 bg-[#F4B321] bg-opacity-20 border-2 border-[#F4B321]">
            <AlertDescription className="flex items-center justify-between text-sm">
              <span className="text-white font-bold">
                {availableOrders.length} new order
                {availableOrders.length > 1 ? "s" : ""} available!
              </span>
              <Button
                size="sm"
                onClick={() => setActiveTab("available")}
                className="bg-[#F4B321] hover:bg-[#F4B321] hover:opacity-90 text-gray-900 text-xs sm:text-sm font-bold"
              >
                View Orders
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-4">
          <CODToggle
            retailerId={sellerProfile?.id}
            retailerProfile={sellerProfile}
            onUpdate={loadData}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b">
              <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto bg-white border-2 border-[#F4B321]">
                <TabsTrigger
                  value="available"
                  className="relative text-xs sm:text-sm py-2 data-[state=active]:bg-[#F4B321] data-[state=active]:text-gray-900 data-[state=active]:font-bold"
                >
                  <span className="hidden sm:inline">Available Orders</span>
                  <span className="sm:hidden">Available</span>
                  {availableOrders.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-red-600 text-white border-0 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                      {availableOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="relative text-xs sm:text-sm py-2 data-[state=active]:bg-[#F4B321] data-[state=active]:text-gray-900 data-[state=active]:font-bold"
                >
                  <span className="hidden sm:inline">On Going Orders</span>
                  <span className="sm:hidden">Active</span>
                  {myAcceptedOrders.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-blue-600 text-white border-0 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                      {myAcceptedOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="relative text-xs sm:text-sm py-2 data-[state=active]:bg-[#F4B321] data-[state=active]:text-gray-900 data-[state=active]:font-bold"
                >
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>

                  {completedOrders.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-green-600 text-white border-0 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs font-bold">
                      {completedOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="delivery_boys"
                  className="text-xs sm:text-sm py-2 data-[state=active]:bg-[#F4B321] data-[state=active]:text-gray-900 data-[state=active]:font-bold"
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delivery Partners</span>
                  <span className="sm:hidden">Partners</span>
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-4">
              <TabsContent value="available">
                <AvailableOrders
                  orders={availableOrders}
                  retailerId={sellerProfile?.id}
                  config={sellerProfile}
                  onAccept={loadData}
                  retailerProfile={sellerProfile}
                />
              </TabsContent>

              <TabsContent value="active">
                <ActiveDeliveries
                  orders={activeOrders}
                  retailerId={sellerProfile?.id}
                  config={sellerProfile}
                  onUpdate={loadData}
                  retailerProfile={sellerProfile}
                  onTrackOrder={(orderId) => setActiveTab(`track-${orderId}`)}
                  onAssignDeliveryBoy={(order) => {
                    setSelectedOrderForAssign(order);
                    setShowAssignDialog(true);
                  }}
                  onHandoffDeliveryBoy={(order) => {
                    setSelectedOrderForHandoff(order);
                    setShowHandoffDialog(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="completed">
                <CompletedOrders orders={completedOrders} />
              </TabsContent>

              <TabsContent value="delivery_boys" className="mt-0">
                <ManageDeliveryBoys retailerId={sellerProfile?.id} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {showAssignDialog && selectedOrderForAssign && (
        <AssignDeliveryBoy
          order={selectedOrderForAssign}
          retailerProfile={sellerProfile}
          onClose={() => {
            setShowAssignDialog(false);
            setSelectedOrderForAssign(null);
          }}
          onAssigned={loadData}
        />
      )}

      {showHandoffDialog && selectedOrderForHandoff && (
        <HandoffDeliveryBoy
          order={selectedOrderForHandoff}
          retailerProfile={sellerProfile}
          onClose={() => {
            setShowHandoffDialog(false);
            setSelectedOrderForHandoff(null);
          }}
          onHandedOff={loadData}
        />
      )}
    </div>
  );
}

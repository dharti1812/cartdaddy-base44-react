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
import { Bell, Phone } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";
import { AuthApi } from "@/components/utils/authApi";

import SelectRetailers from "../components/delivery/SelectRetailers";
import { API_BASE_URL } from "@/config";
import DeliveryStatusModal from "@/components/DeliveryStatusModal";
import LiveTrackingMapAvailableOrders from "@/components/LiveTrackingMapAvailableOrders";
import DeliveryBoyProfileSettings from "@/components/DeliveryBoyProfileSettings";
import { calculateDeliveryCharges } from "../components/utils/deliveryChargeCalculator";
import { set } from "date-fns";

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
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    orderDetailId: null,
  });

  const [rejectData, setRejectData] = useState({
    reason: "",
    photo: null,
    video: null,
  });
  const [stats, setStats] = useState({
    active: 0,
    today: 0,
    available: 0,
  });
  const [confirmVerify, setConfirmVerify] = useState({
    open: false,
    type: null, // "imei" | "video"
    orderDetailId: null,
  });

  const watchIdRef = useRef(null);
  const notificationAudioRef = useRef(null);
  const prevUnreadCountRef = useRef(0);
  const [verifying, setVerifying] = useState(false);

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

        const newUnread = data.unread_count || 0;
        const oldUnread = prevUnreadCountRef.current;

        // 🔔 Only play if new unread notifications appear
        if (newUnread > oldUnread && notificationAudioRef.current) {
          notificationAudioRef.current.currentTime = 0;
          notificationAudioRef.current.play().catch((err) => {
            console.error("Audio play failed:", err);
          });
        }

        prevUnreadCountRef.current = newUnread;
        setNotifications(data.notifications || []);
        setUnreadCount(newUnread);
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
      console.log("✅ Delivery Partner Data:", partnerData);

      // const notifyData = await deliveryPartnerApi.getNotifications(token);
      // setNotifications(notifyData.notifications);
      // setUnreadCount(notifyData.unread_count);

      const statsData = await deliveryPartnerApi.getStats(partnerData.id);
      setStats(statsData);

      const allOrdersRes = await deliveryPartnerApi.getAvailableOrders();
      const myDeliveriesRes = await deliveryPartnerApi.getMyDeliveries(
        partnerData.id,
      );
      const completedDeliveriesRes =
        await deliveryPartnerApi.getMyCompletedDeliveries(partnerData.id);

      const allOrders = Array.isArray(allOrdersRes)
        ? allOrdersRes
        : (allOrdersRes?.data ?? []);
      const myDeliveries = Array.isArray(myDeliveriesRes)
        ? myDeliveriesRes
        : (myDeliveriesRes?.data ?? []);
      const completedDeliveries = Array.isArray(completedDeliveriesRes)
        ? completedDeliveriesRes
        : (completedDeliveriesRes?.data ?? []);

      const combinedOrders = [
        ...allOrders,
        ...myDeliveries,
        ...completedDeliveries,
      ];

      setOrders(combinedOrders);

      setLoading(false);
    } catch (error) {
      console.error("❌ Error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    const audio = notificationAudioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.error("Audio playback failed:", err);
    });
  };
  useEffect(() => {
    fetchDeliverySettings();
  }, []);
  const fetchDeliverySettings = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const resSettings = await fetch(
        `${API_BASE_URL}/api/delivery-partner/delivery-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const settingsData = await resSettings.json();
      console.log("Delivery Settings API Response:", settingsData);

      if (Array.isArray(settingsData) && settingsData.length > 0) {
        setDeliverySettings(settingsData[0]);
      } else {
        setDeliverySettings(null);
      }
    } catch (error) {
      console.error("Error fetching delivery settings:", error);
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
        },
      );
      const data = await res.json();
      console.log(data);
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleVerifyImei = async (orderDetailId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/verify-imei`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_detail_id: orderDetailId }),
        },
      );
      const data = await res.json();

      if (data.success) {
        toast.success("IMEI verified ✅");
        loadData();
      } else {
        toast.error(data.message || "Failed to verify IMEI");
      }
    } catch (err) {
      toast.error("Failed to verify IMEI");
    }
  };

  const handleVerifyVideo = async (orderDetailId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/verify-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ order_detail_id: orderDetailId }),
        },
      );
      const data = await res.json();

      if (data.success) {
        toast.success("Video verified ✅");
        loadData();
      } else {
        toast.error(data.message || "Failed to verify video");
      }
    } catch (err) {
      toast.error("Failed to verify video");
    }
  };

  const handleRejectImei = async () => {
    if (!rejectData.reason || !rejectData.photo || !rejectData.video) {
      toast.error("All fields are required");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");

      const formData = new FormData();
      formData.append("order_detail_id", rejectModal.orderDetailId);
      formData.append("type", rejectModal.type);
      formData.append("reason", rejectData.reason);
      formData.append("photo", rejectData.photo);
      formData.append("video", rejectData.video);

      const res = await fetch(
        `${API_BASE_URL}/api/delivery-partner/reject-imei`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await res.json();
     
      if (data.success) {
       toast.success(
          `${rejectModal.type.toUpperCase()} rejected successfully ❌`
        );
        setRejectModal({ open: false, orderDetailId: null,  type: null  });
        setRejectData({ reason: "", photo: null, video: null });
        loadData();
      } else {
        toast.error(data.message || "Failed to reject IMEI");
      }
    } catch (error) {
      toast.error("Something went wrong");
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
        },
      );
      const data = await res.json();

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking single notification as read:", error);
    }
  };

  const callCustomer = async (order) => {
    try {
      await fetch(`${API_BASE_URL}/api/click-to-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: partner.phone,
          to: order.customer_phone,
        }),
      });
    } catch (error) {
      console.error("SARV call failed", error);
      alert("Unable to connect call");
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
      alert("Geolocation is not supported by your device.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationEnabled(true); // ✅ location working

        // send location to server
        try {
          await fetch(`${API_BASE_URL}/api/delivery-partner/live-location`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

      // ❌ ERROR CALLBACK: location disabled
      (err) => {
        if (err.code === 1) {
          // permission denied
          setLocationEnabled(false);
        } else {
          console.error("Geolocation error:", err);
        }
      },

      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [partner]);

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

  if (!locationEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-Black mb-2">
              Location Disabled
            </h2>
            <p className="text-black mb-4">
              Please enable location services to use the delivery portal.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#FFEB3B] text-black"
            >
              Retry
            </Button>
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
                  "DeliveryPartnerOnboarding",
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
      !o.assign_delivery_boy,
  );

  const myActiveDeliveries = orders.filter(
    (o) =>
      o.assign_delivery_boy === partner.id &&
      !["delivered", "cancelled"].includes(o.delivery_status),
  );

  const completedDeliveries = orders.filter(
    (o) =>
      o.assign_delivery_boy === partner.id &&
      ["delivered"].includes(o.delivery_status),
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
      <audio
        ref={notificationAudioRef}
        src="/notification.mp3"
        preload="auto"
      />
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
                  <button
                    // 💡 CHANGE: Use state setter instead of window.location.href
                    onClick={() => setShowProfileModal(true)}
                    className="rounded-full overflow-hidden w-10 h-10 sm:w-12 sm:h-12 border-2 background-[#FFEB3B] border-[#FFEB3B] transition-shadow duration-300 hover:shadow-[0_0_0_4px_rgba(255,235,59,0.7)]"
                    title="View Profile Settings"
                  >
                    <img
                      src={`https://ui-avatars.com/api/?name=${partner.name}&background=FFEB3B&color=000&bold=true`}
                      alt={`${partner.name} profile`}
                      className="w-full h-full object-cover"
                    />
                  </button>
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
                          <p className="text-gray-500 text-sm text-center ">
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="available">
                  Available Deliveries
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
                <TabsTrigger value="completed">
                  Completed Deliveries
                  {completedDeliveries.length > 0 && (
                    <Badge className="ml-2 bg-blue-500">
                      {completedDeliveries.length}
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
                    {availableOrders.map((order) => {
                      let charges = null;

                      if (!deliverySettings) {
                        console.warn("⚠️ Delivery settings not available");
                      } else if (
                        order?.distance_km != null &&
                        order.amount != null
                      ) {
                        const totalDistance =
                          (order?.distances?.delivery_boy_to_pickup_km || 0) +
                          (order?.distances?.pickup_to_delivery_km || 0);
                        console.log(
                          "Total Distance:",
                          order?.distances?.delivery_boy_to_pickup_km,
                        );
                        charges = calculateDeliveryCharges(
                          order?.amount || 0,
                          order?.distances?.pickup_to_delivery_km || 0,
                          deliverySettings,
                        );
                      } else {
                        console.warn(
                          "⚠️ Order distance or amount is not defined",
                        );
                      }

                      // Delivery & fuel
                      const deliveryCharge = charges?.baseCharge || 0;
                      const fuelCost = charges?.fuelCost || 0;

                      return (
                        <Card
                          key={order.id}
                          className="rounded-xl shadow-md border border-gray-300 overflow-hidden"
                        >
                          <CardContent className="p-4 space-y-4">
                            {/* Header */}

                            <div className="flex justify-between items-center">
                              <h3 className="font-bold text-lg text-gray-900">
                                {order.website_ref ||
                                  `Order #${String(order.id)}`}{" "}
                                ({order.created_date})
                              </h3>
                              <span className=" py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full capitalize">
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
                                    {order.retailer.retailer_name}
                                  </p>
                                  <p className="text-gray-700 text-sm">
                                    {order.pickup_address?.street},{" "}
                                    {order.pickup_address?.city}
                                  </p>
                                  {order.distances
                                    ?.delivery_boy_to_pickup_km && (
                                    <p>
                                      🚴{" "}
                                      <span className="font-semibold">
                                        You → Pickup:
                                      </span>{" "}
                                      {
                                        order.distances
                                          .delivery_boy_to_pickup_km
                                      }{" "}
                                      km
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Route line */}
                              {/* <div className="h-7 border-l-2 border-dashed border-gray-400 ml-[13px] my-1"></div>  */}

                              {/* DELIVERY */}
                              <div className="flex items-start gap-3 mt-3">
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
                                  {order.delivery_status === "picked_up" && (
                                    <p className="text-gray-700 text-sm">
                                      <span className="font-semibold">
                                        Customer:
                                      </span>{" "}
                                      {order.customer_name}
                                    </p>
                                  )}

                                  {order.distances
                                    ?.delivery_boy_to_delivery_km && (
                                    <p>
                                      🚴{" "}
                                      <span className="font-semibold">
                                        Pickup → Delivery:
                                      </span>{" "}
                                      {order.distances.pickup_to_delivery_km} km
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {charges?.delivery_charge > 0 && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
                                <table className="w-full text-xs text-green-700">
                                  <tbody>
                                    <tr className="border-b">
                                      <td className="  font-medium">
                                        Your Location → Seller Point
                                      </td>
                                      <td className="  text-right font-semibold">
                                        {order.distances
                                          ?.delivery_boy_to_pickup_km ?? 0}{" "}
                                        km
                                      </td>
                                    </tr>

                                    <tr className="border-b">
                                      <td className="  font-medium">
                                        Seller Point → Customer Point
                                      </td>
                                      <td className="  text-right font-semibold">
                                        {order.distances
                                          ?.pickup_to_delivery_km ?? 0}{" "}
                                        km
                                      </td>
                                    </tr>

                                    <tr className="border-b bg-green-50">
                                      <td className="  font-semibold text-green-900">
                                        Total Distance
                                      </td>
                                      <td className="  text-right font-bold text-green-900">
                                        {(
                                          (order.distances
                                            ?.delivery_boy_to_pickup_km || 0) +
                                          (order.distances
                                            ?.pickup_to_delivery_km || 0)
                                        ).toFixed(2)}{" "}
                                        km
                                      </td>
                                    </tr>

                                    <tr className="border-b">
                                      <td className=" ">
                                        Fuel Cost (₹
                                        {deliverySettings?.fuel_cost_per_km ||
                                          5}
                                        /km)
                                      </td>
                                      <td className="  text-right font-medium">
                                        ₹{Math.round(charges?.fuelCost ?? 0)}
                                      </td>
                                    </tr>

                                    <tr className="border-b">
                                      <td className=" ">Delivery Charges</td>
                                      <td className="  text-right font-medium">
                                        ₹{charges?.baseCharge ?? 0}
                                      </td>
                                    </tr>

                                    <tr className="bg-emerald-100">
                                      <td className=" py-3 px-3 font-bold text-green-900">
                                        You will Earn
                                      </td>
                                      <td className=" py-3 text-right font-bold text-emerald-700">
                                        ₹{Math.round(fuelCost + deliveryCharge)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Map */}

                            <div className="rounded-lg overflow-hidden border shadow-sm">
                              <LiveTrackingMapAvailableOrders
                                orderId={order.id}
                                deliveryBoyId={partner.id}
                                pickupLat={
                                  order?.pickup_address?.latitude ?? null
                                }
                                pickupLng={
                                  order?.pickup_address?.longitude ?? null
                                }
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
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold  rounded-lg"
                              onClick={async () => {
                                try {
                                  const response =
                                    await deliveryPartnerApi.acceptOrder(
                                      order.id,
                                      partner.id,
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
                      );
                    })}
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
                    {myActiveDeliveries.map((order) => {
                      let charges = null;

                      if (!deliverySettings) {
                        console.warn("⚠️ Delivery settings not available");
                      } else if (
                        order?.distance_km != null &&
                        order.amount != null
                      ) {
                        const totalDistance =
                          (order?.distances?.delivery_boy_to_pickup_km || 0) +
                          (order?.distances?.pickup_to_delivery_km || 0);
                        console.log(
                          "Total Distance:",
                          order?.distances?.delivery_boy_to_pickup_km,
                        );
                        charges = calculateDeliveryCharges(
                          order?.amount || 0,
                          totalDistance,
                          deliverySettings,
                        );
                      } else {
                        console.warn(
                          "⚠️ Order distance or amount is not defined",
                        );
                      }

                      // Delivery & fuel
                      const deliveryCharge = charges?.baseCharge || 0;
                      const fuelCost = charges?.fuelCost || 0;
                      return (
                        <Card
                          key={order.id}
                          className="border-2 border-blue-500"
                        >
                          <CardContent className="p-4">
                            <h3 className="font-bold text-lg mb-2">
                              {order.website_ref || `Order #${order.id}`} (
                              {order.created_at})
                            </h3>

                            <div className="text-gray-700 text-sm flex items-center gap-2">
                              <Store className="w-4 h-4 text-gray-500" />

                              <span className="font-semibold">Retailer:</span>

                              <span>
                                {order.seller_id === 9
                                  ? "Admin"
                                  : order.retailer_name || "Not Assigned"}
                              </span>

                              {order.retailer_phone && (
                                <>
                                  <span className="text-gray-400">|</span>

                                  <a
                                    href={`tel:${order.retailer_phone}`}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded
                 border border-green-600 text-green-700
                 hover:bg-green-50 hover:text-green-800
                 transition"
                                    aria-label="Call retailer"
                                  >
                                    <Phone className="w-3 h-3" />
                                    Call
                                  </a>
                                </>
                              )}
                            </div>

                            <p className="text-gray-700 text-sm">
                              <span className="font-semibold">
                                Pickup Address:
                              </span>{" "}
                              {order.pickup_address
                                ? `${order.pickup_address.street}, ${order.pickup_address.city}`
                                : "Not Assigned"}
                            </p>

                            <div className="border rounded-lg p-3 bg-white shadow-sm mt-2">
                              <p className="font-semibold text-gray-800 mb-1">
                                📦 Product Details
                              </p>
                              {order.items?.map((item, index) => (
                                <div
                                  key={item.order_detail_id || item.id}
                                  className="text-sm text-gray-700 leading-5 border-b pb-2 mb-2"
                                >
                                  <p className="font-semibold">{item.name}</p>

                                  <p>
                                    Qty: {item.quantity} | Price: ₹{item.price}
                                  </p>
                                  <p>
                                    <span className="font-semibold">IMEI:</span>{" "}
                                    {item.imei_number || "Not Available"}
                                    {/* ✅ VERIFIED */}
                                    {item.imei_verified === 1 && (
                                      <span className="text-green-600 font-semibold ml-2">
                                        ✅ Verified
                                      </span>
                                    )}
                                    {/* ❌ REJECTED */}
                                    {item.imei_verified === 0 &&
                                      item.imei_reject_count > 0 && (
                                        <span className="text-red-600 font-semibold ml-2 flex items-center gap-1 inline-flex">
                                          ❌ Rejected
                                        </span>
                                      )}
                                    {/* 🔘 VERIFY / REJECT BUTTONS */}
                                    {order.delivery_status ===
                                      "reached_to_seller" &&
                                      item.imei_number &&
                                      item.imei_verified !== 1 &&
                                      (!item.imei_reject_count ||
                                        item.imei_reject_count === 0) && (
                                        <>
                                          <button
                                            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            onClick={() =>
                                              setConfirmVerify({
                                                open: true,
                                                type: "imei",
                                                orderDetailId:
                                                  item.order_id, // ⚠️ use order_detail_id
                                              })
                                            }
                                          >
                                            Verify
                                          </button>

                                          <button
                                            className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            onClick={() =>
                                              setRejectModal({
                                                open: true,
                                                type: "imei",
                                                orderDetailId:
                                                  item.order_id, // ⚠️ use order_detail_id
                                              })
                                            }
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}
                                  </p>

                                  {/* Packaging Video */}
                                  <p>
                                    <span className="font-semibold">
                                      Packaging Video:
                                    </span>{" "}
                                    {item.video_path ? (
                                      <>
                                        <button
                                          className="ml-2 text-blue-600 underline"
                                          onClick={() =>
                                            setShowVideoModal(item.order_id)
                                          }
                                        >
                                          View Video
                                        </button>

                                        {/* Video Modal */}
                                        <Dialog
                                          open={
                                            showVideoModal === item.order_id
                                          }
                                          onOpenChange={() =>
                                            setShowVideoModal(null)
                                          }
                                        >
                                          <DialogContent className="max-w-lg">
                                            <DialogHeader>
                                              <DialogTitle>
                                                📹 Packaging Video
                                              </DialogTitle>
                                            </DialogHeader>

                                            <video
                                              controls
                                              autoPlay
                                              className="w-full h-64 rounded-md bg-black"
                                              src={`${API_BASE_URL}/public/${item.video_path}`}
                                            ></video>

                                            <div className="mt-4 text-right">
                                              <button
                                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                                onClick={() =>
                                                  setShowVideoModal(null)
                                                }
                                              >
                                                Close
                                              </button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>

                                        {/* Video Verify Button */}
                                        {order.delivery_status ===
                                          "reached_to_seller" &&
                                          item.video_verified !== 1 &&  item.video_reject_count === 0 && (
                                            <>
                                            <button
                                              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                              onClick={() =>
                                                setConfirmVerify({
                                                  open: true,
                                                  type: "video",
                                                  orderDetailId: item.order_id,
                                                })
                                              }
                                            >
                                              Verify
                                            </button>
                                             <button
                                            className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            onClick={() =>
                                              setRejectModal({
                                                open: true,
                                                type: "video",
                                                orderDetailId:
                                                  item.order_id, // ⚠️ use order_detail_id
                                              })
                                            }
                                          >
                                            Reject
                                          </button>
                                          </>
                                          )}

                                        {item.video_verified === 1 && (
                                          <span className="text-green-600 font-semibold ml-2">
                                            ✅ Verified
                                          </span>
                                        )}

                                        {item.video_verified === 0 &&
                                        item.video_reject_count > 0 && (
                                          <span className="text-red-600 font-semibold ml-2 flex items-center gap-1 inline-flex">
                                            ❌ Rejected
                                          </span>
                                      )}
                                      </>
                                    ) : (
                                      <span className="text-red-600 ml-2">
                                        Not Uploaded
                                      </span>
                                    )}
                                  </p>

                                  {/* Pickup OTP */}
                                  {item.imei_verified === 1 &&
                                    item.video_verified === 1 &&
                                    item.pickup_otp !== null &&
                                    item.pickup_otp !== 0 && (
                                      <div className="mt-2 bg-green-100 text-green-800 px-4 rounded-full text-sm font-semibold w-max shadow-sm">
                                        Pickup OTP:{" "}
                                        <span className="ml-1 text-lg">
                                          {item.pickup_otp}
                                        </span>
                                      </div>
                                    )}
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
                                  <div className="flex items-center text-gray-700 text-sm gap-3">
                                    {order.delivery_status === "picked_up" && (
                                      <>
                                        <p className="text-gray-700 text-sm">
                                          <span className="font-semibold">
                                            Customer:
                                          </span>{" "}
                                          {order.customer_name}
                                        </p>

                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => callCustomer(order)}
                                          className="flex items-center gap-2 whitespace-nowrap"
                                        >
                                          <Phone className="w-4 h-4" />
                                          Call to Customer
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {charges?.delivery_charge > 0 && (
                              <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg">
                                <table className="w-full text-xs text-green-700">
                                  <tbody>
                                    <tr className="border-b">
                                      <td className="  font-medium">
                                        Your Location → Seller Point
                                      </td>
                                      <td className="  text-right font-semibold">
                                        {order.distances
                                          ?.delivery_boy_to_pickup_km ?? 0}{" "}
                                        km
                                      </td>
                                    </tr>

                                    <tr className="border-b">
                                      <td className="  font-medium">
                                        Seller Point → Customer Point
                                      </td>
                                      <td className="  text-right font-semibold">
                                        {order.distances
                                          ?.pickup_to_delivery_km ?? 0}{" "}
                                        km
                                      </td>
                                    </tr>

                                    <tr className="border-b bg-green-50">
                                      <td className="  font-semibold text-green-900">
                                        Total Distance
                                      </td>
                                      <td className="  text-right font-bold text-green-900">
                                        {(
                                          (order.distances
                                            ?.delivery_boy_to_pickup_km || 0) +
                                          (order.distances
                                            ?.pickup_to_delivery_km || 0)
                                        ).toFixed(2)}{" "}
                                        km
                                      </td>
                                    </tr>

                                    <tr className="border-b">
                                      <td className=" ">
                                        Fuel Cost (₹
                                        {deliverySettings?.fuel_cost_per_km ||
                                          5}
                                        /km)
                                      </td>
                                      <td className="  text-right font-medium">
                                        ₹{Math.round(charges?.fuelCost ?? 0)}
                                      </td>
                                    </tr>

                                    <tr className="border-b">
                                      <td className=" ">Delivery Charges</td>
                                      <td className="  text-right font-medium">
                                        ₹{charges?.baseCharge ?? 0}
                                      </td>
                                    </tr>

                                    <tr className="bg-emerald-100">
                                      <td className=" py-3 px-3 font-bold text-green-900">
                                        You will Earn
                                      </td>
                                      <td className=" py-3 text-right font-bold text-emerald-700">
                                        ₹{Math.round(fuelCost + deliveryCharge)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <div className="mt-3">
                              <LiveTrackingMapAvailableOrders
                                orderId={order.id}
                                deliveryBoyId={partner.id}
                                pickupLat={
                                  order?.pickup_address?.latitude ?? null
                                }
                                pickupLng={
                                  order?.pickup_address?.longitude ?? null
                                }
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

                            <Badge
                              className="bg-blue-500 text-white cursor-pointer"
                              onClick={() => setSelectedOrder(order)}
                            >
                              Status:{" "}
                              {order.delivery_status === "accepted_db"
                                ? "Accepted"
                                : order.delivery_status}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
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

              <TabsContent value="completed" className="mt-0">
                {completedDeliveries.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    No active deliveries found.
                  </p>
                ) : (
                  // If deliveries exist
                  <div className="space-y-4">
                    {completedDeliveries.map((order) => (
                      <Card
                        key={order.id}
                        className="border border-green-300 bg-green-50"
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg ">
                              {order.website_ref || `Order #${order.id}`}
                            </h3>

                            <Badge className="bg-green-600 text-white flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Delivered
                            </Badge>
                          </div>

                          <p className="text-gray-700 text-sm flex items-center gap-2">
                            <Store className="w-4 h-4 text-gray-500" />
                            <span className="font-semibold">Retailer:</span>
                            {order.seller_id === 9
                              ? "Admin"
                              : order.retailer_name || "Not Assigned"}
                          </p>

                          <p className="text-gray-700 text-sm">
                            <span className="font-semibold">Pickup:</span>{" "}
                            {order.pickup_address
                              ? `${order.pickup_address.street}, ${order.pickup_address.city}`
                              : "Not Assigned"}
                          </p>

                          <p className="text-gray-700 text-sm">
                            <span className="font-semibold">Delivered To:</span>{" "}
                            {order.drop_address
                              ? `${order.drop_address.street}, ${order.drop_address.city} - ${order.drop_address.pincode}`
                              : "Not Assigned"}
                          </p>

                          <div className="border rounded-lg p-3 bg-white">
                            <p className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                              📦 Products
                            </p>

                            {order.items?.map((item, index) => (
                              <div
                                key={index}
                                className="text-sm text-gray-700 flex justify-between"
                              >
                                <span>{item.name}</span>
                                <span className="font-medium">
                                  {item.quantity} × ₹{item.price}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Delivered Time */}
                          <p className="text-xs text-gray-600">
                            Delivered on{" "}
                            <span className="font-medium">
                              {new Date(
                                order.actual_delivery_time || order.updated_at,
                              ).toLocaleString()}
                            </span>
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="retailers" className="mt-0">
                <SelectRetailers deliveryPartnerId={partner.id} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      <Dialog
        open={confirmVerify.open}
        onOpenChange={(open) =>
          !open &&
          setConfirmVerify({ open: false, type: null, orderDetailId: null })
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Verification</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to verify this{" "}
            <span className="font-semibold">
              {confirmVerify.type === "imei" ? "IMEI" : "Video"}
            </span>
            ?
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() =>
                setConfirmVerify({
                  open: false,
                  type: null,
                  orderDetailId: null,
                })
              }
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={async () => {
                if (!confirmVerify.orderDetailId) return;

                if (confirmVerify.type === "imei") {
                  await handleVerifyImei(confirmVerify.orderDetailId);
                }

                if (confirmVerify.type === "video") {
                  await handleVerifyVideo(confirmVerify.orderDetailId);
                }

                setConfirmVerify({
                  open: false,
                  type: null,
                  orderDetailId: null,
                });
              }}
            >
              Yes, Verify
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ⬇️ NEW PROFILE SETTINGS MODAL ⬇️ */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[800px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-2xl text-[#075E66]">
              Delivery Boy Profile & Settings
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 pt-0 max-h-[85vh] overflow-y-auto">
            <DeliveryBoyProfileSettings
              dBProfile={partner}
              onUpdateProfile={() => {
                loadData(); // Reload seller profile and stats
                setShowProfileModal(false); // Close modal on successful update
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectModal.open}
        onOpenChange={() =>
          setRejectModal({ open: false, orderDetailId: null })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-red-600">
  ❌ Reject {rejectModal.type?.toUpperCase()}
</DialogTitle>

          </DialogHeader>

          {/* Reason */}
          <div className="mt-3">
            <label className="font-semibold text-sm">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border rounded-md p-2 mt-1 text-sm"
              rows={3}
              placeholder={`Explain why ${rejectModal.type} is rejected`}
              value={rejectData.reason}
              onChange={(e) =>
                setRejectData({ ...rejectData, reason: e.target.value })
              }
            />
          </div>

          {/* Photo Upload */}
          <div className="mt-3">
            <label className="font-semibold text-sm">
              Upload Photo <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(e) =>
                setRejectData({ ...rejectData, photo: e.target.files[0] })
              }
            />
          </div>

          {/* Video Upload */}
          <div className="mt-3">
            <label className="font-semibold text-sm">
              Upload Video <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="video/*"
              className="mt-1"
              onChange={(e) =>
                setRejectData({ ...rejectData, video: e.target.files[0] })
              }
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() =>
                setRejectModal({ open: false, orderDetailId: null })
              }
            >
              Cancel
            </button>

            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={() => handleRejectImei()}
            >
              Reject {rejectModal.type?.toUpperCase()}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ⬆️ END OF NEW PROFILE SETTINGS MODAL ⬆️ */}
    </div>
  );
}

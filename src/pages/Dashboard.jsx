import React, { useState, useEffect, useRef } from "react";
import { Order, Retailer } from "@/components/utils/mockApi";

import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { LogOut, Bell } from "lucide-react";
import StatsOverview from "../components/dashboard/StatsOverview";
import RecentOrders from "../components/dashboard/RecentOrders";
import RetailerStatus from "../components/dashboard/RetailerStatus";
import PerformanceMetrics from "../components/dashboard/PerformanceMetrics";
import QueuedOrdersMonitor from "../components/orders/QueuedOrdersMonitor";
import SLAMonitor from "../components/sla/SLAMonitor";
import { AuthApi } from "@/components/utils/authApi";
import { OrderApi } from "@/components/utils/orderApi";
import { retailerApi } from "@/components/utils/retailerApi";
import { API_BASE_URL } from "@/config";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const notificationAudioRef = useRef(null);
  const emergencyAudioRef = useRef(null);
  const prevUnreadCountRef = useRef(0);
  const [highlightOrderId, setHighlightOrderId] = useState(null);
  useEffect(() => {
    const unlockAudio = async () => {
      const audios = [emergencyAudioRef.current, notificationAudioRef.current];

      for (const audio of audios) {
        if (!audio) continue;

        try {
          audio.volume = 0;
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        } catch (e) {
          console.warn("Audio unlock blocked", e);
        }
      }
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (unreadCount === 0) {
      stopEmergencySound();
    }
  }, [unreadCount]);
  const stopEmergencySound = () => {
    if (!emergencyAudioRef.current) return;

    emergencyAudioRef.current.pause();
    emergencyAudioRef.current.currentTime = 0;
    emergencyAudioRef.current.loop = false;
  };
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, retailersData] = await Promise.all([
      OrderApi.list("-created_date", 100),
      retailerApi.list("-created_date"),
    ]);
    setOrders(ordersData);
    setRetailers(retailersData);
    setLoading(false);
    console.log(ordersData);
  };

  useEffect(() => {
    let initialLoad = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/notifications`, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Notification API error:", res.status);
          return;
        }

        const data = await res.json();

        if (!initialLoad) {
          const unreadNotifications = (data.notifications || []).filter(
            (n) => !n.read_at,
          );

          const latestUnread = unreadNotifications[0];

          const isEmergency =
            latestUnread &&
            (latestUnread.type ===
              "App\\Notifications\\EmergencyAlertNotification" ||
              latestUnread.data?.type === "ROUTE_DEVIATION");

          if (isEmergency && data.unread_count > prevUnreadCountRef.current) {
            console.log("🚨 NEW emergency alert");

            const audio = emergencyAudioRef.current;
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
              audio.loop = true;
              audio.volume = 1;
              audio
                .play()
                .catch((e) => console.warn("Emergency audio blocked", e));
            }
          } else if (data.unread_count > prevUnreadCountRef.current) {
            notificationAudioRef.current?.play().catch(() => {});
          }
        }

        prevUnreadCountRef.current = data.unread_count;
        setNotifications((data.notifications || []).slice(0, 5));
        setUnreadCount(data.unread_count || 0);
      } catch (e) {
        console.error("Notification fetch error:", e);
      }
    };

    fetchNotifications();
    initialLoad = false;

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    stopEmergencySound();
    const token = sessionStorage.getItem("token");

    await fetch(`${API_BASE_URL}/api/admin/notifications/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    setUnreadCount(0);
    prevUnreadCountRef.current = 0;
  };

  const handleNotificationClick = async (notification) => {
    stopEmergencySound();

    const token = sessionStorage.getItem("token");

    await fetch(
      `${API_BASE_URL}/api/admin/notifications/${notification.id}/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );

    setUnreadCount((prev) => Math.max(prev - 1, 0));

    if (notification.data?.order_id) {
      window.location.href = createPageUrl(
        `Orders?order=${notification.data.order_id}`,
      );
    }
  };

  const markNotificationAsRead = async (id) => {
    stopEmergencySound();
    const token = sessionStorage.getItem("token");

    await fetch(`${API_BASE_URL}/api/admin/notifications/${id}/read`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((prev) => Math.max(prev - 1, 0));
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

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter((o) =>
      ["assigned", "en_route", "arrived"].includes(
        o.assignment_status || o.delivery_status,
      ),
    ).length,
    deliveredToday: orders.filter((o) => {
      if (o.status !== "delivered") return false;
      const today = new Date().toDateString();
      return (
        new Date(o.actual_delivery_time || o.updated_date).toDateString() ===
        today
      );
    }).length,
    activeRetailers: retailers.filter((r) => r.availability_status === "online")
      .length,
    pendingAssignment: orders.filter((o) => o.delivery_status === "pending")
      .length,
    slaBreaches: orders.filter((o) => {
      if (!o.estimated_delivery_time) return false;
      return (
        new Date(o.estimated_delivery_time) < new Date() &&
        o.status !== "delivered"
      );
    }).length,
  };

  const handleStatClick = (type) => {
    try {
      switch (type) {
        case "totalOrders":
          window.location.href = createPageUrl("Orders");
          break;
        case "activeOrders":
          window.location.href = createPageUrl("Orders");
          break;
        case "deliveredToday":
          window.location.href = createPageUrl("Orders");
          break;
        case "activeRetailers":
          window.location.href = createPageUrl("Retailers");
          break;
        case "pendingAssignment":
          window.location.href = createPageUrl("Orders");
          break;
        case "slaBreaches":
          window.location.href = createPageUrl("Orders");
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Super Admin Dashboard
            </h1>
            <p className="text-white opacity-90 mt-1">
              Real-time delivery management overview
            </p>
          </div>
          <div className="relative flex items-center gap-2">
            {/* 🔔 Bell Icon */}
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-white/20 transition"
              onClick={() => {
                setShowDropdown((prev) => !prev);

                if (!showDropdown) {
                  stopEmergencySound();

                  if (unreadCount > 0) {
                    markAllAsRead();
                  }
                }
              }}
            >
              <Bell className="w-6 h-6 text-[#FFEB3B]" />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 🚪 Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-[#FFEB3B]
    border-[#FFEB3B]
    bg-transparent
    hover:bg-transparent
    hover:text-[#FFEB3B]
    hover:border-[#FFEB3B]
    flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <audio ref={notificationAudioRef} preload="auto">
              <source src="/notification.mp3" type="audio/mpeg" />
            </audio>
            <audio ref={emergencyAudioRef} preload="auto">
              <source src="/emergency.mp3" type="audio/mpeg" />
            </audio>

            {/* 📩 Notification Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-12 w-72 bg-white shadow-xl rounded-lg z-50 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 border-b last:border-0 text-sm cursor-pointer transition-colors
                ${
                  n.read_at
                    ? "bg-white text-gray-700"
                    : "bg-yellow-50 text-gray-900 font-semibold"
                }
                hover:bg-gray-100
              `}
                      >
                        <p className="text-sm">
                          {n.data?.order_id
                            ? `Order #${n.data.order_id}`
                            : "Notification"}
                        </p>

                        <p className="text-xs mt-1 text-gray-600">
                          {n.data?.message}
                        </p>

                        {n.data?.amount && (
                          <p className="text-xs mt-1 text-gray-500">
                            Amount: ₹{n.data.amount}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <SLAMonitor />

        <QueuedOrdersMonitor />

        <StatsOverview
          stats={stats}
          loading={loading}
          onStatClick={handleStatClick}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders
              orders={orders}
              loading={loading}
              onRefresh={loadData}
            />
          </div>
          <div className="space-y-6">
            <RetailerStatus retailers={retailers} loading={loading} />
            <PerformanceMetrics orders={orders} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

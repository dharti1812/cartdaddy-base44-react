
import React, { useState, useEffect } from "react";
import { Order, Retailer } from "@/components/utils/mockApi";

import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { LogOut } from "lucide-react";
import StatsOverview from "../components/dashboard/StatsOverview";
import RecentOrders from "../components/dashboard/RecentOrders";
import RetailerStatus from "../components/dashboard/RetailerStatus";
import PerformanceMetrics from "../components/dashboard/PerformanceMetrics";
import QueuedOrdersMonitor from "../components/orders/QueuedOrdersMonitor";
import SLAMonitor from "../components/sla/SLAMonitor";
import { AuthApi } from "@/components/utils/authApi";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, retailersData] = await Promise.all([
      Order.list("-created_date", 100),
      Retailer.list("-created_date")
    ]);
    setOrders(ordersData);
    setRetailers(retailersData);
    setLoading(false);
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
    activeOrders: orders.filter(o => ['assigned', 'en_route', 'arrived'].includes(o.status)).length,
    deliveredToday: orders.filter(o => {
      if (o.status !== 'delivered') return false;
      const today = new Date().toDateString();
      return new Date(o.actual_delivery_time || o.updated_date).toDateString() === today;
    }).length,
    activeRetailers: retailers.filter(r => r.availability_status === 'online').length,
    pendingAssignment: orders.filter(o => o.status === 'pending_acceptance').length,
    slaBreaches: orders.filter(o => {
      if (!o.estimated_delivery_time) return false;
      return new Date(o.estimated_delivery_time) < new Date() && o.status !== 'delivered';
    }).length
  };

  const handleStatClick = (type) => {
    try {
      switch (type) {
        case 'totalOrders':
          window.location.href = createPageUrl('Orders');
          break;
        case 'activeOrders':
          window.location.href = createPageUrl('Orders');
          break;
        case 'deliveredToday':
          window.location.href = createPageUrl('Orders');
          break;
        case 'activeRetailers':
          window.location.href = createPageUrl('Retailers');
          break;
        case 'pendingAssignment':
          window.location.href = createPageUrl('Orders');
          break;
        case 'slaBreaches':
          window.location.href = createPageUrl('Orders');
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
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-white opacity-90 mt-1">Real-time delivery management overview</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1 "
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <a
              href={createPageUrl("RetailerPortal")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-center text-yellow-400 hover:text-white font-bold transition-colors"
            >
              Open Seller Portal &rarr;
            </a>
          </div>
        </div>

        <SLAMonitor />

        <QueuedOrdersMonitor />

        <StatsOverview stats={stats} loading={loading} onStatClick={handleStatClick} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrders orders={orders} loading={loading} onRefresh={loadData} />
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

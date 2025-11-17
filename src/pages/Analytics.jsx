import React, { useState, useEffect } from "react";
import { Order, Retailer } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, TrendingUp, Package, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderApi } from "@/components/utils/orderApi";
import { retailerApi } from "@/components/utils/retailerApi";
import { API_BASE_URL } from "@/config";

const COLORS = ["#1e3a8a", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"];

export default function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    let ordersData = [];
    let retailersData = [];

    try {
      [ordersData, retailersData] = await Promise.all([
        OrderApi.list(),
        retailerApi.list(),
      ]);

      setOrders(ordersData);
      setRetailers(retailersData);
    } catch (err) {
      console.error("Error loading analytics:", err);
    }

    console.log("Orders:", ordersData);
    console.log("Retailers:", retailersData);

    setLoading(false);
  };

  const getStatusDistribution = () => {
    const statusCount = {};
    orders.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getDailyOrders = () => {
    const dailyData = {};
    orders.forEach((order) => {
      const date = new Date(order.created_date).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + 1;
    });
    return Object.entries(dailyData)
      .map(([date, orders]) => ({ date, orders }))
      .slice(-7);
  };

  const getTopRetailers = () => {
    return retailers
      .sort(
        (a, b) =>
          (b.successful_deliveries || 0) - (a.successful_deliveries || 0)
      )
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        deliveries: r.successful_deliveries || 0,
      }));
  };

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

  const stats = {
    totalRevenue: orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => {
        const amount = parseFloat(String(o.amount).replace(/,/g, "")) || 0;
        return sum + amount;
      }, 0),

    avgOrderValue: (() => {
      const paid = orders.filter((o) => o.payment_status === "paid");
      if (paid.length === 0) return 0;

      const total = paid.reduce((sum, o) => {
        const amount = parseFloat(String(o.amount).replace(/,/g, "")) || 0;
        return sum + amount;
      }, 0);

      return total / paid.length;
    })(),

    deliveryRate:
      orders.length > 0
        ? (orders.filter((o) => o.status === "delivered").length /
            orders.length) *
          100
        : 0,

    avgDeliveryTime: (() => {
      const delivered = orders.filter(
        (o) => o.status === "delivered" && o.created_date && o.updated_date
      );

      if (delivered.length === 0) return 0;

      const totalTime = delivered.reduce((sum, o) => {
        const diff =
          (new Date(o.updated_date) - new Date(o.created_date)) / (1000 * 60);
        return sum + diff;
      }, 0);

      return totalTime / delivered.length;
    })(),
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analytics & Reports
            </h1>
            <p className="text-white opacity-90 mt-1">
              Performance insights and business metrics
            </p>
          </div>
          <Button
            variant="outline"
            className="bg-white text-[#075E66] border-2 border-[#F4B321] hover:bg-[#F4B321] hover:text-gray-900 font-bold"
          >
            <div className="relative">
              <Button
                onClick={() => setShowMenu((prev) => !prev)}
                variant="outline"
                className="bg-white text-[#075E66] border-2 border-[#F4B321] hover:bg-[#F4B321] hover:text-gray-900 font-bold"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Reports
              </Button>

              {showMenu && (
                <div className="absolute right-0 mt-2 bg-white shadow-lg border rounded-md w-56 z-50">
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
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{stats.totalRevenue.toFixed(0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{stats.avgOrderValue.toFixed(0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.deliveryRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 mb-1">
                    Avg Delivery Time
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.avgDeliveryTime.toFixed(0)}m
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b">
              <CardTitle>Daily Orders Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getDailyOrders()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#1e3a8a"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b">
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getStatusDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getStatusDistribution().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b">
            <CardTitle>Top Performing Retailers</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTopRetailers()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deliveries" fill="#1e3a8a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

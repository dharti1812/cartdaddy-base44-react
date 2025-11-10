import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  MapPin,
  Clock,
  RefreshCw,
  Eye,
  Store,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { API_BASE_URL } from "@/config";

const statusConfig = {
  pending_acceptance: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  offered: {
    label: "Offered",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  assigned: {
    label: "Assigned",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  en_route: {
    label: "En Route",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  arrived: {
    label: "Arrived",
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  no_provider_found: {
    label: "No Provider",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export default function RecentOrders({ onRefresh }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const recentOrders = orders.slice(0, 5);
  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/recent-orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recent orders");
      }

      const data = await response.json();
      console.log(data);
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);
  return (
    <Card className="border-none shadow-md">
      <CardHeader className="border-b bg-white">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-gray-900">
            Recent Orders
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Link to={createPageUrl("Orders")}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {`#${order.id}`}
                      </h3>
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                      {order.is_cod && (
                        <Badge className="bg-green-100 text-green-800">
                          COD
                        </Badge>
                      )}
                      {order.sla_breach && (
                        <Badge className="bg-red-100 text-red-800">
                          SLA Breach
                        </Badge>
                      )}
                    </div>
                    {order.retailer_name && (
                      <div className="mb-2 flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {order.retailer_name}
                        </span>
                      </div>
                    )}
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{order.customer_name}</span>
                        <span className="text-gray-400">•</span>
                        <span>{order.drop_address?.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(
                            new Date(order.created_date),
                            "MMM d, h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {order.drop_address}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        ₹{order.amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                    <Link to={createPageUrl(`Orders?order=${order.id}`)}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function getStatusBadgeClass(status) {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "en_route":
      return "bg-blue-100 text-blue-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "assigned":
      return "bg-purple-100 text-purple-800"; // Added assigned status
    default:
      return "bg-gray-100 text-gray-800";
  }
}

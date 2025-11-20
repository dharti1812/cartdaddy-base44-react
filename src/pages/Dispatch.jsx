import React, { useState, useEffect } from "react";
import { Order, Retailer } from "@/components/utils/mockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Users, Package, AlertCircle, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { retailerApi } from "@/components/utils/retailerApi";
import { OrderApi } from "@/components/utils/orderApi";
import { deliveryPartnerApi } from "@/components/utils/deliveryPartnerApi";

export default function DispatchPage() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ordersRes, retailersRes] = await Promise.all([
        OrderApi.PendingOrders(),
        retailerApi.onlineRetailers(),
      ]);

      setOrders(ordersRes.data || ordersRes);
      setRetailers(retailersRes.data || retailersRes);
    } catch (error) {
      console.error("Load Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (orderId, retailerId) => {
    await Order.update(orderId, {
      retailer_id: retailerId,
      status: "assigned",
    });
    loadData();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dispatch Center</h1>
            <p className="text-white opacity-90 mt-1">
              Manual order assignment and dispatch control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 border px-4 py-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              {orders.length} Pending Assignment
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {orders.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Online Retailers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {retailers.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Auto-Dispatch</p>
                  <Badge
                    variant="outline"
                    className="mt-1 bg-gray-100 text-gray-700"
                  >
                    Manual Mode
                  </Badge>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-white">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending orders</p>
                </div>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {order.website_ref || `#${order.id.slice(0, 8)}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {order.customer_name}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            ₹{order.total_amount}
                          </Badge>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            {order.drop_address?.city},{" "}
                            {order.drop_address?.pincode}
                          </span>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 mb-2">
                            Assign to retailer:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {retailers.slice(0, 3).map((retailer) => (
                              <Button
                                key={retailer.id}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleAssign(order.id, retailer.id)
                                }
                                className="flex-1"
                              >
                                {retailer.full_name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Available Retailers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : retailers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No online retailers</p>
                </div>
              ) : (
                retailers.map((retailer) => (
                  <Card key={retailer.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                            {retailer.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {retailer.full_name}
                            </p>
                            <p className="text-sm text-gray-600 capitalize">
                              {retailer.vehicle_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Online
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {retailer.current_orders || 0}/
                            {retailer.capacity_per_day} orders
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-md mt-6">
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-blue-900">
                  Auto-Dispatch Information
                </CardTitle>
                <p className="text-sm text-blue-700 mt-1">
                  Auto-dispatch with geofence expansion requires backend
                  functions (not available in base44 platform). Currently
                  operating in manual mode where dispatchers assign orders to
                  online retailers.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Manual Mode Features:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>View all pending orders requiring assignment</li>
                <li>See all online and available retailers</li>
                <li>
                  Manually assign orders to retailers based on location and
                  capacity
                </li>
                <li>Real-time status tracking once assigned</li>
              </ul>
              <p className="mt-4 text-xs text-gray-500">
                To enable auto-dispatch: Implement backend functions for
                priority tiers, geofence expansion, timeout handling, and
                automated retailer matching based on your technical
                specification.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { Order, Retailer } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Navigation, Package, Phone, Smartphone, MapPin, Clock, 
  User, Search, RefreshCw, Filter, TrendingUp
} from "lucide-react";
import { format } from "date-fns";

export default function LiveTrackingPage() {
  const [orders, setOrders] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    const [ordersData, retailersData] = await Promise.all([
      Order.filter({ 
        status: ['accepted_primary', 'accepted_backup', 'payment_pending', 'en_route', 'arrived'] 
      }, "-created_date"),
      Retailer.list()
    ]);
    setOrders(ordersData);
    setRetailers(retailersData);
    setLoading(false);
  };

  const getRetailerInfo = (retailerId) => {
    return retailers.find(r => r.id === retailerId);
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.website_ref?.toLowerCase().includes(search) ||
      order.customer_name?.toLowerCase().includes(search) ||
      order.active_retailer_info?.retailer_name?.toLowerCase().includes(search) ||
      order.active_retailer_info?.retailer_phone?.includes(search)
    );
  });

  const statusColors = {
    accepted_primary: "bg-purple-100 text-purple-800 border-purple-200",
    accepted_backup: "bg-blue-100 text-blue-800 border-blue-200",
    payment_pending: "bg-amber-100 text-amber-800 border-amber-200",
    en_route: "bg-indigo-100 text-indigo-800 border-indigo-200",
    arrived: "bg-cyan-100 text-cyan-800 border-cyan-200"
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#075E66] to-[#064d54] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Navigation className="w-8 h-8 text-[#F4B321]" />
              Live Order Tracking
            </h1>
            <p className="text-white text-opacity-80 mt-1">Real-time tracking of active deliveries</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-[#F4B321] hover:bg-[#e0a020] text-gray-900 font-semibold" : "bg-white text-[#075E66] border-white hover:bg-gray-100"}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} className="bg-white text-[#075E66] border-white hover:bg-gray-100">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Active</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">En Route</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    {orders.filter(o => o.status === 'en_route').length}
                  </p>
                </div>
                <Navigation className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Arrived</p>
                  <p className="text-2xl font-bold text-cyan-700">
                    {orders.filter(o => o.status === 'arrived').length}
                  </p>
                </div>
                <MapPin className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Active Riders</p>
                  <p className="text-2xl font-bold text-green-700">
                    {new Set(orders.map(o => o.active_retailer_id).filter(Boolean)).size}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-none shadow-md mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by order ID, customer name, rider name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {loading ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-12 text-center">
              <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading orders...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="border-none shadow-md">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Deliveries</h3>
              <p className="text-gray-500">All orders have been completed or are pending assignment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const retailerInfo = order.active_retailer_info || {};
              const retailer = getRetailerInfo(order.active_retailer_id);
              const backupCount = order.accepted_retailers?.filter(ar => ar.status === 'active' && ar.retailer_id !== order.active_retailer_id).length || 0;
              
              return (
                <Card key={order.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 bg-gradient-to-r from-[#0E5D52] to-teal-600 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">
                          {order.website_ref || `#${order.id.slice(0, 8)}`}
                        </h3>
                        <Badge className={`${statusColors[order.status]} border`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(order.created_date), "h:mm a")}</span>
                        </div>
                        {order.distance_km && (
                          <>
                            <span>•</span>
                            <span>{order.distance_km} km</span>
                          </>
                        )}
                        <span>•</span>
                        <span>₹{order.total_amount}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Delivery Person Info */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {retailerInfo.retailer_name?.[0]?.toUpperCase() || 'R'}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-lg">
                              {retailerInfo.retailer_name || "Assigned Rider"}
                            </p>
                            {retailerInfo.retailer_phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Phone className="w-4 h-4" />
                                <span className="font-medium">{retailerInfo.retailer_phone}</span>
                              </div>
                            )}
                          </div>
                          {retailer?.availability_status === 'online' && (
                            <Badge className="bg-green-500 text-white">
                              <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></div>
                              Online
                            </Badge>
                          )}
                        </div>

                        {/* Device Info */}
                        {retailerInfo.device_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-2">
                            <Smartphone className="w-4 h-4 text-gray-500" />
                            <span><strong>Device:</strong> {retailerInfo.device_name}</span>
                            {retailerInfo.assigned_at && (
                              <>
                                <span className="text-gray-400 mx-1">•</span>
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>Assigned {format(new Date(retailerInfo.assigned_at), "h:mm a")}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Retailer Stats */}
                        {retailer && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="bg-white rounded p-2 text-center">
                              <p className="text-xs text-gray-500">Total Orders</p>
                              <p className="text-lg font-bold text-gray-900">{retailer.current_orders || 0}</p>
                            </div>
                            <div className="bg-white rounded p-2 text-center">
                              <p className="text-xs text-gray-500">Success Rate</p>
                              <p className="text-lg font-bold text-green-700">
                                {retailer.total_deliveries > 0 
                                  ? Math.round((retailer.successful_deliveries / retailer.total_deliveries) * 100)
                                  : 0}%
                              </p>
                            </div>
                            <div className="bg-white rounded p-2 text-center">
                              <p className="text-xs text-gray-500">Rating</p>
                              <p className="text-lg font-bold text-yellow-600">{retailer.rating?.toFixed(1) || 'N/A'}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Customer & Delivery Info */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">CUSTOMER</p>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                            {order.customer_masked_contact && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <Phone className="w-3 h-3" />
                                <span>{order.customer_masked_contact}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">DELIVERY ADDRESS</p>
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{order.drop_address?.street}</p>
                                <p className="text-gray-700">{order.drop_address?.city}, {order.drop_address?.pincode}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Backup Riders */}
                      {backupCount > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm font-semibold text-amber-900 mb-2">
                            🔄 {backupCount} Backup Rider{backupCount > 1 ? 's' : ''} Standing By
                          </p>
                          <div className="space-y-2">
                            {order.accepted_retailers
                              ?.filter(ar => ar.status === 'active' && ar.retailer_id !== order.active_retailer_id)
                              .map((ar, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded p-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{ar.retailer_name}</span>
                                  <Badge variant="outline" className="text-xs">Position {ar.position}</Badge>
                                  {ar.retailer_phone && (
                                    <>
                                      <span className="text-gray-400 mx-1">•</span>
                                      <Phone className="w-3 h-3 text-gray-500" />
                                      <span>{ar.retailer_phone}</span>
                                    </>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

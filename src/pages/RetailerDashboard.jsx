
import React, { useState, useEffect } from 'react';
import { Order, Retailer, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin, Navigation, Package, Activity,
  RefreshCw, TrendingUp, Calendar, BarChart3, AlertTriangle
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RetailerDashboard() {
  const [retailerProfile, setRetailerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today');

  useEffect(() => {
    loadData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const user = await User.me();
      const retailers = await Retailer.filter({ email: user.email });
      
      if (retailers.length > 0) {
        const retailer = retailers[0];
        setRetailerProfile(retailer);

        const allOrders = await Order.list("-created_date", 1000);
        const myOrders = allOrders.filter(order => 
          order.accepted_retailers?.some(ar => ar.retailer_id === retailer.id)
        );
        setOrders(myOrders);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        return orders;
    }

    return orders.filter(order => new Date(order.created_date) >= startDate);
  };

  const calculateStats = () => {
    const filteredOrders = getFilteredOrders();
    const completedOrders = filteredOrders.filter(o => o.status === 'delivered');
    
    // Calculate total distance
    const totalMapDistance = completedOrders.reduce((sum, o) => sum + (o.distance_km || 0), 0);
    const totalActualDistance = completedOrders.reduce((sum, o) => sum + (o.actual_distance_traveled || o.distance_km || 0), 0);
    const deviationPercent = totalMapDistance > 0 ? (((totalActualDistance - totalMapDistance) / totalMapDistance) * 100).toFixed(1) : 0;

    // Group by delivery boy
    const deliveryBoyStats = {};
    retailerProfile?.delivery_boys?.forEach(db => {
      const dbOrders = completedOrders.filter(o => o.assigned_delivery_boy?.id === db.id);
      const dbMapDistance = dbOrders.reduce((sum, o) => sum + (o.distance_km || 0), 0);
      const dbActualDistance = dbOrders.reduce((sum, o) => sum + (o.actual_distance_traveled || o.distance_km || 0), 0);
      const dbDeviation = dbMapDistance > 0 ? (((dbActualDistance - dbMapDistance) / dbMapDistance) * 100).toFixed(1) : 0;

      deliveryBoyStats[db.id] = {
        name: db.name,
        deliveries: dbOrders.length,
        mapDistance: dbMapDistance.toFixed(1),
        actualDistance: dbActualDistance.toFixed(1),
        deviation: dbDeviation,
        suspiciousRoutes: dbOrders.filter(o => {
          const orderDeviation = o.distance_km > 0 ? (((o.actual_distance_traveled || o.distance_km) - o.distance_km) / o.distance_km) * 100 : 0;
          return orderDeviation > 15; // More than 15% deviation is suspicious
        }).length
      };
    });

    return {
      totalDeliveries: completedOrders.length,
      totalMapDistance: totalMapDistance.toFixed(1),
      totalActualDistance: totalActualDistance.toFixed(1),
      deviationPercent,
      deliveryBoyStats
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-teal-100 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#075E66] to-[#064d54] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/659db8ff0_aaaaa.png" 
              alt="Cart Daddy Logo" 
              className="h-16 w-auto"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">Retailer Dashboard</h1>
              <p className="text-white text-opacity-80 mt-1">Performance tracking and delivery analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Deliveries</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                  <p className="text-xs text-gray-600 mt-1">in {timeFilter}</p>
                </div>
                <Package className="w-10 h-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Map Distance</p>
                  <p className="text-3xl font-bold text-green-700">{stats.totalMapDistance} km</p>
                  <p className="text-xs text-gray-600 mt-1">Expected distance</p>
                </div>
                <MapPin className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Actual Distance</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.totalActualDistance} km</p>
                  <p className="text-xs text-gray-600 mt-1">GPS tracked</p>
                </div>
                <Navigation className="w-10 h-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-md ${parseFloat(stats.deviationPercent) > 10 ? 'ring-2 ring-red-500' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Route Deviation</p>
                  <p className={`text-3xl font-bold ${parseFloat(stats.deviationPercent) > 10 ? 'text-red-700' : 'text-amber-700'}`}>
                    {stats.deviationPercent}%
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Extra distance</p>
                </div>
                <TrendingUp className={`w-10 h-10 ${parseFloat(stats.deviationPercent) > 10 ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deviation Alert */}
        {parseFloat(stats.deviationPercent) > 15 && (
          <Alert className="mb-6 bg-red-50 border-2 border-red-500">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-900 font-semibold">
              ⚠️ High route deviation detected! Delivery partners are traveling {stats.deviationPercent}% more than required. Review individual performance below.
            </AlertDescription>
          </Alert>
        )}

        {/* Delivery Boy Performance */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Delivery Partner Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(stats.deliveryBoyStats).length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No delivery data for selected period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.deliveryBoyStats).map(([dbId, dbStats]) => (
                  <Card key={dbId} className={`border-2 ${parseFloat(dbStats.deviation) > 15 ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{dbStats.name}</h3>
                          <p className="text-sm text-gray-600">{timeFilter} performance</p>
                        </div>
                        {parseFloat(dbStats.deviation) > 15 && (
                          <Badge className="bg-red-600 text-white">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Suspicious
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Deliveries</p>
                          <p className="text-2xl font-bold text-blue-700">{dbStats.deliveries}</p>
                        </div>

                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Map Distance</p>
                          <p className="text-2xl font-bold text-green-700">{dbStats.mapDistance}</p>
                          <p className="text-[10px] text-gray-500">km (expected)</p>
                        </div>

                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Actual Distance</p>
                          <p className="text-2xl font-bold text-purple-700">{dbStats.actualDistance}</p>
                          <p className="text-[10px] text-gray-500">km (GPS)</p>
                        </div>

                        <div className={`p-3 border rounded-lg ${
                          parseFloat(dbStats.deviation) > 15 
                            ? 'bg-red-50 border-red-300' 
                            : parseFloat(dbStats.deviation) > 10
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <p className="text-xs text-gray-600 mb-1">Deviation</p>
                          <p className={`text-2xl font-bold ${
                            parseFloat(dbStats.deviation) > 15 
                              ? 'text-red-700' 
                              : parseFloat(dbStats.deviation) > 10
                              ? 'text-amber-700'
                              : 'text-green-700'
                          }`}>{dbStats.deviation}%</p>
                          <p className="text-[10px] text-gray-500">extra route</p>
                        </div>

                        <div className={`p-3 border rounded-lg ${
                          dbStats.suspiciousRoutes > 0 
                            ? 'bg-red-50 border-red-300' 
                            : 'bg-green-50 border-green-200'
                        }`}>
                          <p className="text-xs text-gray-600 mb-1">Suspicious</p>
                          <p className={`text-2xl font-bold ${
                            dbStats.suspiciousRoutes > 0 ? 'text-red-700' : 'text-green-700'
                          }`}>{dbStats.suspiciousRoutes}</p>
                          <p className="text-[10px] text-gray-500">routes (&gt;15%)</p>
                        </div>
                      </div>

                      {parseFloat(dbStats.deviation) > 15 && (
                        <Alert className="mt-3 bg-red-100 border-red-300">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <AlertDescription className="text-red-900 text-sm">
                            <strong>⚠️ High Deviation Alert:</strong> This delivery partner has traveled {dbStats.deviation}% more distance than required. 
                            {dbStats.suspiciousRoutes > 0 && ` ${dbStats.suspiciousRoutes} deliveries show suspicious routing patterns.`} 
                            Consider reviewing routes or talking to delivery partner.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="border-none shadow-md mt-6">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-blue-900 text-lg">📊 Understanding Route Deviation</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div>
                  <strong className="text-green-700">0-10% Deviation (Normal):</strong> Acceptable variation due to traffic, roadblocks, or minor detours.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5"></div>
                <div>
                  <strong className="text-amber-700">10-15% Deviation (Monitor):</strong> Slightly higher than normal. Monitor for patterns.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                <div>
                  <strong className="text-red-700">&gt;15% Deviation (Suspicious):</strong> Significant extra distance. May indicate intentional long routes, personal stops, or inefficient navigation. Review immediately.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

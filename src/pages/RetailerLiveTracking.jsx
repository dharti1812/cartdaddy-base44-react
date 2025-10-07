import React, { useState, useEffect } from 'react';
import { Order, DeliveryPartner, Retailer, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin, Navigation, Package, Clock, TrendingUp, 
  AlertTriangle, User as UserIcon, RefreshCw, Phone,
  Activity, WifiOff, MapPinOff
} from "lucide-react";
import { format } from "date-fns";

export default function RetailerLiveTracking() {
  const [retailerProfile, setRetailerProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 10000); // Refresh every 10 seconds
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

        // Get all delivery partners who work with this retailer
        const allPartners = await DeliveryPartner.list();
        const myPartners = allPartners.filter(dp => 
          dp.partnered_retailers?.some(pr => 
            pr.retailer_id === retailer.id && pr.partnership_status === 'approved'
          )
        );
        setDeliveryPartners(myPartners);

        // Get active orders assigned to these delivery partners
        const allOrders = await Order.list("-created_date", 100);
        const myOrders = allOrders.filter(order => 
          order.active_retailer_id === retailer.id &&
          order.assigned_delivery_boy
        );
        setOrders(myOrders);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading tracking data:", error);
      setLoading(false);
    }
  };

  const getPartnerStatus = (partner) => {
    if (partner.availability_status === 'on_delivery') {
      return { status: 'On Delivery', color: 'bg-blue-500', icon: Package };
    }
    if (partner.availability_status === 'online') {
      return { status: 'Available', color: 'bg-green-500', icon: Activity };
    }
    return { status: 'Offline', color: 'bg-gray-500', icon: UserIcon };
  };

  const getLocationStatus = (partner) => {
    if (!partner.location_tracking_enabled || !partner.current_location) {
      return { status: 'No Location', color: 'text-red-600', icon: MapPinOff };
    }
    
    const lastUpdate = new Date(partner.current_location.updated_at);
    const now = new Date();
    const minutesSince = (now - lastUpdate) / 1000 / 60;

    if (minutesSince < 2) {
      return { status: 'Live', color: 'text-green-600', icon: MapPin };
    }
    if (minutesSince < 5) {
      return { status: 'Stale', color: 'text-amber-600', icon: AlertTriangle };
    }
    return { status: 'Lost', color: 'text-red-600', icon: MapPinOff };
  };

  const openMapNavigation = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const onlinePartners = deliveryPartners.filter(dp => 
    ['online', 'on_delivery'].includes(dp.availability_status)
  );
  const activeDeliveries = orders.filter(o => 
    ['assigned_to_delivery_boy', 'en_route', 'arrived'].includes(o.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Delivery Tracking</h1>
            <p className="text-gray-500 mt-1">Real-time monitoring of your delivery partners</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
              {autoRefresh ? "Live Updates" : "Paused"}
            </Button>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Online Partners</p>
                  <p className="text-3xl font-bold text-gray-900">{onlinePartners.length}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Deliveries</p>
                  <p className="text-3xl font-bold text-gray-900">{activeDeliveries.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Partners</p>
                  <p className="text-3xl font-bold text-gray-900">{deliveryPartners.length}</p>
                </div>
                <UserIcon className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {orders.filter(o => {
                      if (o.status !== 'delivered') return false;
                      const today = new Date().toDateString();
                      return new Date(o.actual_delivery_time || o.updated_date).toDateString() === today;
                    }).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Tracking Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Deliveries with Live Location */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Active Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No active deliveries</p>
                </div>
              ) : (
                activeDeliveries.map((order) => {
                  const partner = deliveryPartners.find(dp => dp.id === order.assigned_delivery_boy?.id);
                  const locationStatus = partner ? getLocationStatus(partner) : null;
                  
                  return (
                    <Card key={order.id} className="border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900">
                                Order #{order.website_ref || order.id.slice(0, 8)}
                              </h3>
                              <p className="text-sm text-gray-600">{order.customer_name}</p>
                            </div>
                            <Badge className={
                              order.status === 'en_route' ? 'bg-blue-500' :
                              order.status === 'arrived' ? 'bg-green-500' :
                              'bg-gray-500'
                            }>
                              {order.status === 'en_route' ? '🚀 En Route' :
                               order.status === 'arrived' ? '📍 Arrived' :
                               '📦 Assigned'}
                            </Badge>
                          </div>

                          {partner && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {partner.full_name[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm">{partner.full_name}</p>
                                    <p className="text-xs text-gray-600">{partner.vehicle_type}</p>
                                  </div>
                                </div>
                                {locationStatus && (
                                  <Badge variant="outline" className={`${locationStatus.color} border-0 bg-white`}>
                                    <locationStatus.icon className="w-3 h-3 mr-1" />
                                    {locationStatus.status}
                                  </Badge>
                                )}
                              </div>

                              {partner.current_location && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200">
                                  <div className="text-xs text-gray-600">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    Updated: {format(new Date(partner.current_location.updated_at), 'h:mm:ss a')}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openMapNavigation(
                                      partner.current_location.lat,
                                      partner.current_location.lng
                                    )}
                                    className="text-xs h-7"
                                  >
                                    <Navigation className="w-3 h-3 mr-1" />
                                    Track
                                  </Button>
                                </div>
                              )}

                              {!partner.current_location && (
                                <Alert className="mt-2 bg-red-50 border-red-200 p-2">
                                  <MapPinOff className="w-4 h-4 text-red-600" />
                                  <AlertDescription className="text-xs text-red-900">
                                    Location not available
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          )}

                          <div className="flex items-start gap-2 text-sm bg-gray-50 p-2 rounded">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              {order.drop_address?.street}, {order.drop_address?.city}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* All Delivery Partners Status */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-green-600" />
                All Delivery Partners ({deliveryPartners.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {deliveryPartners.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No delivery partners yet</p>
                </div>
              ) : (
                deliveryPartners.map((partner) => {
                  const partnerStatus = getPartnerStatus(partner);
                  const locationStatus = getLocationStatus(partner);
                  const currentOrder = orders.find(o => o.assigned_delivery_boy?.id === partner.id);
                  
                  return (
                    <Card key={partner.id} className={`border-2 ${
                      partner.availability_status === 'on_delivery' ? 'border-blue-300 bg-blue-50' :
                      partner.availability_status === 'online' ? 'border-green-300 bg-green-50' :
                      'border-gray-200'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${partnerStatus.color} rounded-full flex items-center justify-center text-white font-bold`}>
                              {partner.full_name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{partner.full_name}</p>
                              <p className="text-xs text-gray-600">{partner.vehicle_type} • {partner.phone}</p>
                            </div>
                          </div>
                          <Badge className={`${partnerStatus.color} text-white border-0`}>
                            <partnerStatus.icon className="w-3 h-3 mr-1" />
                            {partnerStatus.status}
                          </Badge>
                        </div>

                        {/* Location Status */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className={`flex items-center gap-1 ${locationStatus.color}`}>
                            <locationStatus.icon className="w-3 h-3" />
                            <span className="font-medium">Location: {locationStatus.status}</span>
                          </div>
                          {partner.current_location && (
                            <span className="text-gray-500">
                              {format(new Date(partner.current_location.updated_at), 'h:mm a')}
                            </span>
                          )}
                        </div>

                        {/* Current Order Info */}
                        {currentOrder && (
                          <div className="bg-blue-100 border border-blue-300 rounded p-2 text-xs">
                            <p className="font-medium text-blue-900 mb-1">
                              📦 Delivering: #{currentOrder.website_ref || currentOrder.id.slice(0, 8)}
                            </p>
                            <p className="text-blue-700">
                              To: {currentOrder.customer_name} • {currentOrder.drop_address?.city}
                            </p>
                          </div>
                        )}

                        {/* Distance Stats */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Today</p>
                            <p className="font-bold text-sm text-gray-900">
                              {partner.distance_stats?.today?.actual_km?.toFixed(1) || 0} km
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">This Week</p>
                            <p className="font-bold text-sm text-gray-900">
                              {partner.distance_stats?.this_week?.actual_km?.toFixed(1) || 0} km
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Deliveries</p>
                            <p className="font-bold text-sm text-gray-900">
                              {partner.successful_deliveries || 0}
                            </p>
                          </div>
                        </div>

                        {/* Track Location Button */}
                        {partner.current_location && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => openMapNavigation(
                              partner.current_location.lat,
                              partner.current_location.lng
                            )}
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Track on Map
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
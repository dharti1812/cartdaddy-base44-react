import React, { useState, useEffect } from 'react';
import { Order, Retailer } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, MapPin, User, Phone, Clock, CheckCircle,
  Navigation, AlertCircle, IndianRupee, RefreshCw
} from "lucide-react";
import { format } from "date-fns";

// Status configuration with progress steps
const statusSteps = [
  { key: 'pending_acceptance', label: 'Order Placed', icon: Package },
  { key: 'accepted_primary', label: 'Accepted', icon: CheckCircle },
  { key: 'payment_pending', label: 'Payment', icon: IndianRupee },
  { key: 'assigned_to_delivery_boy', label: 'Preparing', icon: Package },
  { key: 'en_route', label: 'Out for Delivery', icon: Navigation },
  { key: 'arrived', label: 'Nearby', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
];

const statusColors = {
  pending_acceptance: 'bg-amber-500',
  accepted_primary: 'bg-blue-500',
  payment_pending: 'bg-purple-500',
  assigned_to_delivery_boy: 'bg-indigo-500',
  en_route: 'bg-orange-500',
  arrived: 'bg-green-500',
  delivered: 'bg-emerald-600',
  cancelled: 'bg-red-500'
};

export default function TrackOrder() {
  const [order, setOrder] = useState(null);
  const [retailer, setRetailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    
    if (orderId) {
      loadOrderDetails(orderId);
      
      // Auto-refresh every 15 seconds
      if (autoRefresh) {
        const interval = setInterval(() => loadOrderDetails(orderId), 15000);
        return () => clearInterval(interval);
      }
    }
  }, [autoRefresh]);

  const loadOrderDetails = async (orderId) => {
    try {
      const orderData = await Order.get(orderId);
      setOrder(orderData);

      // Load retailer details
      if (orderData.active_retailer_id) {
        const retailerData = await Retailer.get(orderData.active_retailer_id);
        setRetailer(retailerData);

        // Get delivery boy's real-time location
        if (orderData.assigned_delivery_boy) {
          const deliveryBoy = retailerData.delivery_boys?.find(
            db => db.id === orderData.assigned_delivery_boy.id
          );
          if (deliveryBoy?.location_tracking?.coords) {
            setDeliveryBoyLocation(deliveryBoy.location_tracking.coords);
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading order:", error);
      setLoading(false);
    }
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = statusSteps.findIndex(step => step.key === order.status);
    return index >= 0 ? index : 0;
  };

  const getEstimatedArrival = () => {
    if (!order || !order.estimated_delivery_time) return null;
    const eta = new Date(order.estimated_delivery_time);
    const now = new Date();
    const minutesRemaining = Math.ceil((eta - now) / 1000 / 60);
    return minutesRemaining > 0 ? minutesRemaining : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
            <p className="text-gray-600">Please check your tracking link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const minutesRemaining = getEstimatedArrival();

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0E5D52] to-teal-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Track Your Order</h1>
              <p className="text-teal-100 text-sm mt-1">
                Order #{order.website_ref || order.id.slice(0, 8)}
              </p>
            </div>
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e16ead60e37f9dc085ad75/083eaf7b4_ChatGPTImageOct5202504_05_55AM-Photoroom.png"
              alt="Cart Daddy"
              className="h-16 w-auto"
            />
          </div>

          {minutesRemaining !== null && minutesRemaining > 0 && order.status !== 'delivered' && (
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6" />
                <div>
                  <p className="text-sm opacity-90">Estimated Arrival</p>
                  <p className="text-2xl font-bold">{minutesRemaining} min</p>
                </div>
              </div>
              {autoRefresh && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Timeline */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Status</h2>
            <div className="relative">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex items-start mb-8 last:mb-0">
                    {/* Timeline Line */}
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute left-6 top-12 w-0.5 h-16 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    )}

                    {/* Icon */}
                    <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-green-200 animate-pulse' : ''}`}>
                      <StepIcon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="ml-4 flex-1">
                      <p className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </p>
                      {isCurrent && order.status !== 'delivered' && (
                        <p className="text-sm text-green-600 mt-1 font-medium">In Progress...</p>
                      )}
                      {isCompleted && !isCurrent && (
                        <p className="text-sm text-gray-500 mt-1">✓ Completed</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Partner Details */}
        {order.assigned_delivery_boy && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Partner</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {order.assigned_delivery_boy.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">
                    {order.assigned_delivery_boy.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {retailer?.vehicle_type || 'Bike'} • {retailer?.vehicle_number || 'N/A'}
                  </p>
                  <a 
                    href={`tel:${order.assigned_delivery_boy.phone}`}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <Phone className="w-3 h-3" />
                    {order.assigned_delivery_boy.phone}
                  </a>
                </div>
                {['en_route', 'arrived'].includes(order.status) && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                )}
              </div>

              {/* Live Location */}
              {deliveryBoyLocation && ['en_route', 'arrived'].includes(order.status) && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Live Location</p>
                        <p className="text-xs text-green-700">
                          Updated {new Date(deliveryBoyLocation.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${deliveryBoyLocation.lat},${deliveryBoyLocation.lng}`,
                          '_blank'
                        );
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Open Map
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
            
            {/* Items */}
            <div className="space-y-2 mb-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">₹{item.price}</p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-green-600">₹{order.total_amount}</span>
              </div>
              {order.is_cod && (
                <Badge className="bg-amber-500 text-white">
                  <IndianRupee className="w-3 h-3 mr-1" />
                  Cash on Delivery
                </Badge>
              )}
            </div>

            {/* Delivery Address */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Delivery Address</p>
                  <p className="text-sm text-blue-800">
                    {order.drop_address?.street}
                  </p>
                  <p className="text-sm text-blue-800">
                    {order.drop_address?.city}, {order.drop_address?.pincode}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivered Message */}
        {order.status === 'delivered' && (
          <Card className="border-none shadow-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Delivered! 🎉</h2>
              <p className="text-green-100">
                Thank you for ordering with Cart Daddy
              </p>
              <p className="text-sm text-green-100 mt-2">
                Delivered at {format(new Date(order.actual_delivery_time || order.updated_date), "h:mm a, MMM d")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Order Status
        </Button>
      </div>
    </div>
  );
}
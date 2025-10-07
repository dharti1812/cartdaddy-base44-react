
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, IndianRupee, Clock, Navigation as NavigationIcon, AlertCircle, TrendingUp, Store } from "lucide-react"; // Added Store icon
import { Order, Retailer, DeliveryPartner } from "@/api/entities"; // Added DeliveryPartner entity
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

export default function AvailableOrdersForDeliveryBoy({ orders, partnerId, onAccept }) {
  const [deliveryPartner, setDeliveryPartner] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state for delivery partner data

  useEffect(() => {
    loadPartner();
  }, [partnerId]);

  const loadPartner = async () => {
    if (!partnerId) {
      setLoading(false);
      return;
    }
    try {
      const dp = await DeliveryPartner.filter({ id: partnerId }).then(r => r[0]);
      setDeliveryPartner(dp);
    } catch (error) {
      console.error("Failed to load delivery partner:", error);
      // Optionally handle error, e.g., show a toast message
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on:
  // 1. Vehicle type matching
  // 2. Mutual retailer-delivery boy linkage
  const filteredOrders = orders.filter(order => {
    if (!deliveryPartner) return false; // Don't show orders if delivery partner data isn't loaded yet

    // Check vehicle type match
    // If order has no required_vehicle_type, it's open to all vehicle types
    const vehicleMatches = !order.required_vehicle_type ||
                          order.required_vehicle_type === deliveryPartner.vehicle_type;

    if (!vehicleMatches) return false; // If vehicle type doesn't match, filter out

    // Check mutual linkage (delivery partner selected retailer)
    const retailerId = order.active_retailer_id;
    if (!retailerId) return true; // If no specific retailer assigned to order yet, show to all matching vehicle types

    // Check if delivery partner has selected this retailer
    const dpSelectedRetailer = deliveryPartner.selected_retailers && deliveryPartner.selected_retailers.includes(retailerId);

    // The order must be awaiting a delivery boy. If dpSelectedRetailer is true, and the order is awaiting, it's considered available.
    return dpSelectedRetailer && order.awaiting_delivery_boy;
  });

  const handleAcceptOrder = async (order) => {
    setAccepting(order.id);

    if (!deliveryPartner) {
      alert("Error: Delivery partner data not loaded. Please try again.");
      setAccepting(null);
      return;
    }

    // Race condition handling - first delivery boy to accept wins
    // Update order with delivery boy assignment
    const updateData = {
      assigned_delivery_boy: {
        id: deliveryPartner.id,
        name: deliveryPartner.name,
        phone: deliveryPartner.phone,
        device_id: deliveryPartner.device_id,
        device_name: deliveryPartner.device_name,
        assigned_at: new Date().toISOString(),
        started_delivery_at: null
      },
      awaiting_delivery_boy: false,
      status: 'assigned_to_delivery_boy'
    };

    try {
      // 1. Update the Order with assignment details
      await Order.update(order.id, updateData);

      // 2. Update Delivery Partner's current order ID
      // This ensures the delivery partner entity reflects which order they are currently handling.
      await DeliveryPartner.update(deliveryPartner.id, {
        current_order_id: order.id
      });
      // Update local state immediately to reflect the change
      setDeliveryPartner(prev => ({ ...prev, current_order_id: order.id }));

      // 3. Notify customer about the assigned delivery partner
      // We need retailerProfile for the notification. Fetch it using active_retailer_id from the order.
      let currentRetailerProfile = null;
      if (order.active_retailer_id) {
        currentRetailerProfile = await Retailer.filter({ id: order.active_retailer_id }).then(r => r[0]);
      }

      const { notifyDeliveryPartnerAssigned } = await import('../utils/customerNotifications');
      await notifyDeliveryPartnerAssigned({...order, ...updateData}, deliveryPartner, currentRetailerProfile);

      alert("✅ Order accepted! Start delivery when ready.");
      onAccept(); // Callback to parent component, e.g., to refresh the list of available orders
    } catch (error) {
      // This catch block handles errors during order update, delivery partner update, or notification.
      alert("❌ Failed to accept order. It may have been taken by another delivery partner or an error occurred.");
      console.error("Error accepting order:", error);
    }

    setAccepting(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading delivery partner data...</p>
      </div>
    );
  }

  if (filteredOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Available</h3>
        <p className="text-gray-500 text-sm">
          {orders.length > 0
            ? `${orders.length} order${orders.length > 1 ? 's' : ''} available, but none match your vehicle type or retailer preferences.`
            : 'No new orders at the moment.'}
        </p>
        {deliveryPartner?.vehicle_type && (
          <Badge className="mt-3 bg-blue-100 text-blue-800">
            Your Vehicle: {deliveryPartner.vehicle_type === '2_wheeler' ? '🏍️ 2-Wheeler' : '🚗 4-Wheeler'}
          </Badge>
        )}
        <p className="text-gray-400 text-sm mt-2">New delivery requests will appear here when they match your profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vehicle Type Info */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-900 text-sm">
          <strong>Showing orders for your vehicle:</strong> {deliveryPartner?.vehicle_type === '2_wheeler' ? '🏍️ 2-Wheeler' : '🚗 4-Wheeler'}
          <br/>Orders from mutually linked retailers only.
        </AlertDescription>
      </Alert>

      <Alert className="bg-green-50 border-green-500">
        <TrendingUp className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-green-900 font-semibold">
          🏃 {filteredOrders.length} order{filteredOrders.length > 1 ? 's' : ''} available! First to accept wins!
        </AlertDescription>
      </Alert>

      {filteredOrders.map((order) => {
        const estimatedEarning = (order.total_amount * 0.1).toFixed(0); // 10% of order value
        const isCOD = order.is_cod || order.payment_method === 'cod';

        return (
          <Card key={order.id} className="border-2 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-0">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    🆕 {order.website_ref || `Order #${order.id.slice(0, 8)}`}
                  </h3>
                  <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                    NEW!
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1 font-bold text-green-700">
                    <TrendingUp className="w-4 h-4" />
                    <span>Earn: ₹{estimatedEarning}</span>
                  </div>
                  {order.distance_km && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <NavigationIcon className="w-4 h-4" />
                        <span>{order.distance_km} km</span>
                      </div>
                    </>
                  )}
                  {order.sla_minutes && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Deliver in {order.sla_minutes} min</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Vehicle type and Retailer info badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {order.required_vehicle_type && (
                    <Badge className={
                      order.required_vehicle_type === '2_wheeler'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }>
                      {order.required_vehicle_type === '2_wheeler' ? '🏍️ 2-Wheeler' : '🚗 4-Wheeler'} Required
                    </Badge>
                  )}
                  {order.active_retailer_info && (
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      <Store className="w-3 h-3 mr-1" />
                      {order.active_retailer_info.retailer_business_name || order.active_retailer_info.retailer_name}
                    </Badge>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{order.customer_name}</span>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-800 mb-1">DELIVERY ADDRESS</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {order.drop_address?.street}
                      </p>
                      <p className="text-sm text-gray-700">
                        {order.drop_address?.city}, {order.drop_address?.pincode}
                      </p>
                      {order.distance_km && (
                        <div className="mt-2 text-xs text-blue-700">
                          📍 {order.distance_km} km from current location
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Order Value</p>
                    <p className="text-lg font-bold text-gray-900">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <p className="text-lg font-bold text-gray-900">
                      {isCOD ? '💵 COD' : '✅ Paid'}
                    </p>
                  </div>
                </div>

                {isCOD && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <IndianRupee className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      <strong>Collect ₹{order.total_amount} in cash</strong> from customer
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => handleAcceptOrder(order)}
                  disabled={accepting === order.id || deliveryPartner?.current_order_id} // Disable if already accepting or has an active order
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-bold"
                >
                  {accepting === order.id
                    ? "Accepting..."
                    : deliveryPartner?.current_order_id
                      ? "Already have an active order"
                      : "🏃 ACCEPT & START DELIVERY"
                  }
                </Button>

                <p className="text-xs text-center text-gray-500">
                  ⚡ Accept quickly! Other delivery partners can see this order too
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

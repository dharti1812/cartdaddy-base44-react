
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Alert and AlertDescription might not be needed if COD alert is removed.
import {
  MapPin, Package, IndianRupee, Phone, Navigation as NavigationIcon,
  CheckCircle, Store, Clock, RefreshCw // Added RefreshCw icon
} from "lucide-react";
import { Order, DeliveryPartner } from "@/api/entities";

import HandoffOTPSystem from "./HandoffOTPSystem"; // New import

export default function MyActiveDeliveries({ orders, deliveryPartner, onUpdate }) {
  const [updating, setUpdating] = useState(null);
  const [showHandoffDialog, setShowHandoffDialog] = useState(false); // New state
  const [selectedOrderForHandoff, setSelectedOrderForHandoff] = useState(null); // New state

  const handleStartDelivery = async (order) => {
    setUpdating(order.id);
    const updates = {
      status: 'en_route',
      'assigned_delivery_boy.started_delivery_at': new Date().toISOString()
    };
    await Order.update(order.id, updates);

    const { notifyCustomerOnStatusChange } = await import('../utils/customerNotifications');
    await notifyCustomerOnStatusChange({ ...order, status: 'en_route' }, order.status, null, deliveryPartner);

    setUpdating(null);
    onUpdate();
  };

  const handleMarkArrived = async (order) => {
    setUpdating(order.id);
    const updates = { status: 'arrived' };
    await Order.update(order.id, updates);

    const { notifyCustomerOnStatusChange } = await import('../utils/customerNotifications');
    await notifyCustomerOnStatusChange({ ...order, status: 'arrived' }, order.status, null, deliveryPartner);

    setUpdating(null);
    onUpdate();
  };

  const handleMarkDelivered = async (order) => {
    setUpdating(order.id);
    const updates = {
      status: 'delivered',
      actual_delivery_time: new Date().toISOString()
    };

    await Order.update(order.id, updates);

    // Update delivery partner stats
    await DeliveryPartner.update(deliveryPartner.id, {
      current_order_id: null,
      availability_status: 'online',
      successful_deliveries: (deliveryPartner.successful_deliveries || 0) + 1,
      total_deliveries: (deliveryPartner.total_deliveries || 0) + 1
    });

    const { notifyCustomerOnStatusChange } = await import('../utils/customerNotifications');
    await notifyCustomerOnStatusChange({ ...order, status: 'delivered' }, order.status, null, deliveryPartner);

    setUpdating(null);
    onUpdate();
  };

  const openNavigation = (address) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address.lat},${address.lng}`;
    window.open(url, '_blank');
  };

  if (orders.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Deliveries</h3>
          <p className="text-gray-500">Your accepted deliveries will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const canStartDelivery = order.status === 'assigned_to_delivery_boy';
          const isEnRoute = order.status === 'en_route';
          const hasArrived = order.status === 'arrived';

          return (
            <Card key={order.id} className="border-2 border-blue-300 shadow-lg">
              <CardContent className="p-0">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {order.website_ref || `Order #${order.id.slice(0, 8)}`}
                    </h3>
                    <Badge className={`${
                      canStartDelivery ? 'bg-amber-500' :
                      isEnRoute ? 'bg-blue-500' :
                      hasArrived ? 'bg-green-500' : 'bg-gray-500'
                    } text-white`}>
                      {canStartDelivery && '📦 Ready'}
                      {isEnRoute && '🚀 En Route'}
                      {hasArrived && '📍 Arrived'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Customer: {order.customer_name}
                  </p>
                </div>

                <div className="p-4 space-y-4">
                  {/* Customer and earnings section */}
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <a href={`tel:${order.customer_phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {order.customer_phone}
                      </a>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">₹{(order.total_amount * 0.1).toFixed(0)}</p>
                      <p className="text-xs text-gray-600">Your earnings</p>
                    </div>
                  </div>

                  {/* Delivery Address section */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-800 mb-1">DELIVERY ADDRESS</p>
                      <p className="text-sm text-gray-900 font-medium">
                        {order.drop_address?.street}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        {order.drop_address?.city}, {order.drop_address?.pincode}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="flex-shrink-0 border-blue-300 hover:bg-blue-100"
                      onClick={() => openNavigation(order.drop_address)}
                    >
                      <NavigationIcon className="w-4 h-4 text-blue-600" />
                    </Button>
                  </div>

                  {/* COD Alert (re-added as it's a critical piece of information) */}
                  {order.is_cod && (
                    <Alert className="bg-amber-50 border-amber-300">
                      <IndianRupee className="w-4 h-4 text-amber-600" />
                      <AlertDescription className="text-amber-900 font-bold">
                        COD: Collect ₹{order.total_amount} cash from customer
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Distance and Estimated Time (re-added as it's useful information) */}
                  {order.distance_km && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 p-2 border border-gray-200 rounded-lg bg-gray-50">
                      <NavigationIcon className="w-4 h-4" />
                      <span>{order.distance_km.toFixed(1)} km • Est. {Math.ceil(order.distance_km * 3)} min</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {canStartDelivery && (
                      <Button
                        onClick={() => handleStartDelivery(order)}
                        disabled={updating === order.id}
                        className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                      >
                        {updating === order.id ? "Starting..." : "🚀 Start Delivery"}
                      </Button>
                    )}

                    {isEnRoute && (
                      <>
                        <Button
                          onClick={() => handleMarkArrived(order)}
                          disabled={updating === order.id}
                          className="bg-green-600 hover:bg-green-700 text-white py-6"
                        >
                          {updating === order.id ? "Updating..." : "📍 Mark Arrived"}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedOrderForHandoff(order);
                            setShowHandoffDialog(true);
                          }}
                          variant="outline"
                          className="border-2 border-orange-400 text-orange-700 hover:bg-orange-50 py-6"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Handoff Order
                        </Button>
                      </>
                    )}

                    {hasArrived && (
                      <>
                        <Button
                          onClick={() => handleMarkDelivered(order)}
                          disabled={updating === order.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-6"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {updating === order.id ? "Completing..." : "✅ Delivered"}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedOrderForHandoff(order);
                            setShowHandoffDialog(true);
                          }}
                          variant="outline"
                          className="border-2 border-orange-400 text-orange-700 hover:bg-orange-50 py-6"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Handoff
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Handoff OTP Dialog */}
      {showHandoffDialog && selectedOrderForHandoff && (
        <HandoffOTPSystem
          order={selectedOrderForHandoff}
          currentDeliveryPartner={deliveryPartner}
          onClose={() => {
            setShowHandoffDialog(false);
            setSelectedOrderForHandoff(null);
          }}
          onHandedOff={onUpdate}
        />
      )}
    </>
  );
}

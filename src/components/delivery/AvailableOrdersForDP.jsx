
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Package, IndianRupee, Clock, Navigation as NavigationIcon, Store } from "lucide-react";
import { Order, DeliveryPartner } from "@/api/entities";
import { format } from "date-fns";

export default function AvailableOrdersForDP({ orders, deliveryPartner, onAccept }) {
  const [accepting, setAccepting] = useState(null);

  const handleAccept = async (order) => {
    setAccepting(order.id);

    const deviceId = localStorage.getItem('cart_daddy_device_id') || 'unknown';
    const deviceName = /mobile/i.test(navigator.userAgent) ? 'Mobile Device' : 
                       /tablet/i.test(navigator.userAgent) ? 'Tablet' : 'Desktop/Laptop';

    // Update order with delivery boy assignment
    await Order.update(order.id, {
      assigned_delivery_boy: {
        id: deliveryPartner.id,
        name: deliveryPartner.full_name,
        phone: deliveryPartner.phone,
        vehicle_type: deliveryPartner.vehicle_type, // Added vehicle_type
        device_id: deviceId,
        device_name: deviceName,
        assigned_at: new Date().toISOString()
      },
      awaiting_delivery_boy: false,
      status: 'assigned_to_delivery_boy'
    });

    // Update delivery partner
    await DeliveryPartner.update(deliveryPartner.id, {
      current_order_id: order.id,
      availability_status: 'on_delivery'
    });

    // Send notifications
    const { notifyDeliveryPartnerAssigned } = await import('../utils/customerNotifications');
    await notifyDeliveryPartnerAssigned(order, deliveryPartner, order.active_retailer_info);

    setAccepting(null);
    onAccept();
  };

  // Filter orders that match this delivery partner's vehicle type and mutual partnership
  const matchingOrders = orders.filter(order => {
    // Check vehicle type match
    if (order.required_vehicle_type && order.required_vehicle_type !== deliveryPartner.vehicle_type) {
      return false;
    }
    
    // Check mutual partnership
    const retailerPartnership = (deliveryPartner.partnered_retailers || []).find(
      pr => pr.retailer_id === order.active_retailer_id
    );
    
    if (!retailerPartnership || retailerPartnership.partnership_status !== 'approved') {
      return false;
    }
    
    return true;
  });

  if (matchingOrders.length === 0) {
    const vehicleIcon = deliveryPartner.vehicle_type === '2_wheeler' ? '🏍️' : '🚗';
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Available Orders</h3>
          <p className="text-gray-500">
            {vehicleIcon} Showing only {deliveryPartner.vehicle_type.replace('_', '-')} orders from your partnered retailers
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matchingOrders.map((order) => {
        const retailer = deliveryPartner.partnered_retailers?.find(
          pr => pr.retailer_id === order.active_retailer_id
        );
        
        const vehicleIcon = order.required_vehicle_type === '2_wheeler' ? '🏍️' : '🚗';
        
        return (
          <Card key={order.id} className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg animate-pulse-slow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{vehicleIcon}</span>
                      <h3 className="text-xl font-bold text-gray-900">
                        Order #{order.website_ref || order.id.slice(0, 8)}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Store className="w-4 h-4" />
                      <span className="font-medium">{retailer?.retailer_name || 'Retailer'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-600 text-white text-lg px-3 py-1 mb-2">
                      <IndianRupee className="w-4 h-4 mr-1 inline" />
                      Earn ₹{(order.total_amount * 0.1).toFixed(0)}
                    </Badge>
                    <p className="text-xs text-gray-600">Commission (10%)</p>
                  </div>
                </div>

                <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{order.customer_name}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{order.drop_address?.street}</p>
                      <p className="text-gray-600">{order.drop_address?.city}, {order.drop_address?.pincode}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <NavigationIcon className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-bold text-gray-900">{order.distance_km || '?'} km</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Deliver in</p>
                    <p className="font-bold text-gray-900">{order.sla_minutes || 60} min</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <IndianRupee className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Order Value</p>
                    <p className="font-bold text-gray-900">₹{order.total_amount}</p>
                  </div>
                </div>

                {order.is_cod && (
                  <Alert className="bg-amber-50 border-amber-300">
                    <IndianRupee className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-amber-900 text-sm font-medium">
                      Cash on Delivery - Collect ₹{order.total_amount} from customer
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Posted {format(new Date(order.created_date), 'h:mm a')} • First to accept gets the order!
                </div>

                <Button
                  onClick={() => handleAccept(order)}
                  disabled={accepting === order.id}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-bold"
                >
                  {accepting === order.id ? "Accepting..." : `🚀 Accept ${vehicleIcon} Delivery`}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

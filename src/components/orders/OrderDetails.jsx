import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, Package, User, MapPin, Phone, IndianRupee, 
  Clock, CheckCircle, AlertCircle 
} from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/api/entities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusConfig = {
  pending_acceptance: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  assigned: { label: "Assigned", color: "bg-purple-100 text-purple-800 border-purple-200" },
  en_route: { label: "En Route", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  arrived: { label: "Arrived", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  otp_verified: { label: "OTP Verified", color: "bg-teal-100 text-teal-800 border-teal-200" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" }
};

export default function OrderDetails({ order, retailers, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState(order.retailer_id || "");

  const handleAssignRetailer = async () => {
    if (!selectedRetailer) return;
    setUpdating(true);
    await Order.update(order.id, {
      retailer_id: selectedRetailer,
      status: 'assigned'
    });
    setUpdating(false);
    onUpdate();
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await Order.update(order.id, { status: newStatus });
    setUpdating(false);
    onUpdate();
  };

  const availableRetailers = retailers.filter(r => 
    r.status === 'active' && r.availability_status === 'online'
  );

  return (
    <Card className="border-none shadow-lg sticky top-4">
      <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold text-gray-900">Order Details</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {order.website_ref || `Order #${order.id.slice(0, 8)}`}
            </h3>
            <Badge className={`${statusConfig[order.status]?.color} border`}>
              {statusConfig[order.status]?.label}
            </Badge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{order.customer_name}</p>
                <p className="text-gray-600">{order.customer_masked_contact}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700 mb-1">Delivery Address</p>
                <p className="text-gray-600">
                  {order.drop_address?.street}, {order.drop_address?.city}
                </p>
                <p className="text-gray-600">{order.drop_address?.pincode}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Created</p>
                <p className="text-gray-600">
                  {format(new Date(order.created_date), "PPpp")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-2">
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
          
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Charge</span>
              <span className="font-medium">₹{order.delivery_charge}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {order.total_amount}
              </span>
            </div>
          </div>
        </div>

        {order.status === 'pending_acceptance' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Assign Retailer</h3>
            <div className="space-y-3">
              <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select retailer" />
                </SelectTrigger>
                <SelectContent>
                  {availableRetailers.map(retailer => (
                    <SelectItem key={retailer.id} value={retailer.id}>
                      {retailer.full_name} - {retailer.vehicle_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignRetailer}
                disabled={!selectedRetailer || updating}
                className="w-full bg-blue-900 hover:bg-blue-800"
              >
                Assign & Start Delivery
              </Button>
            </div>
          </div>
        )}

        {order.status !== 'pending_acceptance' && order.status !== 'delivered' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
            <div className="space-y-2">
              {order.status === 'assigned' && (
                <Button
                  onClick={() => handleStatusChange('en_route')}
                  disabled={updating}
                  variant="outline"
                  className="w-full"
                >
                  Mark as En Route
                </Button>
              )}
              {order.status === 'en_route' && (
                <Button
                  onClick={() => handleStatusChange('arrived')}
                  disabled={updating}
                  variant="outline"
                  className="w-full"
                >
                  Mark as Arrived
                </Button>
              )}
              {order.status === 'arrived' && (
                <Button
                  onClick={() => handleStatusChange('delivered')}
                  disabled={updating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}
            </div>
          </div>
        )}

        {order.payment_status !== 'paid' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Payment Pending</p>
                <p className="text-sm text-amber-700 mt-1">
                  Payment status: {order.payment_status}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
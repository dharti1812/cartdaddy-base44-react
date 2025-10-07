import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, MapPin, Phone, IndianRupee, Navigation, Clock, CheckCircle, 
  ChevronDown, ChevronUp, User, Key, XCircle, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/api/entities";

const statusConfig = {
  assigned_to_delivery_boy: { label: "Pickup Pending", color: "bg-amber-100 text-amber-800", icon: Package },
  en_route: { label: "En Route", color: "bg-blue-100 text-blue-800", icon: Navigation },
  arrived: { label: "Arrived at Location", color: "bg-purple-100 text-purple-800", icon: MapPin },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle }
};

const OrderItem = ({ order, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    setError("");
    try {
      if (newStatus === 'delivered') {
        if (!otp || otp !== order.delivery_otp) {
          setError("Invalid Delivery OTP. Please ask the customer for the 4-digit code.");
          setLoading(false);
          return;
        }
        await Order.update(order.id, { 
          status: newStatus, 
          actual_delivery_time: new Date().toISOString(),
          delivery_otp_verified_at: new Date().toISOString()
        });
      } else {
        await Order.update(order.id, { status: newStatus });
      }
      onUpdate(); // Refresh parent list
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const StatusButton = ({ currentStatus }) => {
    if (loading) return <Button disabled size="sm"><RefreshCw className="w-4 h-4 animate-spin mr-2" />Updating...</Button>
    
    switch (currentStatus) {
      case 'assigned_to_delivery_boy':
        return <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusUpdate('en_route')}>Start Delivery</Button>;
      case 'en_route':
        return <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => handleStatusUpdate('arrived')}>Arrived at Location</Button>;
      case 'arrived':
        return (
          <div className="p-4 bg-gray-100 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-gray-600"/>
              <input 
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={4}
                className="w-full p-2 border rounded text-center text-lg font-bold tracking-widest"
              />
            </div>
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate('delivered')} disabled={otp.length !== 4}>Confirm Delivery</Button>
          </div>
        );
      default:
        return null;
    }
  };

  const config = statusConfig[order.status] || {};

  return (
    <Card className="border-2 border-gray-200 shadow-sm">
      <CardHeader className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">{order.website_ref || `Order #${order.id.slice(0, 6)}`}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${config.color} border`}>{config.label}</Badge>
              <p className="text-sm text-gray-500">{format(new Date(order.created_date), "MMM d, h:mm a")}</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4 border-t">
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-gray-600">Your Earning</span>
              <span className="font-bold text-lg text-green-600 flex items-center"><IndianRupee className="w-4 h-4"/>{order.rider_payout?.toFixed(2) || 'N/A'}</span>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-500"/>{order.customer_name}</div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-500"/>{order.drop_address?.street}, {order.drop_address?.city}</div>
              <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-500"/>{order.customer_phone}</div>
            </div>
            
            <StatusButton currentStatus={order.status} />

          </div>
        </CardContent>
      )}
    </Card>
  );
};


export default function MyDeliveriesForDeliveryBoy({ partner, orders, onRefresh }) {
  const myOrders = orders.filter(o => o.assigned_delivery_boy?.id === partner?.id && o.status !== 'delivered' && o.status !== 'cancelled');

  if (myOrders.length === 0) {
    return (
      <Card className="text-center p-8">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-lg text-gray-700">No Active Deliveries</h3>
        <p className="text-sm text-gray-500">Your assigned deliveries will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {myOrders.map(order => (
        <OrderItem key={order.id} order={order} onUpdate={onRefresh} />
      ))}
    </div>
  );
}
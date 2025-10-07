
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Phone, Smartphone, AlertCircle, CheckCircle } from "lucide-react";
import { Order, Retailer } from "@/api/entities";
import { sendOrderOTP } from '../utils/sarvAPI';

export default function AssignDeliveryBoy({ order, retailerProfile, onClose, onAssigned }) {
  const [assigning, setAssigning] = useState(false); // Changed to boolean
  const [selectedBoy, setSelectedBoy] = useState(null);

  const deliveryBoys = retailerProfile?.delivery_boys?.filter(db => db.is_active && !db.current_order_id) || [];

  const handleAssign = async () => {
    if (!selectedBoy) return;

    setAssigning(true);
    try {
      // 1. Generate and save delivery OTP
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

      // 2. Send OTP to customer
      await sendOrderOTP(order.customer_phone, order.customer_name, order.website_ref, deliveryOtp);

      // 3. Update order
      await Order.update(order.id, {
        status: "assigned_to_delivery_boy",
        delivery_otp: deliveryOtp,
        assigned_delivery_boy: {
          id: selectedBoy.id,
          name: selectedBoy.name,
          phone: selectedBoy.phone,
          device_id: selectedBoy.device_id,
          device_name: selectedBoy.device_name,
          assigned_at: new Date().toISOString(),
          // started_delivery_at was here in original, but not in outline for new object. Sticking to outline.
        },
        awaiting_delivery_boy: false,
      });

      // 4. Update retailer's delivery boy status
      const updatedDeliveryBoys = retailerProfile.delivery_boys.map(db =>
        db.id === selectedBoy.id ? {...db, current_order_id: order.id} : db
      );

      await Retailer.update(retailerProfile.id, {
        delivery_boys: updatedDeliveryBoys
      });

      setAssigning(false);
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Error assigning delivery boy:", error);
      // TODO: Implement user-facing error feedback (e.g., toast notification)
      setAssigning(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Assign Delivery Boy</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">Order Details</p>
            <p className="text-xs text-blue-700 mt-1">
              {order.website_ref || `#${order.id.slice(0, 8)}`} • {order.customer_name} • ₹{order.total_amount}
            </p>
          </div>

          {deliveryBoys.length === 0 ? (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>No delivery boys available</strong><br/>
                Please login a delivery boy before assigning orders
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-700">Select Delivery Boy:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {deliveryBoys.map((db) => (
                  <button
                    key={db.id}
                    onClick={() => setSelectedBoy(db)}
                    disabled={assigning}
                    className={`w-full flex items-center justify-between p-3 bg-white border-2 rounded-lg transition-all disabled:opacity-50
                      ${selectedBoy?.id === db.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {db.name[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{db.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{db.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Smartphone className="w-3 h-3" />
                          <span>{db.device_name}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {selectedBoy?.id === db.id && !assigning ? (
                         <Badge className="bg-green-600 text-white">
                           <CheckCircle className="w-3 h-3 mr-1" />
                           Selected
                         </Badge>
                      ) : (
                        <Badge className="bg-gray-200 text-gray-700">
                          Available
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedBoy || assigning}>
            {assigning ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

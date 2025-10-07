import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Key, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Order, Retailer } from "@/api/entities";

export default function HandoffDeliveryBoy({ order, retailerProfile, onClose, onHandedOff }) {
  const [step, setStep] = useState('generate'); // 'generate' or 'verify'
  const [otp, setOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const availableDeliveryBoys = retailerProfile?.delivery_boys?.filter(
    db => db.is_active && !db.current_order_id && db.id !== order.assigned_delivery_boy?.id
  ) || [];

  const generateOTP = async () => {
    setGenerating(true);
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Order.update(order.id, {
      handoff_otp: newOtp,
      handoff_otp_generated_at: new Date().toISOString(),
      handoff_otp_expires_at: expiresAt.toISOString()
    });

    setOtp(newOtp);
    setGenerating(false);
    setStep('verify');
  };

  const verifyAndHandoff = async () => {
    if (!selectedDeliveryBoy) {
      alert('Please select a delivery boy');
      return;
    }

    if (enteredOtp !== otp) {
      alert('Invalid OTP. Please try again.');
      return;
    }

    setVerifying(true);

    // Update order with new delivery boy
    const handoffHistory = order.handoff_history || [];
    handoffHistory.push({
      from_delivery_boy: order.assigned_delivery_boy?.name,
      to_delivery_boy: selectedDeliveryBoy.name,
      reason: "Delivery boy handoff",
      transferred_at: new Date().toISOString()
    });

    await Order.update(order.id, {
      assigned_delivery_boy: {
        id: selectedDeliveryBoy.id,
        name: selectedDeliveryBoy.name,
        phone: selectedDeliveryBoy.phone,
        device_id: selectedDeliveryBoy.device_id,
        device_name: selectedDeliveryBoy.device_name,
        assigned_at: new Date().toISOString(),
        started_delivery_at: new Date().toISOString()
      },
      handoff_history: handoffHistory,
      handoff_otp: null,
      handoff_otp_generated_at: null,
      handoff_otp_expires_at: null
    });

    // Update retailer's delivery boys
    const updatedDeliveryBoys = retailerProfile.delivery_boys.map(db => {
      if (db.id === order.assigned_delivery_boy?.id) {
        return {...db, current_order_id: null};
      }
      if (db.id === selectedDeliveryBoy.id) {
        return {...db, current_order_id: order.id};
      }
      return db;
    });

    await Retailer.update(retailerProfile.id, {
      delivery_boys: updatedDeliveryBoys
    });

    setVerifying(false);
    onHandedOff();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Handoff Delivery</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">Current Delivery Boy</p>
            <p className="text-sm text-blue-700 mt-1">
              {order.assigned_delivery_boy?.name} • {order.assigned_delivery_boy?.phone}
            </p>
          </div>

          {step === 'generate' && (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  <strong>Step 1:</strong> Generate OTP on current delivery boy's device<br/>
                  <strong>Step 2:</strong> New delivery boy will enter this OTP to take over
                </AlertDescription>
              </Alert>

              <Button
                onClick={generateOTP}
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Key className="w-4 h-4 mr-2" />
                {generating ? "Generating..." : "Generate Handoff OTP"}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg text-center">
                <p className="text-sm font-semibold text-green-900 mb-2">Handoff OTP Generated</p>
                <p className="text-3xl font-bold text-green-700 tracking-wider">{otp}</p>
                <p className="text-xs text-green-600 mt-2">Valid for 5 minutes</p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Clock className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 text-sm">
                  Share this OTP with the new delivery boy. They will enter it below.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="new-db">Select New Delivery Boy *</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {availableDeliveryBoys.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => setSelectedDeliveryBoy(db)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        selectedDeliveryBoy?.id === db.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {db.name[0].toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{db.name}</p>
                          <p className="text-xs text-gray-600">{db.phone}</p>
                        </div>
                      </div>
                      {selectedDeliveryBoy?.id === db.id && (
                        <Badge className="bg-green-500 text-white">Selected</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="verify-otp">New Delivery Boy: Enter OTP *</Label>
                <Input
                  id="verify-otp"
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="text-center text-2xl font-bold tracking-wider"
                />
              </div>

              <Button
                onClick={verifyAndHandoff}
                disabled={!selectedDeliveryBoy || enteredOtp.length !== 6 || verifying}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {verifying ? "Transferring..." : "Confirm Handoff"}
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
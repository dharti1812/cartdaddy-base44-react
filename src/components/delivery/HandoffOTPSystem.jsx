import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { User, Key, Clock, RefreshCw, AlertCircle, CheckCircle, Copy } from "lucide-react";
import { Order, DeliveryPartner } from "@/api/entities";

export default function HandoffOTPSystem({ order, currentDeliveryPartner, onClose, onHandedOff }) {
  const [step, setStep] = useState('select'); // 'select', 'generate', 'verify'
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [otp, setOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [availablePartners, setAvailablePartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handing, setHanding] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  const loadAvailablePartners = useCallback(async () => {
    try {
      // Get all delivery partners who are online and available
      const allPartners = await DeliveryPartner.list();
      const available = allPartners.filter(dp => 
        dp.id !== currentDeliveryPartner.id &&
        dp.availability_status === 'online' &&
        dp.status === 'active'
      );
      setAvailablePartners(available);
      setLoading(false);
    } catch (error) {
      console.error("Error loading partners:", error);
      setLoading(false);
    }
  }, [currentDeliveryPartner.id]);

  useEffect(() => {
    loadAvailablePartners();
  }, [loadAvailablePartners]);

  useEffect(() => {
    if (otpExpiry) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) {
          clearInterval(timer);
          alert("OTP expired! Please generate a new one.");
          setStep('select');
          setOtp('');
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpExpiry]);

  const generateOTP = () => {
    if (!selectedPartner) {
      alert("Please select a delivery partner first");
      return;
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 300000; // 5 minutes from now
    
    setOtp(newOtp);
    setOtpExpiry(expiry);
    setStep('generate');
  };

  const copyOTP = () => {
    navigator.clipboard.writeText(otp);
    alert("OTP copied to clipboard!");
  };

  const verifyAndHandoff = async () => {
    if (enteredOtp !== otp) {
      alert("❌ Invalid OTP. Please try again.");
      return;
    }

    if (Date.now() > otpExpiry) {
      alert("❌ OTP expired! Please generate a new one.");
      setStep('select');
      setOtp('');
      return;
    }

    setHanding(true);

    try {
      // Update order with new delivery partner
      const handoffHistory = order.handoff_history || [];
      handoffHistory.push({
        from_delivery_partner_id: currentDeliveryPartner.id,
        from_delivery_partner_name: currentDeliveryPartner.full_name,
        to_delivery_partner_id: selectedPartner.id,
        to_delivery_partner_name: selectedPartner.full_name,
        reason: "Delivery partner handoff",
        transferred_at: new Date().toISOString(),
        otp_verified: true
      });

      await Order.update(order.id, {
        assigned_delivery_boy: {
          id: selectedPartner.id,
          name: selectedPartner.full_name,
          phone: selectedPartner.phone,
          device_id: selectedPartner.active_device_session?.device_id,
          device_name: selectedPartner.active_device_session?.device_name,
          assigned_at: new Date().toISOString(),
          started_delivery_at: new Date().toISOString()
        },
        handoff_history: handoffHistory,
        handoff_otp: null,
        handoff_otp_generated_at: null,
        handoff_otp_expires_at: null
      });

      // Update delivery partner statuses
      await DeliveryPartner.update(currentDeliveryPartner.id, {
        current_order_id: null,
        availability_status: 'online'
      });

      await DeliveryPartner.update(selectedPartner.id, {
        current_order_id: order.id,
        availability_status: 'on_delivery'
      });

      setHanding(false);
      alert("✅ Order handed off successfully!");
      onHandedOff();
      onClose();
    } catch (error) {
      console.error("Error during handoff:", error);
      alert("Error during handoff. Please try again.");
      setHanding(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Handoff Delivery - OTP Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Order Info */}
          <Card className="bg-blue-50 border-2 border-blue-300">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Current Order Details</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Order:</strong> {order.website_ref || `#${order.id.slice(0, 8)}`}</p>
                <p><strong>Customer:</strong> {order.customer_name}</p>
                <p><strong>Amount:</strong> ₹{order.total_amount}</p>
                <p><strong>Current Handler:</strong> {currentDeliveryPartner.full_name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Select Delivery Partner */}
          {step === 'select' && (
            <div className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  <strong>Handoff Process:</strong><br/>
                  1. Select the delivery partner to handoff to<br/>
                  2. Generate OTP on your device<br/>
                  3. Share OTP with the new delivery partner<br/>
                  4. New partner enters OTP to confirm takeover
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-base font-semibold mb-3 block">Select Delivery Partner to Handoff</Label>
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading available partners...</p>
                ) : availablePartners.length === 0 ? (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <AlertDescription className="text-red-900">
                      No delivery partners available for handoff at the moment.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {availablePartners.map((partner) => (
                      <button
                        key={partner.id}
                        onClick={() => setSelectedPartner(partner)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          selectedPartner?.id === partner.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {partner.full_name[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{partner.full_name}</p>
                            <p className="text-sm text-gray-600">{partner.phone}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-green-500 text-white text-xs">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></div>
                                Online
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {partner.vehicle_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {selectedPartner?.id === partner.id && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPartner && (
                <Button
                  onClick={generateOTP}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
                >
                  <Key className="w-5 h-5 mr-2" />
                  Generate Handoff OTP
                </Button>
              )}
            </div>
          )}

          {/* Step 2: OTP Generated */}
          {step === 'generate' && (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-500">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>OTP Generated Successfully!</strong> Share this OTP with {selectedPartner.full_name}.
                </AlertDescription>
              </Alert>

              <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-4 border-blue-700">
                <CardContent className="p-8 text-center">
                  <p className="text-sm font-semibold mb-3 opacity-90">HANDOFF OTP</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-6xl font-bold tracking-widest font-mono">{otp}</p>
                    <Button
                      onClick={copyOTP}
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm opacity-90">
                    <Clock className="w-4 h-4" />
                    <span>Expires in: <strong className="text-lg">{formatTime(countdown)}</strong></span>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Handing Over To:</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedPartner.full_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPartner.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedPartner.phone}</p>
                  </div>
                </div>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  <strong>Instructions:</strong><br/>
                  1. Share this OTP with {selectedPartner.full_name}<br/>
                  2. Ask them to enter it in their app<br/>
                  3. Once verified, the order will be transferred automatically
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setStep('verify')}
                variant="outline"
                className="w-full"
              >
                I'm the New Handler - Enter OTP
              </Button>
            </div>
          )}

          {/* Step 3: Verify OTP (New Handler) */}
          {step === 'verify' && (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-500">
                <User className="w-5 h-5 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>{selectedPartner.full_name},</strong> enter the OTP shared by {currentDeliveryPartner.full_name} to take over this delivery.
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="verify-otp" className="text-base font-semibold">Enter Handoff OTP</Label>
                <Input
                  id="verify-otp"
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="text-center text-3xl font-bold tracking-widest mt-2 py-6"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>OTP expires in: <strong className="text-red-600">{formatTime(countdown)}</strong></span>
              </div>

              <Button
                onClick={verifyAndHandoff}
                disabled={handing || enteredOtp.length !== 6 || countdown === 0}
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {handing ? "Transferring Order..." : "Confirm Takeover"}
              </Button>

              <Button
                onClick={() => setStep('generate')}
                variant="outline"
                className="w-full"
              >
                Back to View OTP
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={handing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
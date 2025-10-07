import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * CallButton Component
 * Handles different call types based on caller and callee
 * 
 * Direct Calls (no masking):
 * - Retailer → Delivery Boy
 * - Delivery Boy → Retailer
 * 
 * Masked Calls (via cloud telephony):
 * - Admin → Customer, Retailer, Delivery Boy
 * - Super Admin → Customer, Retailer, Delivery Boy
 * - Retailer → Customer
 * - Delivery Boy → Customer
 */

export default function CallButton({ 
  callerType, // 'admin', 'super_admin', 'retailer', 'delivery_boy'
  calleeType, // 'customer', 'retailer', 'delivery_boy'
  calleeNumber,
  calleeName,
  callerNumber,
  orderId,
  size = "default",
  variant = "default",
  showLabel = true
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState(null);

  // Determine if call should be masked
  const shouldMask = () => {
    // Direct calls (no masking)
    if (callerType === 'retailer' && calleeType === 'delivery_boy') return false;
    if (callerType === 'delivery_boy' && calleeType === 'retailer') return false;
    
    // All other calls are masked
    return true;
  };

  const isMasked = shouldMask();

  const handleCallClick = () => {
    setShowDialog(true);
  };

  const initiateCall = async () => {
    setCalling(true);
    setCallStatus('Connecting...');

    try {
      if (isMasked) {
        // Masked call via cloud telephony
        // TODO: Integrate with actual cloud telephony provider (Exotel, Knowlarity, etc.)
        
        // Simulated API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const callData = {
          caller_type: callerType,
          caller_number: callerNumber,
          callee_type: calleeType,
          callee_number: calleeNumber,
          order_id: orderId,
          masked: true,
          recorded: true,
          initiated_at: new Date().toISOString()
        };

        console.log("🔒 Masked call initiated:", callData);
        setCallStatus('Call connected via secure line. Call is being recorded.');
        
      } else {
        // Direct call (no masking)
        console.log("📞 Direct call:", { from: callerNumber, to: calleeNumber });
        setCallStatus(`Calling ${calleeName} directly at ${calleeNumber}`);
        
        // Open phone dialer
        window.location.href = `tel:${calleeNumber}`;
      }

      // Auto-close dialog after 3 seconds
      setTimeout(() => {
        setShowDialog(false);
        setCalling(false);
        setCallStatus(null);
      }, 3000);

    } catch (error) {
      console.error("Call error:", error);
      setCallStatus('Call failed. Please try again.');
      setCalling(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleCallClick}
        className="gap-2"
      >
        <Phone className="w-4 h-4" />
        {showLabel && <span>Call</span>}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isMasked ? '🔒 Secure Call' : '📞 Direct Call'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Calling</p>
                <p className="font-semibold text-lg">{calleeName}</p>
                {!isMasked && (
                  <p className="text-sm text-gray-600">{calleeNumber}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {isMasked ? (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-900 text-sm">
                  <strong>🔒 Secure Masked Call</strong><br/>
                  • Call will be via cloud telephony<br/>
                  • Numbers are masked for privacy<br/>
                  • Call will be recorded for quality & compliance<br/>
                  • Caller ID: Cart Daddy Support
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900 text-sm">
                  <strong>📞 Direct Call</strong><br/>
                  • Direct call from your number<br/>
                  • No masking or recording<br/>
                  • Caller ID: Your phone number
                </AlertDescription>
              </Alert>
            )}

            {callStatus && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-900 font-semibold">
                  {callStatus}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={calling}>
              Cancel
            </Button>
            <Button onClick={initiateCall} disabled={calling} className="bg-green-600 hover:bg-green-700">
              {calling ? (
                <>
                  <PhoneOff className="w-4 h-4 mr-2 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {isMasked ? 'Connect Secure Call' : 'Call Now'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
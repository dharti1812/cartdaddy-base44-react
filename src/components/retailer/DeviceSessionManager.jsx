import React, { useEffect, useState, useCallback } from 'react';
import { Retailer } from "@/api/entities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertTriangle, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Generate unique device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('cart_daddy_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('cart_daddy_device_id', deviceId);
  }
  return deviceId;
};

const getDeviceName = () => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'Mobile Device';
  if (/tablet/i.test(ua)) return 'Tablet';
  return 'Desktop/Laptop';
};

export default function DeviceSessionManager({ retailerId, onSessionConflict }) {
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [existingSession, setExistingSession] = useState(null);
  const [checking, setChecking] = useState(true);

  const createNewSession = useCallback(async () => {
    const deviceId = getDeviceId();
    const now = new Date().toISOString();
    
    await Retailer.update(retailerId, {
      active_device_session: {
        device_id: deviceId,
        device_name: getDeviceName(),
        login_time: now,
        last_active: now,
        ip_address: "Unknown"
      }
    });
  }, [retailerId]);

  const updateLastActive = useCallback(async () => {
    try {
      const retailer = await Retailer.get(retailerId);
      const currentDeviceId = getDeviceId();
      
      if (retailer.active_device_session?.device_id === currentDeviceId) {
        await Retailer.update(retailerId, {
          'active_device_session.last_active': new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating last active:", error);
    }
  }, [retailerId]);

  const checkDeviceSession = useCallback(async () => {
    try {
      const retailer = await Retailer.get(retailerId);
      const currentDeviceId = getDeviceId();
      
      if (retailer.active_device_session) {
        const sessionDeviceId = retailer.active_device_session.device_id;
        const lastActive = new Date(retailer.active_device_session.last_active);
        const now = new Date();
        const minutesInactive = (now - lastActive) / 1000 / 60;
        
        // If session is from different device and still active (< 2 minutes old)
        if (sessionDeviceId !== currentDeviceId && minutesInactive < 2) {
          setExistingSession(retailer.active_device_session);
          setShowConflictDialog(true);
          if (onSessionConflict) {
            onSessionConflict(retailer.active_device_session);
          }
        } else if (sessionDeviceId !== currentDeviceId || minutesInactive >= 2) {
          // Take over session if old device is inactive
          await createNewSession();
        }
      } else {
        // No active session, create one
        await createNewSession();
      }
      
      setChecking(false);
    } catch (error) {
      console.error("Error checking device session:", error);
      setChecking(false);
    }
  }, [retailerId, createNewSession, onSessionConflict]);

  useEffect(() => {
    checkDeviceSession();
    
    // Check session every 30 seconds
    const interval = setInterval(checkDeviceSession, 30000);
    
    // Update last active every 10 seconds
    const activeInterval = setInterval(updateLastActive, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(activeInterval);
    };
  }, [checkDeviceSession, updateLastActive]);

  const handleForceLogin = async () => {
    await createNewSession();
    setShowConflictDialog(false);
    setExistingSession(null);
    window.location.reload();
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  if (checking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5b736] mx-auto mb-4"></div>
          <p className="text-gray-700">Checking device session...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showConflictDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Already Logged In</DialogTitle>
            </div>
            <DialogDescription className="text-base text-gray-700">
              Your account is currently active on another device. Only one device can be logged in at a time.
            </DialogDescription>
          </DialogHeader>

          {existingSession && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{existingSession.device_name}</p>
                  <p className="text-sm text-gray-600">
                    Logged in: {new Date(existingSession.login_time).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Last active: {new Date(existingSession.last_active).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Warning</AlertTitle>
            <AlertDescription className="text-amber-800 text-sm">
              If you continue, the other device will be logged out immediately and won't receive new orders.
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cancel & Logout
            </Button>
            <Button
              onClick={handleForceLogin}
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Login Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
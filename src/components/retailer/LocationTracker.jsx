import React, { useEffect, useState, useCallback } from 'react';
import { Retailer } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MapPin, WifiOff } from "lucide-react";

/**
 * Aggressive Location & Connectivity Tracker
 * 
 * This component:
 * - Forces location tracking every 30 seconds
 * - Detects when location is turned off
 * - Detects when internet is disconnected
 * - Sends alerts when issues are detected
 * - Cannot physically prevent phone shutdown, but detects it immediately
 */

export default function LocationTracker({ deliveryBoyId, retailerId, retailerProfile }) {
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Define logViolation at component level so it can be used everywhere
  const logViolation = useCallback(async (type) => {
    try {
      const updatedDeliveryBoys = retailerProfile.delivery_boys.map(db =>
        db.id === deliveryBoyId
          ? {
              ...db,
              violations: [
                ...(db.violations || []),
                {
                  type: type,
                  timestamp: new Date().toISOString(),
                  message: `Compliance violation: ${type}`
                }
              ]
            }
          : db
      );

      await Retailer.update(retailerId, {
        delivery_boys: updatedDeliveryBoys
      });
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  }, [deliveryBoyId, retailerId, retailerProfile]);

  // Define updateLocationStatus at component level
  const updateLocationStatus = useCallback(async (enabled) => {
    try {
      const updatedDeliveryBoys = retailerProfile.delivery_boys.map(db =>
        db.id === deliveryBoyId
          ? {
              ...db,
              location_tracking: {
                ...db.location_tracking,
                enabled: enabled,
                last_update: new Date().toISOString()
              }
            }
          : db
      );

      await Retailer.update(retailerId, {
        delivery_boys: updatedDeliveryBoys
      });
    } catch (error) {
      console.error("Error updating location status:", error);
    }
  }, [deliveryBoyId, retailerId, retailerProfile]);

  // Monitor internet connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("✅ Internet reconnected");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("❌ Internet disconnected - ALERT!");
      // Log this violation
      logViolation("internet_disconnected");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [logViolation]);

  // Aggressive location tracking
  useEffect(() => {
    let watchId;
    let updateInterval;

    const updateLocation = async (position) => {
      try {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading
        };

        // Update delivery boy's location in database
        const updatedDeliveryBoys = retailerProfile.delivery_boys.map(db =>
          db.id === deliveryBoyId
            ? {
                ...db,
                location_tracking: {
                  enabled: true,
                  coords: coords,
                  last_update: new Date().toISOString(),
                  timestamp: Date.now()
                },
                last_active: new Date().toISOString()
              }
            : db
        );

        await Retailer.update(retailerId, {
          delivery_boys: updatedDeliveryBoys
        });

        setLocationEnabled(true);
        setLocationError(null);
        console.log("📍 Location updated:", coords);
      } catch (error) {
        console.error("Error updating location:", error);
      }
    };

    const handleLocationError = (error) => {
      console.error("❌ Location error:", error);
      setLocationEnabled(false);

      let errorMessage = "Location access denied";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied! Enable GPS immediately!";
          logViolation("location_permission_denied");
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location unavailable. GPS may be turned off!";
          logViolation("location_unavailable");
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }
      setLocationError(errorMessage);

      // Mark location as disabled in database
      updateLocationStatus(false);
    };

    // Request high-accuracy location tracking
    if (navigator.geolocation) {
      // Continuous tracking
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Always get fresh location
        }
      );

      // Force update every 30 seconds even if position hasn't changed much
      updateInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          updateLocation,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }, 30000); // Every 30 seconds
    } else {
      setLocationError("GPS not supported on this device!");
    }

    // Cleanup
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [deliveryBoyId, retailerId, retailerProfile, logViolation, updateLocationStatus]);

  // Prevent app from being closed (show warning)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '⚠️ Warning: Closing app during delivery is a violation! Your manager will be notified.';
      return e.returnValue;
    };

    // Detect when page visibility changes (app minimized)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("⚠️ App minimized - monitoring continues in background");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <>
      {/* Internet Disconnection Alert */}
      {!isOnline && (
        <Alert className="mb-4 bg-red-50 border-2 border-red-500 animate-pulse">
          <WifiOff className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900 font-bold">
            🚨 INTERNET DISCONNECTED! Reconnect immediately or manager will be notified!
          </AlertDescription>
        </Alert>
      )}

      {/* Location Disabled Alert */}
      {!locationEnabled && locationError && (
        <Alert className="mb-4 bg-red-50 border-2 border-red-500 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900 font-bold">
            🚨 {locationError} This is a VIOLATION! Manager has been notified!
          </AlertDescription>
        </Alert>
      )}

      {/* Active Monitoring Indicator */}
      {isOnline && locationEnabled && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Live Tracking Active</span>
          </div>
        </div>
      )}
    </>
  );
}
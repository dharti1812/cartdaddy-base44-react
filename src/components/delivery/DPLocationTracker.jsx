import React, { useEffect, useState, useCallback } from 'react';
import { DeliveryPartner, Order } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MapPin, WifiOff } from "lucide-react";

/**
 * Delivery Partner Location Tracker
 * Tracks location every 30 seconds while on delivery
 * Updates both DeliveryPartner entity and Order entity
 */

export default function DPLocationTracker({ deliveryPartnerId, orderId }) {
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Track total distance traveled
  const [startLocation, setStartLocation] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const logViolation = useCallback(async (type) => {
    try {
      const partner = await DeliveryPartner.get(deliveryPartnerId);
      const violations = partner.violations || [];
      
      violations.push({
        type: type,
        timestamp: new Date().toISOString(),
        order_id: orderId,
        details: `Compliance violation: ${type}`
      });

      await DeliveryPartner.update(deliveryPartnerId, {
        violations: violations
      });
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  }, [deliveryPartnerId, orderId]);

  // Monitor internet connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("✅ Internet reconnected");
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log("❌ Internet disconnected - ALERT!");
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
    let lastLocation = null;

    const updateLocation = async (position) => {
      try {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading
        };

        // Calculate distance traveled
        if (lastLocation) {
          const distance = calculateDistance(
            lastLocation.lat,
            lastLocation.lng,
            coords.lat,
            coords.lng
          );
          setTotalDistance(prev => prev + distance);
        } else {
          setStartLocation(coords);
        }
        lastLocation = coords;

        // Update delivery partner's current location
        await DeliveryPartner.update(deliveryPartnerId, {
          current_location: {
            ...coords,
            updated_at: new Date().toISOString(),
            timestamp: Date.now()
          },
          location_tracking_enabled: true,
          availability_status: 'on_delivery'
        });

        // Also update order with delivery partner's location
        await Order.update(orderId, {
          'assigned_delivery_boy.current_location': coords,
          'assigned_delivery_boy.last_location_update': new Date().toISOString()
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

      // Mark location as disabled
      DeliveryPartner.update(deliveryPartnerId, {
        location_tracking_enabled: false
      });
    };

    // Continuous tracking
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Force update every 30 seconds
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
      }, 30000);
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

      // Save total distance when component unmounts (delivery completed)
      if (totalDistance > 0) {
        Order.update(orderId, {
          actual_distance_traveled: totalDistance
        });
      }
    };
  }, [deliveryPartnerId, orderId, logViolation, totalDistance]);

  // Prevent app from being closed
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '⚠️ Warning: Closing app during delivery is a violation! Your manager will be notified.';
      return e.returnValue;
    };

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
      {!isOnline && (
        <Alert className="mb-4 bg-red-50 border-2 border-red-500 animate-pulse">
          <WifiOff className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900 font-bold">
            🚨 INTERNET DISCONNECTED! Reconnect immediately or you'll be penalized!
          </AlertDescription>
        </Alert>
      )}

      {!locationEnabled && locationError && (
        <Alert className="mb-4 bg-red-50 border-2 border-red-500 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900 font-bold">
            🚨 {locationError} This is a VIOLATION! Retailer has been notified!
          </AlertDescription>
        </Alert>
      )}

      {isOnline && locationEnabled && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Live Tracking Active</span>
            {totalDistance > 0 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                {totalDistance.toFixed(2)} km
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
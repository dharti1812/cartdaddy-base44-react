import React, { useEffect, useState, useCallback } from "react";
import { Retailer } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MapPin, WifiOff } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "@/config";

export default function LocationTracker({
  deliveryBoyId,
  retailerId,
  retailerProfile,
}) {
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [coords, setCoords] = useState(null); 

  const logViolation = useCallback(
    async (type) => {
      try {
        const updatedDeliveryBoys = retailerProfile.delivery_boys.map((db) =>
          db.id === deliveryBoyId
            ? {
                ...db,
                violations: [
                  ...(db.violations || []),
                  {
                    type: type,
                    timestamp: new Date().toISOString(),
                    message: `Compliance violation: ${type}`,
                  },
                ],
              }
            : db
        );

        await Retailer.update(retailerId, {
          delivery_boys: updatedDeliveryBoys,
        });
      } catch (error) {
        console.error("Error logging violation:", error);
      }
    },
    [deliveryBoyId, retailerId, retailerProfile]
  );

  const updateLocationStatus = useCallback(
    async (enabled) => {
      try {
        const updatedDeliveryBoys = retailerProfile.delivery_boys.map((db) =>
          db.id === deliveryBoyId
            ? {
                ...db,
                location_tracking: {
                  ...db.location_tracking,
                  enabled: enabled,
                  last_update: new Date().toISOString(),
                },
              }
            : db
        );

        await Retailer.update(retailerId, {
          delivery_boys: updatedDeliveryBoys,
        });
      } catch (error) {
        console.error("Error updating location status:", error);
      }
    },
    [deliveryBoyId, retailerId, retailerProfile]
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      logViolation("internet_disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [logViolation]);

  useEffect(() => {
    let watchId;
    let updateInterval;

    const updateLocation = async (position) => {
      const newCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      setCoords(newCoords); 
      console.log("Location coords:", coords);
      try {
       
        await axios.post(
          `${API_BASE_URL}/api/delivery-partner/update-location`,
          {
            delivery_boy_id: deliveryBoyId,
            latitude: newCoords.lat,
            longitude: newCoords.lng,
          }
        );

        console.log("📍 Location sent:", newCoords);

        setLocationEnabled(true);
        setLocationError(null);
      } catch (err) {
        console.error("Error sending location:", err);
      }
    };

    const handleLocationError = (error) => {
      setLocationEnabled(false);
      let errorMessage = "Location access denied";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied!";
          logViolation("location_permission_denied");
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location unavailable. GPS may be off!";
          logViolation("location_unavailable");
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }
      setLocationError(errorMessage);
      updateLocationStatus(false);
    };

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      updateInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          updateLocation,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      }, 30000); 
    } else {
      setLocationError("GPS not supported on this device!");
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [
    deliveryBoyId,
    retailerId,
    retailerProfile,
    logViolation,
    updateLocationStatus,
  ]);

  return (
    <>
      {/* Internet alert */}
      {!isOnline && (
        <Alert className="mb-2 bg-red-50 border-2 border-red-500 animate-pulse">
          <WifiOff className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900 font-bold">
            🚨 INTERNET DISCONNECTED!
          </AlertDescription>
        </Alert>
      )}

      {/* Location alert */}
      {!locationEnabled && locationError && (
        <Alert className="mb-2 bg-red-50 border-2 border-red-500 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="text-red-900 font-bold">
            🚨 {locationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Debug box to show coordinates */}
      {/* {coords && (
        <div className="fixed bottom-4 right-4 bg-gray-100 border border-gray-400 p-3 rounded shadow-lg text-sm z-50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>
              Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
            </span>
          </div>
          <div>Accuracy: {coords.accuracy} meters</div>
          <div className="text-green-700 font-semibold">
            {isOnline && locationEnabled
              ? "✅ Tracking Active"
              : "⚠️ Issue Detected"}
          </div>
        </div>
      )} */}
    </>
  );
}

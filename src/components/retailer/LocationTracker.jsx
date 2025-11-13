import React, { useEffect, useState, useCallback } from "react";
import { MapPin, WifiOff } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "@/config";

export default function LocationTracker({ deliveryBoyId, orderId }) {
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);

  const fetchLocation = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/delivery-partner/track-order/${orderId}`
      );
      setTrackingData(res.data);
      console.log("Tracking Data  111:", res.data);
      setError(null);
    } catch (err) {
      setError("Unable to fetch live tracking data");
    }
  }, [orderId]);

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 10000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, [fetchLocation]);

  if (error) {
    return (
      <div className="bg-red-50 p-3 rounded-md flex items-center text-red-700 gap-2">
        <WifiOff className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-gray-50 p-3 rounded-md text-gray-700 flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <span>Loading delivery partner location...</span>
      </div>
    );
  }

  const { delivery_boy, destination } = trackingData;

  // Use customer as destination
  const destLat = destination?.customer?.latitude;
  const destLng = destination?.customer?.longitude;

  if (!destLat || !destLng) {
    return (
      <div className="text-red-600">Destination coordinates not available</div>
    );
  }

  const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${delivery_boy.latitude},${delivery_boy.longitude}&destination=${destLat},${destLng}`;

  return (
    <div className="p-3 bg-green-50 border-2 border-green-300 rounded-xl shadow-sm mt-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-green-700" />
        <p className="text-green-900 font-semibold">Live Tracking</p>
      </div>
      <p className="text-sm text-gray-700 mb-2">
        Last updated:{" "}
        {new Date(delivery_boy.last_updated || Date.now()).toLocaleTimeString()}
      </p>
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline text-sm hover:text-blue-800"
      >
        📍 View Live Route on Google Maps
      </a>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

export default function LiveTrackingMapAvailableOrders({
  orderId,
  deliveryBoyId,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null); // reference to HERE map object
  const [error, setError] = useState("");
  const [eta, setEta] = useState(null); // in minutes

  const deliveryMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current) return;

    const H = window.H; // HERE SDK loaded via script
    const platform = new H.service.Platform({ apikey: HERE_API_KEY });
    const defaultLayers = platform.createDefaultLayers();

    const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      center: { lat: 19.076, lng: 72.8777 }, // default center
      zoom: 12,
      pixelRatio: window.devicePixelRatio || 1,
    });

    // Enable interactions
    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    mapInstanceRef.current = { map, H, platform, behavior, ui };
  }, []);

  // Fetch tracking and update map every 10 seconds
  useEffect(() => {
    if (!orderId || !mapInstanceRef.current) return;

    const fetchAndUpdate = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/delivery-partner/track-order-delivery-boy/${deliveryBoyId}/${orderId}`
        );

        const data = res.data;
        const { delivery_boy, destination } = data;
        const customer = destination?.customer;

        if (!delivery_boy || !customer) {
          setError("Delivery boy or customer location not available");
          return;
        }
        setError("");

        const { H, map } = mapInstanceRef.current;

        // Remove old markers/route
        if (deliveryMarkerRef.current)
          map.removeObject(deliveryMarkerRef.current);
        if (customerMarkerRef.current)
          map.removeObject(customerMarkerRef.current);
        if (routeLineRef.current) map.removeObject(routeLineRef.current);

        // Add markers
        deliveryMarkerRef.current = new H.map.Marker({
          lat: delivery_boy.latitude,
          lng: delivery_boy.longitude,
        });
        map.addObject(deliveryMarkerRef.current);

        customerMarkerRef.current = new H.map.Marker({
          lat: customer.latitude,
          lng: customer.longitude,
        });
        map.addObject(customerMarkerRef.current);

        // Fetch route from HERE Routing API
        const routeRes = await axios.get(
          `https://router.hereapi.com/v8/routes?transportMode=car&origin=${delivery_boy.latitude},${delivery_boy.longitude}&destination=${customer.latitude},${customer.longitude}&return=polyline,summary&apikey=${HERE_API_KEY}`
        );

        const section = routeRes.data.routes[0].sections[0];

        // Draw route line
        const lineString = H.geo.LineString.fromFlexiblePolyline(
          section.polyline
        );
        routeLineRef.current = new H.map.Polyline(lineString, {
          style: { strokeColor: "blue", lineWidth: 5 },
        });
        map.addObject(routeLineRef.current);

        // Zoom map to fit route
        map.getViewModel().setLookAtData({
          bounds: routeLineRef.current.getBoundingBox(),
        });

        // Set ETA in minutes
        const travelTimeInSeconds = section.summary?.duration;
        if (travelTimeInSeconds) {
          setEta(Math.ceil(travelTimeInSeconds / 60));
        } else {
          setEta(null);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to fetch tracking data");
      }
    };

    // Fetch immediately
    fetchAndUpdate();

    // Refresh every 10 seconds
    const interval = setInterval(fetchAndUpdate, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="mt-3">
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {eta && (
        <div className="text-sm text-gray-700 mb-2">
          ⏱ Estimated Time to Customer: <strong>{eta} min</strong>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px" }}
        className="rounded-lg border border-gray-300"
      ></div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;



/* ---------- Smooth Marker Animation ---------- */
const animateMarker = (marker, from, to, map) => {
  const frames = 60;
  let count = 0;

  const deltaLat = (to.lat - from.lat) / frames;
  const deltaLng = (to.lng - from.lng) / frames;

  const interval = setInterval(() => {
    count++;

    const newPos = {
      lat: from.lat + deltaLat * count,
      lng: from.lng + deltaLng * count,
    };

    marker.setPosition(newPos);

    if (count === frames) clearInterval(interval);
  }, 16); // ~60 FPS
};

const isOffRoute = (currentPosition, routePath) => {
  if (!routePath || routePath.length === 0) return false;

  const toleranceInMeters = 50; // 🔥 allowed deviation (50m)

  return !window.google.maps.geometry.poly.isLocationOnEdge(
    new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
    routePath,
    toleranceInMeters / 100000, // meters → degrees
  );
};

export default function LiveTrackingMap({ orderId }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const routePolylineRef = useRef(null);
const emergencyTriggeredRef = useRef(false);

  const [eta, setEta] = useState(null);
  const [error, setError] = useState("");

  /* ---------- Initialize Google Map ---------- */
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 19.076, lng: 72.8777 },
      zoom: 15,
      zoomControl: true,
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: false,
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#2563eb",
        strokeWeight: 5,
      },
    });

    directionsRendererRef.current.setMap(map);
    mapInstanceRef.current = map;
    console.log("Map initialized");
  }, []);

  /* ---------- Fetch & Update Tracking ---------- */
  useEffect(() => {
    if (!orderId || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const directionsService = new window.google.maps.DirectionsService();

    const distanceThreshold = 0.00005; // ~5 meters

    const fetchAndUpdate = async () => {
          try {
          const res = await fetch(
      `${API_BASE_URL}/api/delivery-partner/track-order/${orderId}`
    );

        const data = await res.json();

        const { delivery_boy, destination } = data;
        const customer = destination?.customer;

        if (!delivery_boy || !customer) {
          setError("Location data not available");
          console.log("No delivery boy or customer data");
          return;
        }
        setError("");

        const deliveryLatLng = {
          lat: Number(delivery_boy.latitude),
          lng: Number(delivery_boy.longitude),
        };

        const customerLatLng = {
          lat: Number(customer.latitude),
          lng: Number(customer.longitude),
        };

        if (routePolylineRef.current && !emergencyTriggeredRef.current) {
          const deviated = isOffRoute(deliveryLatLng, routePolylineRef.current);

          if (deviated) {
            emergencyTriggeredRef.current = true;

            console.warn("🚨 DELIVERY BOY OFF ROUTE");

            await axios.post(`${API_BASE_URL}/api/emergency/route-deviation`, {
              order_id: orderId,
              latitude: deliveryLatLng.lat,
              longitude: deliveryLatLng.lng,
              type: "ROUTE_DEVIATION",
            });
          }
        }

        console.log(
          "GPS:",
          "Delivery Boy:",
          deliveryLatLng,
          "Customer:",
          customerLatLng,
          "Time:",
          new Date().toLocaleTimeString(),
        );

        /* ---------- Delivery Boy Marker ---------- */
        if (!deliveryMarkerRef.current) {
          deliveryMarkerRef.current = new window.google.maps.Marker({
            map,
            position: deliveryLatLng,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#fff",
            },
          });
          map.panTo(deliveryLatLng);
          console.log("Marker initialized and map panned");
        } else {
          const prevPos = deliveryMarkerRef.current.getPosition();
          const hasMoved =
            Math.abs(prevPos.lat() - deliveryLatLng.lat) > distanceThreshold ||
            Math.abs(prevPos.lng() - deliveryLatLng.lng) > distanceThreshold;

          if (hasMoved) {
            console.log("Delivery boy moved, animating marker");
            animateMarker(
              deliveryMarkerRef.current,
              { lat: prevPos.lat(), lng: prevPos.lng() },
              deliveryLatLng,
              map,
            );
            map.panTo(deliveryLatLng);
          } else {
            console.log("Delivery boy has NOT moved, no marker update");
          }
        }

        /* ---------- Customer Marker ---------- */
        if (!customerMarkerRef.current) {
          customerMarkerRef.current = new window.google.maps.Marker({
            map,
            position: customerLatLng,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#dc2626",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#fff",
            },
          });
        }

        /* ---------- Route & ETA ---------- */
        directionsService.route(
          {
            origin: deliveryLatLng,
            destination: customerLatLng,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK") {
              directionsRendererRef.current.setDirections(result);
              routePolylineRef.current = result.routes[0].overview_path;
              const duration = result.routes[0].legs[0].duration?.value;
              if (duration) {
                setEta(Math.ceil(duration / 60));
              }
            }
          },
        );
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError("Unable to fetch tracking data");
      }
    };

    fetchAndUpdate();
    const interval = setInterval(fetchAndUpdate, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="mt-3">
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {eta && (
        <p className="text-sm text-gray-700 mb-2">
          ⏱ Estimated Time to Customer: <strong>{eta} min</strong>
        </p>
      )}

      <div
        ref={mapRef}
        className="rounded-lg border border-gray-300"
        style={{ width: "100%", height: "400px" }}
      />
    </div>
  );
}

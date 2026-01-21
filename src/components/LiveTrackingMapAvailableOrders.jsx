import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";

export default function LiveTrackingMapAvailableOrders({
  orderId,
  deliveryBoyId,
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
}) {
  const mapRef = useRef(null);
  const mapRefInstance = useRef(null);

  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);

  const directionsServiceRef = useRef(null);
  const directionsRendererToShopRef = useRef(null);
  const directionsRendererToCustomerRef = useRef(null);

  const [eta, setEta] = useState(null);
  const [reachedPickup, setReachedPickup] = useState(false);

  const MOVE_THRESHOLD = 15; // meters
  const PICKUP_RADIUS = 60; // meters

  // ---------- Distance calculation ----------
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ---------- Animate marker ----------
  const animateMarker = (marker, from, to) => {
    const frames = 60;
    let i = 0;
    const dLat = (to.lat - from.lat) / frames;
    const dLng = (to.lng - from.lng) / frames;

    const interval = setInterval(() => {
      i++;
      marker.setPosition({ lat: from.lat + dLat * i, lng: from.lng + dLng * i });
      if (i === frames) clearInterval(interval);
    }, 16);
  };

  // ---------- Initialize map ----------
  useEffect(() => {
    if (!mapRef.current || mapRefInstance.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: Number(pickupLat), lng: Number(pickupLng) },
      zoom: 15,
      zoomControl: true,
      fullscreenControl: true,
      streetViewControl: false,
      mapTypeControl: false,
    });

    directionsServiceRef.current = new window.google.maps.DirectionsService();

    // Directions Renderer for Delivery Boy -> Shop
    directionsRendererToShopRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#0066FF", strokeWeight: 4 }, // orange
    });
    directionsRendererToShopRef.current.setMap(map);

    // Directions Renderer for Shop -> Customer
    directionsRendererToCustomerRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: { strokeColor: "#0066FF", strokeWeight: 4 }, // blue
    });
    directionsRendererToCustomerRef.current.setMap(map);

    mapRefInstance.current = map;

    // Pickup marker (Shop)
    pickupMarkerRef.current = new window.google.maps.Marker({
      position: { lat: Number(pickupLat), lng: Number(pickupLng) },
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
      title: "Shop",
    });

    // Drop marker (Customer)
    dropMarkerRef.current = new window.google.maps.Marker({
      position: { lat: Number(dropLat), lng: Number(dropLng) },
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      title: "Customer",
    });

    console.log("🗺️ Map initialized");
  }, []);

  // ---------- Live Tracking ----------
  useEffect(() => {
    if (!orderId || !mapRefInstance.current) return;
    const map = mapRefInstance.current;

    const fetchTracking = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/delivery-partner/track-order-delivery-boy/${deliveryBoyId}/${orderId}`
        );
        const d = res.data.delivery_boy;
        if (!d) return;

        const lat = Number(d.latitude);
        const lng = Number(d.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const currentPos = { lat, lng };
        console.log("📍 Delivery Boy:", lat, lng);

        // ---------- Animate delivery boy marker ----------
        if (!deliveryMarkerRef.current) {
          deliveryMarkerRef.current = new window.google.maps.Marker({
            position: currentPos,
            map,
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            title: "Delivery Boy",
          });
          map.setCenter(currentPos);
        } else {
          const prev = deliveryMarkerRef.current.getPosition();
          const movedDist = getDistance(prev.lat(), prev.lng(), lat, lng);
          if (movedDist >= MOVE_THRESHOLD) {
            animateMarker(deliveryMarkerRef.current, { lat: prev.lat(), lng: prev.lng() }, currentPos);
            map.panTo(currentPos);
          }
        }

        // ---------- Check if pickup reached ----------
        const distToPickup = getDistance(lat, lng, Number(pickupLat), Number(pickupLng));
        if (distToPickup <= PICKUP_RADIUS && !reachedPickup) {
          console.log("✅ Pickup reached");
          setReachedPickup(true);
        }

        // ---------- Route Delivery Boy -> Shop ----------
        directionsServiceRef.current.route(
          {
            origin: currentPos,
            destination: { lat: Number(pickupLat), lng: Number(pickupLng) },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK") directionsRendererToShopRef.current.setDirections(result);
          }
        );

        // ---------- Route Shop -> Customer (show only after pickup) ----------
        if (reachedPickup) {
          directionsServiceRef.current.route(
            {
              origin: { lat: Number(pickupLat), lng: Number(pickupLng) },
              destination: { lat: Number(dropLat), lng: Number(dropLng) },
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK") {
                directionsRendererToCustomerRef.current.setDirections(result);
                const sec = result.routes[0].legs[0].duration?.value;
                if (sec) setEta(Math.ceil(sec / 60));
              }
            }
          );
        }
      } catch (err) {
        console.error("Error fetching tracking:", err);
      }
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 7000);
    return () => clearInterval(interval);
  }, [orderId, reachedPickup]);

  return (
    <div className="mt-3">
      {eta && (
        <div className="text-sm mb-2 text-gray-700">
          ⏱ ETA: <b>{eta} min</b>
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: "380px" }} className="rounded-xl border" />
    </div>
  );
}

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
  const mapInstanceRef = useRef(null);

  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);

  const directionsRendererRef = useRef(null);

  const [eta, setEta] = useState(null);
  const [reachedShop, setReachedShop] = useState(false);

  const distanceThreshold = 5; // meters

  // ---------- Calculate distance between two points ----------
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ---------- Animate Marker ----------
  const animateMarker = (marker, from, to) => {
    const frames = 60;
    let count = 0;

    const deltaLat = (to.lat - from.lat) / frames;
    const deltaLng = (to.lng - from.lng) / frames;

    const interval = setInterval(() => {
      count++;
      marker.setPosition({
        lat: from.lat + deltaLat * count,
        lng: from.lng + deltaLng * count,
      });
      if (count === frames) clearInterval(interval);
    }, 16); // ~60 FPS
  };

  // ---------- Initialize Map ----------
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: pickupLat, lng: pickupLng },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#0066FF",
        strokeWeight: 5,
      },
    });

    directionsRendererRef.current.setMap(map);
    mapInstanceRef.current = map;

    // Pickup Marker
    pickupMarkerRef.current = new window.google.maps.Marker({
      position: { lat: pickupLat, lng: pickupLng },
      map,
      title: "Pickup",
      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    });

    // Drop Marker
    dropMarkerRef.current = new window.google.maps.Marker({
      position: { lat: dropLat, lng: dropLng },
      map,
      title: "Drop",
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    });

    console.log("Google Map initialized");
  }, []);

  // ---------- Live Tracking ----------
  useEffect(() => {
    if (!orderId || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const directionsService = new window.google.maps.DirectionsService();

    let lastLat = null;
    let lastLng = null;

    const fetchTracking = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/delivery-partner/track-order-delivery-boy/${deliveryBoyId}/${orderId}`
        );
        const d = res.data.delivery_boy;
        if (!d) return;

        console.log(
          "Delivery Boy coords:",
          d.latitude,
          d.longitude,
          "Time:",
          new Date().toLocaleTimeString()
        );

        const moved =
          lastLat === null ||
          lastLng === null ||
          getDistance(d.latitude, d.longitude, lastLat, lastLng) > distanceThreshold;

        if (!moved) {
          console.log("Delivery boy has NOT moved, skipping update");
          return;
        }

        lastLat = d.latitude;
        lastLng = d.longitude;

        const deliveryLatLng = { lat: d.latitude, lng: d.longitude };
        const destLatLng = reachedShop
          ? { lat: dropLat, lng: dropLng }
          : { lat: pickupLat, lng: pickupLng };

        // Check if reached pickup
        const distToPickup = getDistance(d.latitude, d.longitude, pickupLat, pickupLng);
        if (distToPickup < 60 && !reachedShop) setReachedShop(true);

        // Add or update delivery boy marker
        if (!deliveryMarkerRef.current) {
          deliveryMarkerRef.current = new window.google.maps.Marker({
            position: deliveryLatLng,
            map,
            title: "Delivery Boy",
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });
          map.panTo(deliveryLatLng);
        } else {
          const prev = deliveryMarkerRef.current.getPosition();
          animateMarker(deliveryMarkerRef.current, { lat: prev.lat(), lng: prev.lng() }, deliveryLatLng);
          map.panTo(deliveryLatLng);
        }

        // Directions & ETA
        directionsService.route(
          {
            origin: deliveryLatLng,
            destination: destLatLng,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK") {
              directionsRendererRef.current.setDirections(result);
              const duration = result.routes[0].legs[0].duration?.value;
              if (duration) setEta(Math.ceil(duration / 60));
            }
          }
        );
      } catch (err) {
        console.error("Error fetching tracking:", err);
      }
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 7000);
    return () => clearInterval(interval);
  }, [orderId, reachedShop]);

  return (
    <div className="mt-3">
      {eta && (
        <div className="text-sm mb-2 text-gray-700">
          ⏱ ETA: <b>{eta} min</b>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "380px" }}
        className="rounded-xl border"
      />
    </div>
  );
}

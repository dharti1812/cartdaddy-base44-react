import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";

const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;

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

  const staticRouteRef = useRef(null);
  const liveRouteRef = useRef(null);

  const [eta, setEta] = useState(null);
  const [reachedShop, setReachedShop] = useState(false);

  // -----------------------------
  // Distance Calculation
  // -----------------------------
  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
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

  // -----------------------------
  // SVG ICONS
  // -----------------------------
  const pickupIcon = `
    <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="13" fill="#28a745" stroke="white" stroke-width="3"/>
    </svg>
  `;

  const dropIcon = `
    <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="13" fill="#dc3545" stroke="white" stroke-width="3"/>
    </svg>
  `;

  const riderIcon = `
    <svg width="38" height="38" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#007bff" stroke="white" stroke-width="4"/>
      <path d="M20 40 L28 24 H36 L44 40 Z" fill="white"/>
      <circle cx="26" cy="44" r="4" fill="white"/>
      <circle cx="38" cy="44" r="4" fill="white"/>
    </svg>
  `;

  // -----------------------------
  // Reverse Geocode Helper
  // -----------------------------
 let lastReverseCall = 0;

const reverseGeocode = async (lat, lng) => {
  const now = Date.now();
  if (now - lastReverseCall < 5000) return "";
  lastReverseCall = now;

  try {
    const url = `https://geocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=en-US&apiKey=${HERE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.items?.length) return data.items[0].address.label;
    return "Address not found";
  } catch {
    return "Address not found";
  }
};



   const attachAddressBubble = () => {};

  // -----------------------------
  // Map Setup
  // -----------------------------
  useEffect(() => {
    if (!mapRef.current) return;

    const H = window.H;
    const platform = new H.service.Platform({ apikey: HERE_API_KEY });
    const defaultLayers = platform.createDefaultLayers();

    const map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      center: { lat: pickupLat, lng: pickupLng },
      zoom: 13,
    });

    new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    mapInstanceRef.current = { H, map, platform, ui };
    return () => map.dispose();
  }, []);

  // -----------------------------
  // Static Route + Pickup / Drop Markers
  // -----------------------------
  useEffect(() => {
    if (!mapInstanceRef.current || staticRouteRef.current) return;
    const { H, map } = mapInstanceRef.current;

    const pickupSvg = new H.map.Icon(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pickupIcon)}`
    );
    const dropSvg = new H.map.Icon(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(dropIcon)}`
    );

    axios
      .get(
        `https://router.hereapi.com/v8/routes?transportMode=car&origin=${pickupLat},${pickupLng}&destination=${dropLat},${dropLng}&return=polyline&apikey=${HERE_API_KEY}`
      )
      .then(async (res) => {
        const poly = res.data.routes[0].sections[0].polyline;
        const line = H.geo.LineString.fromFlexiblePolyline(poly);

        staticRouteRef.current = new H.map.Polyline(line, {
          style: { strokeColor: "#7E7E7E", lineWidth: 4 },
        });

        map.addObject(staticRouteRef.current);

        // Pickup marker
        pickupMarkerRef.current = new H.map.Marker(
          { lat: pickupLat, lng: pickupLng },
          { icon: pickupSvg }
        );
        map.addObject(pickupMarkerRef.current);
        attachAddressBubble(pickupMarkerRef.current);

        // Drop marker
        dropMarkerRef.current = new H.map.Marker(
          { lat: dropLat, lng: dropLng },
          { icon: dropSvg }
        );
        map.addObject(dropMarkerRef.current);
        attachAddressBubble(dropMarkerRef.current);
      });
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  // -----------------------------
  // Live Tracking + Navigation
  // -----------------------------
  useEffect(() => {
    if (!orderId || !mapInstanceRef.current) return;

    const fetchTracking = async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/delivery-partner/track-order/${deliveryBoyId}/${orderId}`
      );

      const d = res.data.delivery_boy;
      if (!d) return;

      const { H, map } = mapInstanceRef.current;

      if (deliveryMarkerRef.current) map.removeObject(deliveryMarkerRef.current);
      if (liveRouteRef.current) map.removeObject(liveRouteRef.current);

      const riderSvg = new H.map.Icon(
        `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(riderIcon)}`
      );

      deliveryMarkerRef.current = new H.map.Marker(
        { lat: d.latitude, lng: d.longitude },
        { icon: riderSvg }
      );
      map.addObject(deliveryMarkerRef.current);
      attachAddressBubble(deliveryMarkerRef.current);

      const distance = getDistance(d.latitude, d.longitude, pickupLat, pickupLng);
      if (distance < 60 && !reachedShop) setReachedShop(true);

      const destLat = reachedShop ? dropLat : pickupLat;
      const destLng = reachedShop ? dropLng : pickupLng;

      const routeRes = await axios.get(
        `https://router.hereapi.com/v8/routes?transportMode=car&origin=${d.latitude},${d.longitude}&destination=${destLat},${destLng}&return=polyline,summary&apikey=${HERE_API_KEY}`
      );

      const poly = routeRes.data.routes[0].sections[0].polyline;
      const line = H.geo.LineString.fromFlexiblePolyline(poly);

      liveRouteRef.current = new H.map.Polyline(line, {
        style: { strokeColor: "#0066FF", lineWidth: 5 },
      });
      map.addObject(liveRouteRef.current);

      map.getViewModel().setLookAtData({
        bounds: liveRouteRef.current.getBoundingBox(),
      });

      const sec = routeRes.data.routes[0].sections[0].summary.duration;
      setEta(Math.ceil(sec / 60));
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

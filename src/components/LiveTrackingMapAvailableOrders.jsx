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
  const deliveryMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const staticRouteRef = useRef(null);
  const liveRouteRef = useRef(null);

  const [eta, setEta] = useState(null);
  const [reachedShop, setReachedShop] = useState(false);

  const getDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Setup map
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

  // Static route + markers (Pickup + Drop)
useEffect(() => {
  if (!mapInstanceRef.current || staticRouteRef.current) return;
  const { H, map } = mapInstanceRef.current;

  axios
    .get(
      `https://router.hereapi.com/v8/routes?transportMode=car&origin=${pickupLat},${pickupLng}&destination=${dropLat},${dropLng}&return=polyline&apikey=${HERE_API_KEY}`
    )
    .then(res => {
      const poly = res.data.routes[0].sections[0].polyline;
      const line = H.geo.LineString.fromFlexiblePolyline(poly);
      staticRouteRef.current = new H.map.Polyline(line, {
        style: { strokeColor: "#7E7E7E", lineWidth: 4 },
      });

      map.addObject(staticRouteRef.current);

      pickupMarkerRef.current = new H.map.Marker({ lat: pickupLat, lng: pickupLng });
      dropMarkerRef.current = new H.map.Marker({ lat: dropLat, lng: dropLng });
      map.addObjects([pickupMarkerRef.current, dropMarkerRef.current]);
    });
}, [pickupLat, pickupLng, dropLat, dropLng]);


  // Live Tracking Flow
  useEffect(() => {
    if (!orderId || !mapInstanceRef.current) return;

    const fetchTracking = async () => {
      const res = await axios.get(
        `${API_BASE_URL}/api/delivery-partner/track-order-delivery-boy/${deliveryBoyId}/${orderId}`
      );
      const d = res.data.delivery_boy;
      if (!d) return;

      const { H, map } = mapInstanceRef.current;

      if (deliveryMarkerRef.current) map.removeObject(deliveryMarkerRef.current);
      if (liveRouteRef.current) map.removeObject(liveRouteRef.current);

      deliveryMarkerRef.current = new H.map.Marker({ lat: d.latitude, lng: d.longitude });
      map.addObject(deliveryMarkerRef.current);

      const distance = getDistance(d.latitude, d.longitude, pickupLat, pickupLng);

      // If delivery boy reached shop (< 60 meters) set state
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

      map.getViewModel().setLookAtData({ bounds: liveRouteRef.current.getBoundingBox() });

      const sec = routeRes.data.routes[0].sections[0].summary.duration;
      setEta(Math.ceil(sec / 60));
    };

    fetchTracking();
    const interval = setInterval(fetchTracking, 8000);
    return () => clearInterval(interval);
  }, [orderId, reachedShop]);

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

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TrackOrderMap({ deliveryBoyId }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/delivery-partner/location/${deliveryBoyId}`
        );
        setCoords({ lat: res.data.latitude, lng: res.data.longitude });
      } catch (err) {
        console.error(err);
      }
    };

    fetchLocation(); 
    const interval = setInterval(fetchLocation, 5000);
    return () => clearInterval(interval);
  }, [deliveryBoyId]);

  useEffect(() => {
    if (!coords) return;
    const H = window.H;
    const platform = new H.service.Platform({
      apikey: import.meta.env.VITE_HERE_API_KEY,
    });
    const defaultLayers = platform.createDefaultLayers();
    const map = new H.Map(
      document.getElementById("mapContainer"),
      defaultLayers.vector.normal.map,
      {
        zoom: 15,
        center: coords,
      }
    );

    const marker = new H.map.Marker(coords);
    map.addObject(marker);

    return () => map.dispose();
  }, [coords]);

  return <div id="mapContainer" style={{ width: "100%", height: "500px" }} />;
}

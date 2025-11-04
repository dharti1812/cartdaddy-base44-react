import React, { useEffect, useState } from "react";

export default function AddressAutocompleteInput({ label, value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [service, setService] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setService(new window.google.maps.places.AutocompleteService());
      setMap(new window.google.maps.Map(document.createElement("div")));
      return;
    }
   
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (!service || !val) {
      setSuggestions([]);
      return;
    }

    service.getPlacePredictions({ input: val }, (predictions, status) => {
      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        predictions
      ) {
        setSuggestions(predictions);
      } else {
        setSuggestions([]);
      }
    });
  };

  const selectPlace = (placeId, description) => {
    const placesService = new window.google.maps.places.PlacesService(map);
    placesService.getDetails(
      {
        placeId,
        fields: ["address_components", "formatted_address", "geometry"],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setQuery(place.formatted_address);
          setSuggestions([]);

          let city = "";
          let pincode = "";
          const lat = place.geometry?.location?.lat() || 0;
          const lng = place.geometry?.location?.lng() || 0;

          place.address_components.forEach((comp) => {
            if (comp.types.includes("locality")) city = comp.long_name;
            if (comp.types.includes("postal_code")) pincode = comp.long_name;
          });

          onSelect({
            street: place.formatted_address,
            city,
            pincode,
            lat,
            lng,
          });
        }
      }
    );
  };

  return (
    <div className="relative">
      <label className="block font-medium mb-1">{label}</label>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder="Type an address..."
        className="w-full border rounded-lg p-2"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-50 bg-white border rounded-lg mt-1 shadow max-h-48 overflow-y-auto w-full">
          {suggestions.map((sug) => (
            <li
              key={sug.place_id}
              onClick={() => selectPlace(sug.place_id, sug.description)}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {sug.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

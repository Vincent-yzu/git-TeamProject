import React, { useState } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useMapContext } from "./MapContext"; // 引入 Context

export const DisplayMap = () => {
  const { selectedPlace } = useMapContext(); // 從 Context 中取用 `selectedPlace`
  const [defaultCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // 預設中心位置

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY!,
  });

  const mapContainerStyle = {
    width: "100%",
    height: "100%",
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={10}
      center={
        selectedPlace
          ? {
              lat: selectedPlace.geometry.location.lat,
              lng: selectedPlace.geometry.location.lng,
            }
          : defaultCenter
      }
    >
      {selectedPlace && (
        <Marker
          position={{
            lat: selectedPlace.geometry.location.lat,
            lng: selectedPlace.geometry.location.lng,
          }}
        />
      )}
    </GoogleMap>
  );
};

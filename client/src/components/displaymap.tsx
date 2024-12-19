import React, { useState } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useMapContext } from "./MapContext"; // 引入 Context

export const DisplayMap = () => {
  const { selectedPlace } = useMapContext(); // 從 Context 中取用 `selectedPlace`
  const { zoomLevel } = useMapContext(); // 從 Context 中取用 `selectedPlace`
  const [defaultCenter] = useState({ lat: 35.6803, lng: 139.7638 }); // 預設中心位置

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
      zoom={zoomLevel}
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

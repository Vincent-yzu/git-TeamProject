import React, { useState, useEffect, useRef } from "react";
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api";
import { useMapContext } from "./MapContext"; // Your custom Context hook

export const DisplayMap = () => {
  const { selectedPlace, setSelectedPlace } = useMapContext(); // from Context
  const { zoomLevel, setZoomLevel } = useMapContext();         // from Context
  const { currentActivities } = useMapContext();               // from Context

  // Google Maps loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY!, // your API key
  });

  // Default map center
  const [defaultCenter] = useState({ lat: 35.6803, lng: 139.7638 });

  // Styles & options
  const mapContainerStyle = { width: "100%", height: "90%" };
  const mapOptions: google.maps.MapOptions = {
    gestureHandling: "greedy",
  };

  // State & Refs
  const [activityLocations, setActivityLocations] = useState<any[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);

  // ------------------------------------------
  // 1. Update activity locations & create markers
  // ------------------------------------------
  useEffect(() => {
    // Only proceed if the Maps script is loaded
    if (!isLoaded || !window.google) return;

    if (currentActivities && currentActivities.length > 0) {
      const locations = currentActivities.map((activity) => ({
        lat: activity.latitude,
        lng: activity.longitude,
      }));
      setActivityLocations(locations);
      updateMarkersOnMap();
    }
  }, [currentActivities, isLoaded]);

  // ------------------------------------------
  // 2. Pan/zoom to selected place & create a blue marker if not in activities
  // ------------------------------------------
  useEffect(() => {
    // Only proceed if the Maps script is loaded
    if (!isLoaded || !window.google) return;

    if (selectedPlace && mapRef.current) {
      const newCenter = {
        lat: selectedPlace.geometry.location.lat,
        lng: selectedPlace.geometry.location.lng,
      };

      mapRef.current.panTo(newCenter);
      mapRef.current.setZoom(zoomLevel);

      // Remove old selected marker if it exists
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
      }

      // Check if this place is already in `currentActivities`
      const placeExists =
        Array.isArray(currentActivities) &&
        currentActivities.some((activity) => activity.name === selectedPlace.name);

      if (!placeExists) {
        // Create a blue icon marker
        selectedMarkerRef.current = new window.google.maps.Marker({
          position: newCenter,
          map: mapRef.current,
          title: selectedPlace.name,
          icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });

        // InfoWindow
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${selectedPlace.name}</strong><br>${selectedPlace.formatted_address}</div>`,
        });

        // Show InfoWindow on marker click
        selectedMarkerRef.current.addListener("click", () => {
          infoWindow.open({
            anchor: selectedMarkerRef.current,
            map: mapRef.current,
            shouldFocus: false,
          });
        });
      }
    }
  }, [selectedPlace, zoomLevel, currentActivities, isLoaded]);

  // ------------------------------------------
  // 3. Manually create markers for each activity
  // ------------------------------------------
  const updateMarkersOnMap = () => {
    // Only proceed if the Maps script is loaded
    if (!isLoaded || !window.google) return;

    // Clear old markers
    markerRefs.current.forEach((marker) => {
      window.google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });
    markerRefs.current = [];

    // Create new markers for each activity
    currentActivities.forEach((activity, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: activity.latitude, lng: activity.longitude },
        map: mapRef.current,
        title: activity.name,
        label: (index + 1).toString(), // Show sequence (1-based)
      });

      // On marker click
      marker.addListener("click", () => handleClickIcon(activity));

      // Store the marker reference
      markerRefs.current.push(marker);
    });
  };

  // Click handler for an activity’s marker
  const handleClickIcon = (activity: any) => {
    const place = {
      id: 0,
      place_id: activity.id,
      name: activity.name,
      formatted_address: activity.location,
      description: activity.description,
      geometry: {
        location: {
          lat: activity.latitude,
          lng: activity.longitude,
        },
      },
      icon: activity.photoUrls[0],
      note: activity.note,
      recommendDuration: 20241225,
      commutingTime: 20241225,
    };
    setSelectedPlace(place);
    setZoomLevel(15); // Zoom in a bit
  };

  // ------------------------------------------
  // 4. Fit bounds & draw polyline for all activities
  // ------------------------------------------
  useEffect(() => {
    // Only proceed if the Maps script is loaded
    if (!isLoaded || !window.google) return;

    if (activityLocations.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();

      activityLocations.forEach((location) => {
        bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
      });

      // Fit map to show all markers
      mapRef.current.fitBounds(bounds);

      // Draw polyline if more than one location
      if (activityLocations.length > 1) {
        // Remove the old polyline if exists
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        const newPolyline = new window.google.maps.Polyline({
          path: activityLocations,
          geodesic: true,
          strokeColor: "rgb(248, 139, 49)",
          strokeOpacity: 0.5,
          strokeWeight: 10,
        });

        newPolyline.setMap(mapRef.current);
        polylineRef.current = newPolyline;
      }
    }
  }, [activityLocations, isLoaded]);

  // ------------------------------------------
  // 5. Store the map instance on load
  // ------------------------------------------
  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // ------------------------------------------
  // Render
  // ------------------------------------------
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}      // Provide a default center
      options={mapOptions}
      onLoad={onMapLoad}          // Capture the map instance
    />
  );
};

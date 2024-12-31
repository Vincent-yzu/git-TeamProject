import React, { useState, useEffect, useRef } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import { useMapContext } from "./MapContext"; // 引入 Context

export const DisplayMap = () => {
  const { selectedPlace, setSelectedPlace } = useMapContext(); // 從 Context 中取用 `selectedPlace`
  const { zoomLevel, setZoomLevel } = useMapContext(); // 從 Context 中取用 `zoomLevel`
  const { currentActivities } = useMapContext(); // 從 Context 中取用 `currentActivities`
  const [defaultCenter] = useState({ lat: 35.6803, lng: 139.7638 }); // 預設中心位置

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY!,
  });

  const mapContainerStyle = {
    width: "100%",
    height: "90%",
  };

  const mapOptions = {
    gestureHandling: "greedy", // 允許直接捲動放大縮小
  };

  const [activityLocations, setActivityLocations] = useState<any[]>([]); // 儲存活動的經緯度
  const mapRef = useRef<google.maps.Map | null>(null); // 用來儲存地圖實例
  const markerRefs = useRef<google.maps.Marker[]>([]); // 用來儲存所有標記
  const polylineRef = useRef<google.maps.Polyline | null>(null); // 用來儲存 Polyline 實例

  // 更新活動的地點列表
  useEffect(() => {
    if (currentActivities && currentActivities.length > 0) {
      const locations = currentActivities.map((activity) => ({
        lat: activity.latitude,
        lng: activity.longitude,
      }));
      setActivityLocations(locations);
      updateMarkersOnMap();
    }
  }, [currentActivities]);

  // 更新地圖上的圖標
  const updateMarkersOnMap = () => {
    // 清除所有舊的標記
    markerRefs.current.forEach((marker) => {
      google.maps.event.clearInstanceListeners(marker); // 移除事件監聽器
      marker.setMap(null); // 移除標記
    });
    markerRefs.current = [];

    // 為每個活動新增新的標記
    currentActivities.forEach((activity, index) => {
      const marker = new google.maps.Marker({
        position: {
          lat: activity.latitude,
          lng: activity.longitude,
        },
        map: mapRef.current,
        title: activity.name,
        label: (index + 1).toString(), // 使用順序作為標籤
      });

      // 綁定點擊事件
      marker.addListener("click", () => handleClickIcon(activity));
      markerRefs.current.push(marker); // 儲存新標記
    });
  };

  // 處理點擊圖標的事件
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
    setZoomLevel(15); // 適當調整地圖縮放層級
  };

  // 更新地圖的範圍和繪製折線
  useEffect(() => {
    if (activityLocations.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();

      activityLocations.forEach((location) => {
        bounds.extend(new google.maps.LatLng(location.lat, location.lng));
      });

      mapRef.current.fitBounds(bounds); // 調整地圖範圍

      if (activityLocations.length > 1) {
        if (polylineRef.current) {
          polylineRef.current.setMap(null); // 移除舊的 Polyline
        }

        const newPolyline = new google.maps.Polyline({
          path: activityLocations,
          geodesic: true,
          strokeColor: "rgb(248, 139, 49)",
          strokeOpacity: 0.5,
          strokeWeight: 10,
        });
        newPolyline.setMap(mapRef.current);
        polylineRef.current = newPolyline; // 更新 Polyline 實例
      }
    }
  }, [activityLocations]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map; // 存儲地圖實例
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      options={mapOptions}
      onLoad={onMapLoad} // 獲取地圖實例
    >
      {/* 顯示所有的標記，並標註順序 */}
      {currentActivities &&
        currentActivities.map((activity, index) => (
          <Marker
            key={activity.id}
            position={{
              lat: activity.latitude,
              lng: activity.longitude,
            }}
            title={activity.name}
            label={(index + 1).toString()} // 顯示順序，從 1 開始
            onClick={() => handleClickIcon(activity)}
          />
        ))}
    </GoogleMap>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { useJsApiLoader, GoogleMap, Marker, Polyline } from "@react-google-maps/api";
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

  // 用來儲存所有活動的經緯度
  const [activityLocations, setActivityLocations] = useState<any[]>([]);

  const polylineRef = useRef<google.maps.Polyline | null>(null); // 用來儲存 Polyline 實例
  const mapRef = useRef<google.maps.Map | null>(null); // 用來儲存地圖實例
  const markerRef = useRef<google.maps.Marker | null>(null); // 用來儲存 selectedPlace 的 Marker 實例
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null); // 用來儲存 InfoWindow 實例

  // 顯示目前全景點
  useEffect(() => {
    if (currentActivities) {
      const locations = currentActivities.map((activity) => ({
        lat: activity.latitude,
        lng: activity.longitude,
      }));
      setActivityLocations(locations);
    }
  }, [currentActivities]);

  // 地圖移到特定景點
  useEffect(() => {
    if (selectedPlace && mapRef.current) {
      const newCenter = {
        lat: selectedPlace.geometry.location.lat,
        lng: selectedPlace.geometry.location.lng,
      };
      
      // 設定地圖的新中心
      mapRef.current.panTo(newCenter); // 移動地圖到選中的位置
      mapRef.current.setZoom(zoomLevel); // 設定縮放級別

      // 如果已經有標記，移除舊標記
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // 檢查 currentActivities 是否存在，且是有效的陣列
      const placeExists = Array.isArray(currentActivities) && currentActivities.some((activity) => activity.name === selectedPlace.name);

      if (!placeExists) {  // 創建新的標記並將其添加到地圖
        markerRef.current = new google.maps.Marker({
          position: newCenter,
          map: mapRef.current,
          title: selectedPlace.name,
        });
      }
    }
  }, [selectedPlace, zoomLevel, currentActivities]);

  // 繪製景點間線條
  useEffect(() => {
    if (activityLocations.length > 1 && polylineRef.current) {
      // 清除舊的 Polyline
      polylineRef.current.setMap(null);
    }

    if (activityLocations.length > 1 && mapRef.current) {
      // 創建新的 Polyline
      const newPolyline = new google.maps.Polyline({
        path: activityLocations,
        geodesic: true,
        strokeColor: "rgb(248, 139, 49)", // 線條顏色
        strokeOpacity: 0.5, // 透明度
        strokeWeight: 10, // 線條寬度
      });
      newPolyline.setMap(mapRef.current); // 使用 mapRef 的地圖實例
      polylineRef.current = newPolyline; // 更新 Polyline 實例
    }
  }, [activityLocations]);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map; // 存儲地圖實例
  };

  // 當活動位置改變時，更新地圖的縮放和中心位置
  useEffect(() => {
    if (activityLocations.length > 0 && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      
      // 包含所有活動的位置
      activityLocations.forEach((location) => {
        bounds.extend(new google.maps.LatLng(location.lat, location.lng));
      });

      // 設定地圖顯示範圍，讓所有標記都能顯示
      mapRef.current.fitBounds(bounds);
    }
  }, [activityLocations]);

  // 直接從地圖上點擊其他圖標, 顯示 InfoWindow
  const handleMapClick = (event: google.maps.MapMouseEvent) => {

    // console.log(event);

    // const latLng = event.latLng;
    // if (latLng) {
    //   // 丟進搜尋顯示資訊
    // }
  };

  // 直接從地圖上點擊圖標
  const handleClickIcon = (activity: any) => {
    const place = {
      id: 0,
      place_id: activity.id,
      name: activity.name,
      formatted_address: activity.location,
      description: activity.note,
      geometry: {
        location: {
          lat: activity.latitude,
          lng: activity.longitude,
        },
      },
      icon: "",
    };
    setSelectedPlace(place);
    setZoomLevel(15); // 適當調整地圖縮放層級
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={zoomLevel}
      options={mapOptions}
      onLoad={onMapLoad} // 獲取地圖實例
      onClick={handleMapClick} // 註冊點擊事件
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

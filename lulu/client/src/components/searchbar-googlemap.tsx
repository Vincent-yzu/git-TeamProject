import { useState, useCallback } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { useMapContext } from "./MapContext"; // 引入 Context
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SearchBarGoogleMapProps {
  placeholder?: string;
}

interface Place {
  id: number;  // 0 = empty
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  icon: string;
  // 根據需要添加其他欄位
}

export const SearchBarGoogleMap = ({ placeholder }: SearchBarGoogleMapProps) => {
  const [query, setQuery] = useState(""); // 儲存搜尋文字
  const [places, setPlaces] = useState<any[]>([]); // 儲存搜尋結果
  const { setSelectedPlace } = useMapContext(); // 從 Context 中取用 `setSelectedPlace`
  const { setAddedPlace } = useMapContext(); // 從 Context 中取用 `setSelectedPlace`
  const { setZoomLevel } = useMapContext(); // 從 Context 中取用 `setSelectedPlace`

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    if (newQuery.trim() === "") {
      setPlaces([]);
    }
  }, []);

  // call google map api
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (query.trim() === "") {
        setPlaces([]);
        return;
      }

      try {
        // 使用 text search 取得景點資料
        const response = await fetch(`${BACKEND_URL}/api/googlesearch?query=${query}`);
        if (!response.ok) {
          throw new Error("Failed to fetch places");
        }

        const data = await response.json();
        setPlaces(data);

        // 更新右側地圖 (使用第一筆資料)
        if (data.length > 0) {
          setZoomLevel(15);
          setSelectedPlace({
            id: 0,
            place_id: data[0].place_id,
            name: data[0].name,
            formatted_address: data[0].formatted_address,
            geometry: {
              location: {
                lat: data[0].geometry.location.lat,
                lng: data[0].geometry.location.lng,
              },
            },
            icon: data[0].icon,
          });
        }
      } catch (error) {
        console.error("搜尋失敗:", error);
      }
    }
  }, [query, setSelectedPlace]);

  // 加入行程
  const handleAddPlace = async (place: Place) => {
    const placeWithTitle = {
      name: place.name, // 假設 place.name 是標題
      description: place.formatted_address, // 假設 formatted_address 是描述
      coordinates: place.geometry.location, // 假設這是經緯度資料
    };
    //console.log("place:", place);

    // add to DataBase
    const response = await fetch(`${BACKEND_URL}/api/addactivity/insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(placeWithTitle),
    });
    if (!response.ok) {
      throw new Error('Failed to add trip');
    }
    
    // 解析回應資料
    const data = await response.json();

    // 打印回應資料來檢查結構
    // console.log("Received data:", data.activity.id);

    // add to Left interface
    setAddedPlace({
      id: data.activity.id,
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
      },
      icon: place.icon,
    });
  };


  return (
    <div>
      <SidebarInput
      placeholder={placeholder || "搜尋附近"}
      value={query}
      onChange={handleSearchChange}
      onKeyDown={handleKeyDown}
      />
      <ul>
        {places.slice(0, 5).map((place) => (  // 最多顯示5筆
          <li key={place.place_id}>
            <strong>{place.name}</strong> - {place.formatted_address}
            <br />
            <button onClick={() => handleAddPlace(place)}>⮕⮕⮕ Add to Trips!</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

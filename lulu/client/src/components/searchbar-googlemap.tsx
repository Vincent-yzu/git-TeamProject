import { useState, useCallback } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { useMapContext } from "./MapContext"; // 引入 Context
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SearchBarGoogleMapProps {
  placeholder?: string;
}

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  // 根據需要添加其他欄位
}

export const SearchBarGoogleMap = ({ placeholder }: SearchBarGoogleMapProps) => {
  const [query, setQuery] = useState(""); // 儲存搜尋文字
  const [places, setPlaces] = useState<any[]>([]); // 儲存搜尋結果
  const { setSelectedPlace } = useMapContext(); // 從 Context 中取用 `setSelectedPlace`

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
        const response = await fetch(`${BACKEND_URL}/api/googlesearch?query=${query}`);
        if (!response.ok) {
          throw new Error("Failed to fetch places");
        }

        const data = await response.json();
        //console.log(data);
        setPlaces(data);

        // 假設 data[0] 包含經緯度資訊
        if (data.length > 0) {
          const lat = data[0].geometry.location.lat;
          const lng = data[0].geometry.location.lng;
          //console.log("接收到的經緯度資訊:", { lat, lng });

          setSelectedPlace({
            geometry: {
              location: {
                lat: lat,
                lng: lng,
              },
            },
          });
        }
      } catch (error) {
        console.error("搜尋失敗:", error);
      }
    }
  }, [query, setSelectedPlace]);

  // add to DataBase
  const handleAddPlace = async (place: Place) => {
    const placeWithTitle = {
      title: place.name, // 假設 place.name 是標題
      description: place.formatted_address, // 假設 formatted_address 是描述
      coordinates: place.geometry.location, // 假設這是經緯度資料
    };
    console.log("place:", place);

    const response = await fetch(`${BACKEND_URL}/api/addactivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(placeWithTitle),
    });
    if (!response.ok) {
      throw new Error('Failed to add trip');
    }
    return response.json();
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
        {places.map((place) => (
          <li key={place.place_id}>
            <strong>{place.name}</strong> - {place.formatted_address}
            <br/>
            <button onClick={() => handleAddPlace(place)}>⮕⮕⮕ Add to Trips!</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

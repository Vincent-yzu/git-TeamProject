import { useState, useCallback } from "react";
import { SidebarInput } from "@/components/ui/sidebar";
import { useMapContext } from "./MapContext"; // 引入 Context
import axios from "axios";
import { debug } from "console";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SearchBarGoogleMapProps {
  placeholder?: string;
}

interface Place {
  id: number; // 0 = empty
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
  const { setAddedPlace } = useMapContext(); // 從 Context 中取用 `setAddedPlace`
  const { setZoomLevel } = useMapContext(); // 從 Context 中取用 `setZoomLevel`

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

        console.log(data);

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
  }, [query, setSelectedPlace, setZoomLevel]);

  const handlePlaceClick = useCallback(
    (place: Place) => {
      setSelectedPlace(place);
      setZoomLevel(15); // 適當調整地圖縮放層級
    },
    [setSelectedPlace, setZoomLevel]
  );

  return (
    <div>
      <SidebarInput
        placeholder={placeholder || "搜尋附近"}
        value={query}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
      />
      <ul>
        {places.slice(0, 5).map((place) => (
          // 最多顯示5筆，點擊更新選擇的地點
          <li
            key={place.place_id}
            onClick={() => handlePlaceClick(place)}
            style={{ cursor: "pointer", marginBottom: '10px', padding: '6px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#f9f9f9', transition: 'background-color 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
          >
            <strong style={styles.title}>{place.name}</strong>
            <p style={styles.address}>{place.formatted_address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  title: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#333',
  },
  address: {
    fontSize: '12px',
    color: '#555',
  },
};
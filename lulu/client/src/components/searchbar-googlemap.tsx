import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarInput } from "@/components/ui/sidebar";
import { useMapContext } from "./MapContext"; // 引入 Context
import { LoaderCircle } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SearchBarGoogleMapProps {
  placeholder?: string;
}

interface Place {
  id: number; // 0 = empty
  place_id: string;
  name: string;
  formatted_address: string;
  description: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  icon: string;
  note: string;
  recommendDuration: number;
  commutingTime: number;
  // 根據需要添加其他欄位
}

export const SearchBarGoogleMap = ({ placeholder }: SearchBarGoogleMapProps) => {
  const [query, setQuery] = useState(""); 
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false); // <-- NEW: loading state

  const { selectedPlace, setSelectedPlace } = useMapContext();
  const { setZoomLevel } = useMapContext();
  const { setCallCloseDetail } = useMapContext();

  const [searchParams] = useSearchParams();
  const destination = searchParams.get("destination") || "";

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (newQuery.trim() === "") {
      setPlaces([]);
    }
  }, []);

  // 初始文字
  useEffect(() => {
    setQuery(destination);
    if (destination !== "") handleSearch(destination);
  }, [destination]);

  // 清除搜尋內容
  const handleClearSearch = useCallback(() => {
    setQuery("");
    setPlaces([]);
    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log("Close Detail!");
    });
  }, []);

  // Enter key handler
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (query.trim() === "") {
          setPlaces([]);
          return;
        }
        handleSearch(query);
      }
    },
    [query]
  );

  // call google map api
  const handleSearch = useCallback(async (queryValue: string) => {
    if (!queryValue || queryValue.trim() === "") {
      alert("搜尋字串為空，請輸入有效的查詢內容！");
      return;
    }
    if (queryValue.length > 36) {
      alert("搜尋字串過長，請縮短查詢內容！");
      return;
    }

    // 防範 SQL 注入和 XSS 攻擊: 只允許安全的字符
    const safeCharactersRegex = /^[\w\s\-'\:\(\)\/\*\.\,·&@一-龥ぁ-んァ-ン가-힣]+$/;
    if (!safeCharactersRegex.test(queryValue)) {
      alert("搜尋字串包含不安全的字符，請檢查並修改！");
      return;
    }

    const sanitizedQuery = queryValue.replace(/\s+/g, " ").trim();
    const sanitizedHtmlQuery = sanitizedQuery.replace(/<.*?>/g, "");
    if (!sanitizedHtmlQuery) {
      alert("搜尋字串不應包含HTML標籤，請檢查！");
      return;
    }

    // Start loading
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/googlesearch?query=${queryValue}`);
      if (!response.ok) {
        if (response.status === 500) {
          alert("伺服器忙碌中！");
        } else if (response.status === 502) {
          alert("目前太多人使用了! 稍等一下喔！");
        } else {
          alert("找不到輸入的景點喔！");
        }
        console.log("error:", response);
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
          description: data[0].description,
          note: "預設的神奇空值",
          recommendDuration: 20241225,
          commutingTime: 20241225,
        });
      }
    } catch (error) {
      console.error("搜尋失敗:", error);
    } finally {
      // End loading
      setIsLoading(false);
    }
  }, []);

  const handlePlaceClick = useCallback(
    (place: Place) => {
      setSelectedPlace({
        id: 0,
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
        description: place.description,
        note: "預設的神奇空值",
        recommendDuration: 20241225,
        commutingTime: 20241225,
      });
      setZoomLevel(15);
    },
    [setSelectedPlace, setZoomLevel]
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <SidebarInput
          placeholder={placeholder || "搜尋附近"}
          value={query}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={handleClearSearch}
            style={{
              marginLeft: "8px",
              padding: "6px",
              border: "none",
              backgroundColor: "#eee",
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            X
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 mt-4">
          <p>Loading...</p>
          <LoaderCircle className="animate-spin" />
        </div>
      )}

      <ul className="pt-[18px]">
        {places.slice(0, 5).map((place) => (
          <li
            key={place.place_id}
            onClick={() => handlePlaceClick(place)}
            style={{
              cursor: "pointer",
              marginBottom: "10px",
              padding: "6px",
              border: "1px solid #eee",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f1f1f1")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
          >
            <strong style={styles.title}>{place.name}</strong>
            <p style={styles.address}>{place.description}</p>
            <p style={styles.address}>{place.formatted_address}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  title: {
    fontSize: "16px",
    marginBottom: "10px",
    color: "#333",
  },
  address: {
    fontSize: "12px",
    color: "#555",
  },
};

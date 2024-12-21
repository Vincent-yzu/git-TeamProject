import React, { useState, useEffect } from "react";
import { useMapContext } from "./MapContext"; // 引入 Context
import { useParams } from "react-router-dom"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

export const AttractionDetail = () => {
  const { selectedPlace } = useMapContext(); // 從 Context 中取用 `selectedPlace`
  const { setAddedPlace } = useMapContext(); // 從 Context 中取用 `setSelectedPlace`
  const { heyUpdateData, setHeyUpdateData } = useMapContext(); // 從 Context 中取用 `heyUpdateData`
  const {selectedDayIndex} = useMapContext(); // 從 Context 中取用 `selectedDayIndex`
  const { id } = useParams()
  const [isVisible, setIsVisible] = useState(false); // 控制容器顯示/隱藏的狀態

  // Update visibility when selectedPlace changes
  useEffect(() => {
    if (selectedPlace) {
      setIsVisible(true);
    }
  }, [selectedPlace]);

  // 加入行程
  const handleAddPlace = async (place: Place) => {
    const placeWithDetail = {
      name: place.name, // 假設 place.name 是標題
      type: "activity", 
      order: 99,
      latitude: place.geometry.location.lat,
      location: place.formatted_address,
      longitude: place.geometry.location.lng,
      photoUrls: [], 
      description: "這是景點的描述!",
      recommendDuration: 60,
    };
    // 新增 id 和 days
    const updatedPlaceWithDetail = {
      itineraryId: id, // 替換為實際的 id 值
      curDays: selectedDayIndex, // 替換為實際的 days 值
      placeWithDetail, // 包含原始活動資料
    };

    // add to DataBase
    const response = await fetch(`${BACKEND_URL}/api/addactivity/insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedPlaceWithDetail),
    });
    if (!response.ok) {
      throw new Error('Failed to add trip');
    }

    // 解析回應資料
    const data = await response.json();

    // 打印回應資料來檢查結構
    // console.log("Received data:", data.activity.id);

    // add to Left interface
    setHeyUpdateData(heyUpdateData + 1);
    // setAddedPlace({
    //   id: data.activity.id,
    //   place_id: place.place_id,
    //   name: place.name,
    //   formatted_address: place.formatted_address,
    //   geometry: {
    //     location: {
    //       lat: place.geometry.location.lat,
    //       lng: place.geometry.location.lng,
    //     },
    //   },
    //   icon: place.icon,
    // });
  };

  // 處理關閉容器
  const handleClose = () => {
    setIsVisible(false);
  };

  // 如果 selectedPlace 為 null 或 undefined，則返回 null
  if (!selectedPlace) return null;

  // 如果容器不可見，則返回 null，不顯示該區域
  if (!isVisible) return null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        ...styles.container,
        position: 'absolute',
        top: '50px',
        left: '10px',
        width: '16vw',
        zIndex: 1000
      }}>
        {/* "X" 按鈕 */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: 'red',
            cursor: 'pointer',
          }}>
          ✖
        </button>

        <h2 style={styles.title}>{selectedPlace.name}</h2>
        <img src={selectedPlace.icon} alt={`${selectedPlace.name} icon`} style={styles.icon} />
        <p style={styles.address}>
          <strong>Address:</strong>
          <br />
          {selectedPlace.formatted_address}
        </p>
        <div style={styles.coordinates}>
          <strong>Coordinates:</strong>
          <br />
          <span>Lat: {selectedPlace.geometry.location.lat}</span>,
          <span>Lng: {selectedPlace.geometry.location.lng}</span>
        </div>
        <br />
        <button
          onClick={() => handleAddPlace(selectedPlace)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45A049'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          ➕ Add to Trips
        </button>
      </div>
    </div>
  );
};

// CSS-in-JS styles
const styles = {
  container: {
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '1400px',
    margin: '20px auto',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333',
  },
  icon: {
    width: '50px',
    height: '50px',
    marginBottom: '10px',
  },
  address: {
    fontSize: '16px',
    marginTop: '20px',
    marginBottom: '10px',
    color: '#555',
  },
  coordinates: {
    fontSize: '14px',
    color: '#777',
  },
};

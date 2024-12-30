import React, { useState, useEffect, useContext, useRef } from "react";
import { useMapContext } from "./MapContext"; // 引入 Context
import { useParams } from "react-router-dom"
// 假設您有一個自訂的 socket context 或在任何地方能取得 socketRef
import { io, Socket } from "socket.io-client";

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
  description: string;
  // 根據需要添加其他欄位
}

export const AttractionDetail = () => {
  const { selectedPlace } = useMapContext(); // 從 Context 中取用 `selectedPlace`
  const { heyUpdateData, setHeyUpdateData } = useMapContext(); // 從 Context 中取用 `heyUpdateData`
  const {selectedDayIndex} = useMapContext(); // 從 Context 中取用 `selectedDayIndex`
  const { id } = useParams()
  const [isVisible, setIsVisible] = useState(false); // 控制容器顯示/隱藏的狀態
  const { callCloseDetail } = useMapContext();
  const socketRef = useRef<Socket | null>(null)

  // Update visibility when selectedPlace changes
  useEffect(() => {
    if (selectedPlace) {
      setIsVisible(true);
    }
  }, [selectedPlace]);

  // 被呼叫關閉
  useEffect(() => {
    handleClose();
  }, [callCloseDetail]);

  // socket
  useEffect(() => {
    const socket = io(`${BACKEND_URL}`, { withCredentials: true, path: '/api/socket.io' })
    socketRef.current = socket
  }, [id])

  // 處理關閉
  const handleClose = () => {
    setIsVisible(false);
  };

  // 加入行程
  const handleAddPlace = async (place: Place) => {
    const placeWithDetail = {
      name: place.name,
      note: "",
      type: "activity", 
      order: 99,
      latitude: place.geometry.location.lat,
      location: place.formatted_address,
      longitude: place.geometry.location.lng,
      photoUrls: [place.icon], 
      description: place.description,
      recommendDuration: 60,
      commutingTime: 30,
    };
    // 新增 id 和 days
    const updatedPlaceWithDetail = {
      itineraryId: id,
      curDays: selectedDayIndex,
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

    // 視情況更新 UI
    setHeyUpdateData(heyUpdateData + 1);
    
    // ==========> Socket emit (add_trip) <============
    socketRef.current?.emit("add_trip", {
      roomId: id,              // 行程 ID
      dayIndex: selectedDayIndex,  
      newActivity: data.activity,
    });
  };

  // 如果 selectedPlace 為 null 或 undefined，則返回 null
  if (!selectedPlace) return null;

  // 如果容器不可見，則返回 null，不顯示該區域
  if (!isVisible) return null;

  // 計算 & 顯示時間
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours > 0 ? `${hours} hr ` : ""}${remainingMinutes} mins`
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        ...styles.container,
        position: 'absolute',
        top: '0px',
        left: '10px',
        width: 'calc(100vw - 20px)', // Adjust width based on viewport size
        maxWidth: '400px', // Set a max width to prevent it from getting too large
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
        <img src={selectedPlace.icon} alt={`${selectedPlace.name} icon`} className="w-full h-full object-cover rounded-md" />
        <p style={styles.address}>
          <strong>Description:</strong>
          <br />
          {selectedPlace.description}
        </p>
        <p style={styles.address}>
          <strong>Address:</strong>
          <br />
          {selectedPlace.formatted_address}
        </p>
        {selectedPlace.recommendDuration !== 20241225 && (
          <p style={styles.address}>
            <strong>⏳ 停留時間:</strong>
            <br />
            {selectedPlace.recommendDuration > 0 ? formatDuration(selectedPlace.recommendDuration) : "停留時間不可以小於0喔！ 😊"}
          </p>
        )}
        {/* {selectedPlace.commutingTime !== 20241225 && (
          <p style={styles.address}>
            <strong>🚗 通勤時間:</strong>
            <br />
            {selectedPlace.commutingTime > 0 ? formatDuration(selectedPlace.commutingTime) : "通勤時間不可以小於0喔！ 😊"}
          </p>
        )} */}
        {selectedPlace.note !== "預設的神奇空值" && (
          <p style={styles.address}>
            <strong>💡 個人筆記:</strong>
            <br />
            {selectedPlace.note ? selectedPlace.note : "您可以在此處撰寫備註，方便記錄您的想法或重要資訊哦！ 😊"}
          </p>
        )}
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

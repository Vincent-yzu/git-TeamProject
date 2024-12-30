import React, { useState, useEffect, useContext, useRef } from "react";
import { useMapContext } from "./MapContext"; 
import { useParams } from "react-router-dom";
// 假設您有一個自訂的 socket context 或在任何地方能取得 socketRef
import { io, Socket } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface Place {
  id: number; // 0 = empty
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number; } };
  icon: string;
  description: string;
}

export const AttractionDetail = () => {
  const { selectedPlace } = useMapContext();
  const { heyUpdateData, setHeyUpdateData } = useMapContext();
  const { selectedDayIndex } = useMapContext();
  const { id } = useParams();
  const socketRef = useRef<Socket | null>(null)

  const [isVisible, setIsVisible] = useState(false);
  const { callCloseDetail } = useMapContext();

  useEffect(() => {
    if (selectedPlace) {
      setIsVisible(true);
    }
  }, [selectedPlace]);

  useEffect(() => {
    handleClose();
  }, [callCloseDetail]);

  useEffect(() => {
    const socket = io(`${BACKEND_URL}`, { withCredentials: true, path: '/api/socket.io' })
    socketRef.current = socket
  }, [id])

  const handleClose = () => {
    setIsVisible(false);
  };

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

    const updatedPlaceWithDetail = {
      itineraryId: id,
      curDays: selectedDayIndex,
      placeWithDetail,
    };

    // 呼叫後端 API 進行資料庫插入
    const response = await fetch(`${BACKEND_URL}/api/addactivity/insert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPlaceWithDetail),
    });
    if (!response.ok) {
      throw new Error('Failed to add trip');
    }

    // 解析後端回傳資料
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

  if (!selectedPlace) return null;
  if (!isVisible) return null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        ...styles.container,
        position: 'absolute',
        top: '50px',
        left: '10px',
        width: 'calc(100vw - 20px)',
        maxWidth: '400px',
        zIndex: 1000
      }}>
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
        <img
          src={selectedPlace.icon}
          alt={`${selectedPlace.name} icon`}
          style={styles.icon}
        />
        <p style={styles.address}>
          <strong>Address:</strong>
          <br />
          {selectedPlace.formatted_address}
        </p>
        <div style={styles.coordinates}>
          <strong>Coordinates:</strong>
          <br />
          Lat: {selectedPlace.geometry.location.lat},
          Lng: {selectedPlace.geometry.location.lng}
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

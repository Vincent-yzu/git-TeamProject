import React, { useState, useEffect, useContext, useRef } from "react";
import { useMapContext } from "./MapContext"; // 引入 Context
import { useParams } from "react-router-dom";
import DurationPopup from "./DurationPopup"; // 引入 DurationPopup
import NotePopup from "./NotePopup"; // 引入 NotePopup
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
  recommendDuration: number;
  note: string;
  // 根據需要添加其他欄位
}

export const AttractionDetail = () => {
  const { selectedPlace, setSelectedPlace } = useMapContext();
  const { heyUpdateData, setHeyUpdateData } = useMapContext();
  const { selectedDayIndex } = useMapContext(); 
  const { id } = useParams();
  const [isVisible, setIsVisible] = useState(false);
  const { callCloseDetail } = useMapContext();
  const [isDurationPopupOpen, setIsDurationPopupOpen] = useState<boolean>(false);
  const [newDuration, setNewDuration] = useState<number>(0);
  const [isNotePopupOpen, setIsNotePopupOpen] = useState<boolean>(false);
  const [noteValue, setNoteValue] = useState<string>("");
  const {currentActivities, setCurrentActivities} = useMapContext();
  const socketRef = useRef<Socket | null>(null)
  const {
    editingUser_note, 
    setEditingUser_note,
  } = useMapContext()

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

  const handleDurationClick = (duration: number) => {
    setNewDuration(duration);
    setIsDurationPopupOpen(true);
  };

  const handleDurationSave = async () => {
    if (selectedPlace) {
      const updatedPlace = { ...selectedPlace, recommendDuration: newDuration };
      setSelectedPlace(updatedPlace);

      const updatedNote = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        place: { activityId: selectedPlace.place_id, recommendDuration: newDuration },
      };

      // update to DataBase
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateDuration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNote),
      });

      if (!response.ok) {
        throw new Error(`Failed to update duration: ${response.statusText}`);
      }

      // Emit socket event
      socketRef.current?.emit("update_duration", {
        roomId: id,
        dayIndex: selectedDayIndex,
        activityId: selectedPlace.place_id,
        recommendDuration: newDuration,
      });

      currentActivities?.find((activity) => {
        if (activity.id === selectedPlace.place_id) {
          activity.recommendDuration = newDuration;
        }
      });
      setCurrentActivities(JSON.parse(JSON.stringify(currentActivities)));
      setIsDurationPopupOpen(false);
    }
  };

  const handleDurationCancel = () => {
    setIsDurationPopupOpen(false);
  };

  const handleNoteClick = (note: string) => {
    setNoteValue(note);
    setIsNotePopupOpen(true);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteValue(e.target.value);
  };

  const handleNoteSave = async () => {
    if (selectedPlace) {
      const updatedPlace = { ...selectedPlace, note: noteValue };
      setSelectedPlace(updatedPlace);

      const updatedNote = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        place: { activityId: selectedPlace.place_id, note: noteValue },
      };

      // update to DataBase
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateNote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNote),
      });

      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.statusText}`);
      }

      // Emit socket event
      socketRef.current?.emit("update_note", {
        roomId: id,
        dayIndex: selectedDayIndex,
        activityId: selectedPlace.place_id,
        note: noteValue,
      });

      currentActivities?.find((activity) => {
        if (activity.id === selectedPlace.place_id) {
          activity.note = noteValue;
        }
      });
      setCurrentActivities(JSON.parse(JSON.stringify(currentActivities)));
      setIsNotePopupOpen(false);
    }
  };

  const handleNoteCancel = () => {
    setIsNotePopupOpen(false);
  };

  // 如果 selectedPlace 為 null 或 undefined，則返回 null
  if (!selectedPlace) return null;

  // 如果容器不可見，則返回 null，不顯示該區域
  if (!isVisible) return null;

  // 計算 & 顯示時間
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours > 0 ? `${hours} 小時 ` : ""}${remainingMinutes} 分鐘`
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
        zIndex: 1000,
        overflowY: "auto", // Make the container scrollable
        maxHeight: "90vh", // Set a max height to prevent it from getting too large
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
          <p
            style={styles.address}
            onClick={() => handleDurationClick(selectedPlace.recommendDuration)}
            className="cursor-pointer underline"
          >
            <strong>⏳ 停留時間:</strong>
            <br />
            {selectedPlace.recommendDuration > 0 ? formatDuration(selectedPlace.recommendDuration) : "停留時間不可以小於0喔！ 😊"}
          </p>
        )}
        <div
          style={{
            width: "100%", // 你可以根據需求調整寬度
            height: "80%", // 你可以根據需求調整高度
            border: editingUser_note && editingUser_note.length > 0 && editingUser_note[0].day == parseInt(selectedDayIndex, 10) && editingUser_note[0].activityId == selectedPlace.place_id ? "4px solid rgb(75, 202, 118)" : "2px solid transparent", // 條件式邊框
            transition: "border 0.3s ease", // 加入過渡效果，使邊框變化更平滑
          }}
        >
          { editingUser_note && editingUser_note.length > 0 && editingUser_note[0].day == parseInt(selectedDayIndex, 10) && editingUser_note[0].activityId == selectedPlace.place_id && (
            <p
              style={{
                backgroundColor: "rgb(188, 238, 188)", // 淡橘色背景
                color: "rgb(31, 102, 55)", // 橘色文字
                fontWeight: "bold", // 加粗字體
                fontSize: "16px", // 增加字體大小
                borderRadius: "8px", // 圓角邊框
                padding: "2px 0px", // 內邊距
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // 輕微陰影效果
                transition: "transform 0.3s ease-in-out", // 動畫效果
                marginTop: "2px", // 上邊距
                marginBottom: "2px", // 上邊距
                display: "inline-block", // 使元素只佔用內容區域
              }}
            >
              {editingUser_note[0].user.email.split("@")[0]}&nbsp;正在編輯!
            </p>
          )}
          {selectedPlace.note !== "預設的神奇空值" && (
            <p
              style={styles.address}
              onClick={() => handleNoteClick(selectedPlace.note)}
              className="cursor-pointer underline"
            >
              <strong>💡 個人筆記:</strong>
              <br />
              {selectedPlace.note ? selectedPlace.note : "您可以在此處撰寫備註，方便記錄您的想法或重要資訊哦！ 😊"}
            </p>
          )}
        </div>
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

      {isDurationPopupOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
          <DurationPopup
            duration={newDuration}
            onDurationChange={setNewDuration}
            onSave={handleDurationSave}
            onCancel={handleDurationCancel}
          />
        </div>
      )}

      {isNotePopupOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
          <NotePopup
            noteValue={noteValue}
            onChange={handleNoteChange}
            onSave={handleNoteSave}
            onCancel={handleNoteCancel}
          />
        </div>
      )}
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

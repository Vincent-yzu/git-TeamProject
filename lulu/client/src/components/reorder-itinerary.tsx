// ReorderItinerary.tsx (Client)
import { useEffect, useRef, useState } from "react"
import { Itinerary, User } from "@/types/response"
import { Reorder } from "framer-motion"
import { useParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

import { useItinerary } from "@/hooks/use-itinerary"
import { useToast } from "@/hooks/use-toast"

import { useMapContext } from "./MapContext"
import NotePopup from "./NotePopup"
import { useAuth } from "@/hooks/use-auth"
import DurationPopup from "./DurationPopup"
import TravelTimePopup from "./TravelTimePopup"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

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
}

const calculateTimeRange = (startTime: string, duration: number) => {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(startHours, startMinutes, 0, 0);
  const endDate = new Date(startDate.getTime() + duration * 60000);
  const endHours = endDate.getHours().toString().padStart(2, "0");
  const endMinutes = endDate.getMinutes().toString().padStart(2, "0");
  return `${startTime} - ${endHours}:${endMinutes}`;
};
const calculateNextStartTime = (startTime: string, previousDurations: number) => {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const startDate = new Date();
  startDate.setHours(startHours, startMinutes, 0, 0);
  const nextStartDate = new Date(startDate.getTime() + previousDurations * 60000);
  const nextStartHours = nextStartDate.getHours().toString().padStart(2, "0");
  const nextStartMinutes = nextStartDate.getMinutes().toString().padStart(2, "0");
  return `${nextStartHours}:${nextStartMinutes}`;
};

const ReorderItinerary = () => {
  const [isDescriptionOn, setIsDescriptionOn] = useState<boolean | undefined>(false)
  const { data: auth } = useAuth()
  if (!auth?.user) {
    return null
  }
  const { toast } = useToast()
  
  // MapContext
  const { 
    heyUpdateData, 
    selectedDayIndex, 
    setSelectedDayIndex, 
    setSelectedPlace, 
    setZoomLevel,
    setCallCloseDetail,
    currentActivities: contextCurrentActivities,
    setCurrentActivities 
  } = useMapContext()

  const { id } = useParams()
  const { data: itinerary, isLoading } = useItinerary(id as string, heyUpdateData)

  const [daysActivities, setDaysActivities] = useState<Itinerary["days"][number]["activities"][]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>(id as string)

  // 備註
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState<string>("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [descriptionActivityId, setDescriptionActivityId] = useState<string | null>(null)
  const [isNotePopupOpen, setIsNotePopupOpen] = useState<boolean>(false);

  // 停留時間
  const [isDurationPopupOpen, setIsDurationPopupOpen] = useState<boolean>(false)
  const [editingDurationActivityId, setEditingDurationActivityId] = useState<string | null>(null)
  const [newDuration, setNewDuration] = useState<number>(0)

  // 交通時間
  const [isTravelTimePopupOpen, setIsTravelTimePopupOpen] = useState<boolean>(false)
  const [editingTravelTimeActivityId, setEditingTravelTimeActivityId] = useState<string | null>(null)
  const [newTravelTime, setNewTravelTime] = useState<number>(0)

  // 節流用
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 當 contextCurrentActivities 改變時，更新 daysActivities 中當前天數 (currentDayIndex) 的活動的 recommendDuration
  useEffect(() => {
    const durations = contextCurrentActivities?.map((act) => {
      return act.recommendDuration;
    });

    if(!durations) return;

    daysActivities[currentDayIndex]?.forEach((act, idx) => {
      act.recommendDuration = durations[idx];
    });

    setDaysActivities(JSON.parse(JSON.stringify(daysActivities)));
  }, [contextCurrentActivities]);

  // 當 contextCurrentActivities 改變時，更新 daysActivities 中當前天數 (currentDayIndex) 的活動的 note
  useEffect(() => {
    const notes = contextCurrentActivities?.map((act) => {
      return act.note;
    });

    if(!notes) return;

    daysActivities[currentDayIndex]?.forEach((act, idx) => {
      act.note = notes[idx];
    });

    setDaysActivities(JSON.parse(JSON.stringify(daysActivities)));
  }, [contextCurrentActivities]);

  useEffect(() => {
    if (itinerary && itinerary.days && itinerary.days.length > 0) {
      // 根據 order 排序每個 day's activity
      setDaysActivities(
        itinerary.days.map((day) => {
          return day.activities ? day.activities.sort((a, b) => a.order - b.order) : []
        })
      )
    }
  }, [itinerary, heyUpdateData])

  useEffect(() => {
    const socket = io(`${BACKEND_URL}`, { withCredentials: true, path: '/api/socket.io' })
    socketRef.current = socket

    // 連線成功
    socket.on("connect", () => {
      console.log("Connected to socket server")
      socket.emit("join_room", { roomId })
    })

    // 加入房間成功
    socket.on("room_user_joined", (user: User) => {
      if (auth?.user?.id !== user.id) {
        toast({
          title: `${user.email.split('@')[0]} joined room`,
        })
      }
    })

    // 監聽 reorder 結果
    socket.on(
      "reorder_update",
      (updatedActivities: {
        dayIndex: number
        activities: Itinerary["days"][number]["activities"]
      }) => {
        console.log("Received reorder update:", updatedActivities)
        setDaysActivities((prev) => {
          const newDays = [...prev]
          newDays[updatedActivities.dayIndex] = updatedActivities.activities
          return newDays
        })
        if (updatedActivities.dayIndex == parseInt(selectedDayIndex, 10)) {
          setCurrentActivities(updatedActivities.activities)  // 更新圖標順序 (直接把handleLoadMap加在這裡會跳錯誤)
        }
      }
    )

    

    // 監聽: 刪除行程
    socket.on("trip_deleted", (data: { dayIndex: number; activityId: string }) => {
      console.log("Trip deleted:", data)
      setDaysActivities((prev) => {
        const newDays = [...prev]
        if (newDays[data.dayIndex]) {
          newDays[data.dayIndex] = newDays[data.dayIndex].filter(
            (activity) => activity.id !== data.activityId
          )
        }
        return newDays
      })
      setCurrentActivities((prev) => {
        let newActivities = [...prev]
        if (newActivities) {
          newActivities = newActivities.filter(
            (activity) => activity.id !== data.activityId
          )
        }
        return newActivities
      })  // 更新圖標順序 (直接把handleLoadMap加在這裡會跳錯誤)
    })

    // 監聽: 編輯備註
    socket.on("note_edited", (data: { dayIndex: number; activityId: string; note: string }) => {
      console.log("Note edited:", data)
      setDaysActivities((prev) => {
        const newDays = [...prev]
        newDays[data.dayIndex] = newDays[data.dayIndex].map((activity) =>
          activity.id === data.activityId ? { ...activity, note: data.note } : activity
        )
        return newDays
      })
    })

    // 監聽: 編輯每日開始時間
    socket.on("start_time_updated", (data: { dayIndex: number; startTime: string }) => {
      console.log("Start time updated:", data)
      // 這裡要特別注意，如果想即時更新 itinerary.days[startTime]，可能需要在 local state 也存那個 startTime
      if (itinerary?.days?.[data.dayIndex]) {
        itinerary.days[data.dayIndex].startTime = data.startTime
      }
      // 若想讓畫面立即 re-render，需要配合 setItinerary 或 setDaysActivities 做一些額外處理
    })

    // 監聽: 編輯停留時間
    socket.on("duration_updated", (data: { dayIndex: number; activityId: string; recommendDuration: number }) => {
      console.log("Duration updated:", data)
      setDaysActivities((prev) => {
        const newDays = [...prev]
        newDays[data.dayIndex] = newDays[data.dayIndex].map((act) =>
          act.id === data.activityId ? { ...act, recommendDuration: data.recommendDuration } : act
        )
        return newDays
      })
    })

    socket.on("trip_added", (data: { dayIndex: number; newActivity: any }) => {
      console.log("trip_added => ", data)
      // 例如將該活動插入指定 dayIndex 的行程中
      setDaysActivities((prev) => {
        const newDays = [...prev]
        // 先確保 newDays[data.dayIndex] 存在
        if (newDays[data.dayIndex]) {
          newDays[data.dayIndex] = [...newDays[data.dayIndex], data.newActivity]
        }
        return newDays
      })
    })

    // 監聽: 編輯交通時間
    socket.on("commuting_time_updated", (data: { dayIndex: number; activityId: string; commutingTime: number }) => {
      console.log("Commuting time updated:", data)
      setDaysActivities((prev) => {
        const newDays = [...prev]
        newDays[data.dayIndex] = newDays[data.dayIndex].map((act) =>
          act.id === data.activityId ? { ...act, commutingTime: data.commutingTime } : act
        )
        return newDays
      })
    })

    // 離開頁面 / 組件銷毀時斷開 socket
    return () => {
      socket.disconnect()
    }
  }, [roomId])

  // 異步拉資料完成前的狀態
  if (isLoading) return <div>Loading...</div>

  // 沒有行程資料
  if (!itinerary || !itinerary.days) {
    console.log("No itinerary data available", itinerary)
    return <div>No itinerary data available</div>
  }

  // 目前選擇的 day activities
  const currentDayIndex = parseInt(selectedDayIndex, 10)
  const currentActivities = daysActivities[currentDayIndex] || []

  // reorder 的 callback
  const handleReorder = (newOrder: Itinerary["days"][number]["activities"]) => {
    setDaysActivities((prev) => {
      const newDays = [...prev]
      newDays[currentDayIndex] = newOrder
      return newDays
    })
    // 通知其他使用者
    socketRef.current?.emit("reorder_event", {
      roomId,
      reorderData: {
        dayIndex: currentDayIndex,
        activities: newOrder,
      },
    })
  }

  // reorder 後存到 DB
  const saveMails = async () => {
    try {
      const updatedActivities = {
        itineraryId: id,
        curDays: selectedDayIndex,
        currentActivities,
      }

      const response = await fetch(`${BACKEND_URL}/api/addactivity/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedActivities }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save mails: ${response.statusText}`)
      }
      const data = await response.json()
      console.log("Mails saved successfully:", data)

      // 更新圖標順序
      handleLoadMap()
    } catch (error) {
      console.error("Error saving mails:", error)
    }
  }

  // ============== 以下為新增的功能/Socket 行為 ==============

  /**
   * 刪除行程
   */
  const handleDeletePlace = async (activityId: string) => {
    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    })

    try {
      const updatedPlace = {
        itineraryId: id,
        curDays: selectedDayIndex,
        place: { activityId },
      }

      const response = await fetch(`${BACKEND_URL}/api/addactivity/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlace),
      })
      if (!response.ok) {
        throw new Error("Failed to delete trip")
      }

      // 通知 socket
      socketRef.current?.emit("delete_trip", {
        roomId,
        dayIndex: currentDayIndex,
        activityId,
      })
      // 本地端也先行刪除
      setDaysActivities((prev) => {
        const newDays = [...prev]
        newDays[currentDayIndex] = newDays[currentDayIndex].filter(
          (activity) => activity.id !== activityId
        )
        return newDays
      })

      // 更新圖標順序
      setCurrentActivities((prev) => {
        let newActivities = [...prev]
        if (newActivities) {
          newActivities = newActivities.filter(
            (activity) => activity.id !== activityId
          )
        }
        return newActivities
      })  // 更新圖標順序 (直接把handleLoadMap加在這裡會跳錯誤)
    } catch (error) {
      console.error("Error deleting trip:", error)
    }
  }

  /**
   * 編輯備註
   */
  const handleNoteClick = (activityId: string, note: string) => {
    setEditingNoteId(activityId)
    setNoteValue(note)
    setIsNotePopupOpen(true)
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    })
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNoteValue(e.target.value)
  }

  const handleNoteSave = async () => {
    if (!editingNoteId) return
    try {
      const updatedNote = {
        itineraryId: id,
        curDays: selectedDayIndex,
        place: { activityId: editingNoteId, note: noteValue },
      }

      // Update to DB
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateNote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNote),
      })
      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.statusText}`)
      }

      // 通知 socket
      socketRef.current?.emit("edit_note", {
        roomId,
        dayIndex: currentDayIndex,
        activityId: editingNoteId,
        note: noteValue,
      })

      // Local update
      setDaysActivities((prev) => {
        const newDays = [...prev]
        newDays[currentDayIndex] = newDays[currentDayIndex].map((activity) =>
          activity.id === editingNoteId ? { ...activity, note: noteValue } : activity
        ) as Itinerary["days"][number]["activities"]
        return newDays
      })

      setIsNotePopupOpen(false)
      // updateActivityInDays(editingNoteId, { note: noteValue });
      // setIsPopupOpen(false); // Close the popup
      setEditingNoteId(null)
    } catch (error) {
      console.error("Error updating note:", error)
    }
  }

  const handleNoteCancel = () => {
    setIsNotePopupOpen(false)
    setEditingNoteId(null)
  }

  /**
   * 顯示 / 收合說明
   */
  // const toggleDescription = (activityId: string) => {
  //   setDescriptionActivityId((prevId) => (prevId === activityId ? null : activityId))
  // }

  // 停留時間
  const handleDurationClick = (activityId: string, duration: number) => {
    setEditingDurationActivityId(activityId)
    setNewDuration(duration)
    setIsDurationPopupOpen(true)
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    });
  }
  const handleDurationSave = async () => {
    if (!editingDurationActivityId) return
    await handleRecommendDurationChange(editingDurationActivityId, newDuration)
    setIsDurationPopupOpen(false)
    // updateActivityInDays(editingDurationActivityId, { recommendDuration: newDuration });
    setIsDurationPopupOpen(false); // Close the popup  // Merge到一半我發現ui的這邊多了一行重複的 不知道有沒有功能(?
  }

  const handleRecommendDurationChange = async (activityId: string, newDuration: number) => {
    // 更新DB
    try {
      const updatedNote = {
        itineraryId: id,
        curDays: selectedDayIndex,
        place: { activityId, recommendDuration: newDuration },
      }
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateDuration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNote),
      })
      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating recommendDuration:", error)
    }

    // 通知 socket
    socketRef.current?.emit("update_duration", {
      roomId,
      dayIndex: currentDayIndex,
      activityId,
      recommendDuration: newDuration,
    })

    // 更新本地資料
    setDaysActivities((prev) => {
      const newDays = [...prev]
      newDays[currentDayIndex] = newDays[currentDayIndex].map((act) =>
        act.id === activityId ? { ...act, recommendDuration: newDuration } : act
      )
      return newDays
    })
  }

  // 交通時間
  const handleTravelTimeClick = (activityId: string, travelTime: number) => {
    setEditingTravelTimeActivityId(activityId)
    setNewTravelTime(travelTime)
    setIsTravelTimePopupOpen(true)
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    });
  }

  const handleCommutingTimeSave = async () => {
    if (!editingTravelTimeActivityId) return
    await handleCommutingTimeChange(editingTravelTimeActivityId, newTravelTime)
    setIsTravelTimePopupOpen(false)
    setIsTravelTimePopupOpen(false); // Close the popup  // Merge到一半我發現ui的這邊多了一行重複的 不知道有沒有功能(?
  }

  const handleCommutingTimeChange = async (activityId: string, newCommutingTime: number) => {
    // 更新DB
    try {
      const updatedCommutingTime = {
        itineraryId: id,
        curDays: selectedDayIndex,
        place: { activityId, commutingTime: newCommutingTime },
      }
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateCommutingTime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCommutingTime),
      })
      if (!response.ok) {
        throw new Error(`Failed to update commuting time: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating commuting time:", error)
    }

    // 通知 socket
    socketRef.current?.emit("update_commuting_time", {
      roomId,
      dayIndex: currentDayIndex,
      activityId,
      commutingTime: newCommutingTime,
    })

    // 更新本地資料
    setDaysActivities((prev) => {
      const newDays = [...prev]
      newDays[currentDayIndex] = newDays[currentDayIndex].map((act) =>
        act.id === activityId ? { ...act, commutingTime: newCommutingTime } : act
      )
      return newDays
    })
  }

  // 點擊地圖上的地點
  const handlePlaceClick = (activity: any) => {
    const place: Place = {
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
      icon: activity.photoUrls?.[0] || "",
      note: activity.note,
      recommendDuration: activity.recommendDuration,
      commutingTime: activity.commutingTime,
    }
    setSelectedPlace(place)
    setZoomLevel(15) // 調整地圖縮放層級
  }

  // 將目前 Day 的所有 Activities 丟到 Map
  const handleLoadMap = () => {
    setCurrentActivities(currentActivities)
  }

  /**
   * 修改每日開始時間
   */
  const handleStartTime = async (newStartTime: string) => {
    const updatedTime = {
      itineraryId: id,
      curDays: selectedDayIndex,
      startTime: newStartTime,
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateStartTime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTime),
      })
      if (!response.ok) {
        throw new Error("Failed to update StartTime")
      }
      // Socket 同步
      socketRef.current?.emit("update_start_time", {
        roomId,
        dayIndex: currentDayIndex,
        startTime: newStartTime,
      })
    } catch (error) {
      console.error("Error updating StartTime:", error)
    }
  }

  // 格式化分鐘 -> hr/mins
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours > 0 ? `${hours} 小時 ` : ""}${remainingMinutes} 分鐘`
  }
  
  return (
    <div ref={containerRef} className="p-2 flex flex-col h-full">
      <div className="bg-gray-200 p-4">
        <h2 className="text-xl font-bold mb-2">
          {itinerary.description}
        </h2>
        <p className="text-base font-semibold text-gray-600">
          地點: {itinerary.location}
        </p>
      </div>

      {/* 選擇 Day */}
      <div className="flex space-x-2 mb-2 overflow-x-auto scrollbar-hide whitespace-nowrap bg-gray-100 p-2">
        {itinerary.days.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedDayIndex(index.toString())}
            className={`px-3 py-1 rounded ${
              selectedDayIndex === index.toString()
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
              >
            Day {index + 1}
          </button>
        ))}
      </div>
      <style>{`
        .overflow-x-auto {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
        .overflow-x-auto::-webkit-scrollbar {
          display: none; /* Chrome, Safari, and Edge */
        }
      `}</style>

      {/* 出發時間 */}
      <div className="flex items-center mb-2">
        <label htmlFor="start-time" className="mr-2 font-semibold">
          出發時間:
        </label>
        <input
          type="time"
          id="start-time"
          value={itinerary.days[currentDayIndex].startTime || "08:00"}
          onChange={(e) => {
            const newStartTime = e.target.value
            // 先行更新本地資料
            itinerary.days[currentDayIndex].startTime = newStartTime
            handleStartTime(newStartTime)
          }}
          className="px-2 py-1 bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* 拖曳排序的區域 */}
      <Reorder.Group
        axis="y"
        values={currentActivities}
        onReorder={handleReorder}
        className="flex-1 overflow-auto pb-0.5"
      >
        {currentActivities.map((activity, idx) => (
          <Reorder.Item
            key={activity.id}
            value={activity}
            className="flex flex-col rounded-lg border p-3 shadow-lg mb-2"
            onDragEnd={() => saveMails()}
            onClick={() => handlePlaceClick(activity)}
            onLoad={() => handleLoadMap()}
          >
            {/* 左右並排內容 */}
            <div className="flex flex-row justify-between items-stretch">
              {/* 左側內容 */}
              <div className="flex flex-col flex-1">
                <p>行程 {idx + 1}</p>
                <h3 className="text-lg font-semibold leading-6">
                  {activity.name}
                </h3>
                <p className="text-xs text-gray-500">📍 {activity.location}</p>

                {/* Merge後的寫法有點爛  但我想睡覺了之後再改(X */}
                <p className="text-xs text-gray-500">{calculateTimeRange(calculateNextStartTime(itinerary.days[currentDayIndex].startTime, currentActivities.slice(0, idx).reduce((acc, act) => acc + act.recommendDuration + act.commutingTime, 0)), activity.recommendDuration)}</p>

                <div className="mt-auto flex space-x-2 pt-2">
                  <button
                    onClick={() => handlePlaceClick(activity)}
                    className={`px-2 py-1 rounded text-sm w-20 h-10 ${
                      descriptionActivityId === activity.id
                        ? "bg-slate-500 text-white hover:bg-slate-600"
                        : "bg-cyan-700 text-white hover:bg-cyan-800"
                    }`}
                  >
                    {descriptionActivityId === activity.id ? "Hide Description" : "詳細資訊"}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlace(activity.id);
                    }}
                    className="px-2 py-1 rounded text-sm bg-red-500 text-white hover:bg-red-600 w-20 h-10"
                  >
                    刪除
                  </button>
                </div>
              </div>

              {/* 右側內容 */}
              <div className="flex flex-col items-start justify-between w-40 ml-4">
                {/* 說明 / 圖片 */}
                {descriptionActivityId === activity.id ? (
                  <div className="text-sm text-gray-600">{activity.description}</div>
                ) : (
                  <img
                    src={activity.photoUrls?.[0]}
                    alt={activity.name}
                    className="w-full h-20 object-cover rounded-md"
                  />
                )}

                <div className="mt-2">
                  {/* 備註 */}
                  <span className="text-gray-500">💡</span>
                  <p
                    className="text-xs text-gray-500 cursor-pointer underline inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNoteClick(activity.id, activity.note);
                    }}
                  >
                    {activity.note ? activity.note.slice(0, 8) + "..." : <span className="underline">編輯個人筆記</span>}
                  </p>

                  {/* 停留時間 */}
                  <div className="flex items-center">
                    <span className="text-gray-500">⏳</span>
                    <p
                      className="text-xs text-gray-500 cursor-pointer underline inline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDurationClick(activity.id, activity.recommendDuration);
                      }}
                    >
                      {formatDuration(activity.recommendDuration)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 下方內容 - 交通時間 */}
            {idx < currentActivities.length - 1 && (
              <div className="flex items-center mt-4 w-full p-3 rounded-lg bg-gray-50 shadow-md">
                <span className="text-gray-500 text-xl mr-2">🚗</span>
                <p
                  className="text-sm text-gray-700 cursor-pointer hover:text-gray-900 underline inline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTravelTimeClick(activity.id, activity.commutingTime);
                  }}
                >
                  到下一站的車程大約:{" "}
                  <span className="font-semibold">{formatDuration(activity.commutingTime)}</span>
                  &nbsp;!
                </p>
              </div>
            )}
          </Reorder.Item>
        ))}
        <div style={{ height: "50px" }}></div> {/* 占位 */}
      </Reorder.Group>

      {isPopupOpen && (
        <NotePopup
          noteValue={noteValue}
          onChange={handleNoteChange}
          onSave={handleNoteSave}
          onCancel={handleNoteCancel}
        />
      )}
      {isDurationPopupOpen && (
        <DurationPopup
          duration={newDuration}
          onDurationChange={setNewDuration}
          onSave={handleDurationSave}
          onCancel={() => setIsDurationPopupOpen(false)}
        />
      )}
      {isTravelTimePopupOpen && (
        <TravelTimePopup
          travelTime={newTravelTime}
          onTravelTimeChange={setNewTravelTime}
          onSave={handleCommutingTimeSave}
          onCancel={() => setIsTravelTimePopupOpen(false)}
        />
      )}

      {isTravelTimePopupOpen && (
        <TravelTimePopup
          travelTime={newTravelTime}
          onTravelTimeChange={setNewTravelTime}
          onSave={handleCommutingTimeSave}
          onCancel={() => setIsTravelTimePopupOpen(false)}
        />
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
  )
}

export { ReorderItinerary }


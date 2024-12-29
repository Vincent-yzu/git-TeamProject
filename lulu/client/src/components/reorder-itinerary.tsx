import { useEffect, useRef, useState } from "react"
import { Itinerary, User } from "@/types/response"
import { Reorder } from "framer-motion"
import { useParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

import { useItinerary } from "@/hooks/use-itinerary"
import { useToast } from "@/hooks/use-toast"

import { useMapContext } from "./MapContext" // 引入 Context
import NotePopup from "./NotePopup" // 引入 NotePopup
import { useAuth } from "@/hooks/use-auth"
import DurationPopup from "./DurationPopup" // 引入 DurationPopup
import TravelTimePopup from "./TravelTimePopup" // 引入 TravelTimePopup

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
  const [isDescriptionOn, setIsDescriptionOn] = useState<boolean | undefined>(
    false
  )
  const {data: auth} = useAuth()
  if (!auth?.user) {
    return null
  }
  const { toast } = useToast()
  const { heyUpdateData } = useMapContext() // 從 Context 中取用 `heyUpdateData`
  const { selectedDayIndex, setSelectedDayIndex } = useMapContext() // 從 Context 中取用 `selectedDayIndex`
  const { setSelectedPlace } = useMapContext() // 從 Context 中取用 `selectedPlace`
  const { setZoomLevel } = useMapContext(); // 從 Context 中取用 `setZoomLevel`
  const { setCallCloseDetail } = useMapContext();
  const { setCurrentActivities } = useMapContext() // 從 Context 中取用 `setCurrentActivities`

  const { id } = useParams()
  const { data: itinerary, isLoading } = useItinerary(
    id as string,
    heyUpdateData
  )

  const [daysActivities, setDaysActivities] = useState<Itinerary["days"][number]["activities"][]>([])
  //const [selectedDayIndex, setSelectedDayIndex] = useState("0")
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>(id as string)

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState<string>("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [descriptionActivityId, setDescriptionActivityId] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isDurationPopupOpen, setIsDurationPopupOpen] = useState<boolean>(false)
  const [editingDurationActivityId, setEditingDurationActivityId] = useState<string | null>(null)
  const [newDuration, setNewDuration] = useState<number>(0)

  const [isTravelTimePopupOpen, setIsTravelTimePopupOpen] = useState<boolean>(false)
  const [editingTravelTimeActivityId, setEditingTravelTimeActivityId] = useState<string | null>(null)
  const [newTravelTime, setNewTravelTime] = useState<number>(0)

  const handleNoteClick = (activityId: string, note: string) => {
    setEditingNoteId(activityId)
    setNoteValue(note)
    setIsPopupOpen(true)

    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    });
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNoteValue(e.target.value)
  }
  
  const handleNoteSave = async () => {
    if (editingNoteId) {
      await saveNote(editingNoteId)
      setIsPopupOpen(false)
    }
  }

  const handleNoteCancel = () => {
    setIsPopupOpen(false)
    setEditingNoteId(null)
  }

  const saveNote = async (activityId: string) => {
    try {
      const updatedNote = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        place: { activityId, note: noteValue },
      }
  
      // update to DataBase
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateNote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNote),
      })

      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.statusText}`)
      }

      // Update the note in the local state
      setDaysActivities((prev) => {
        const newDays = [...prev]
        newDays[currentDayIndex] = newDays[currentDayIndex].map((activity) =>
          activity.id === activityId ? { ...activity, note: noteValue } : activity
        )
        return newDays
      })

      setEditingNoteId(null)
    } catch (error) {
      console.error("Error updating note:", error)
    }
  }

  const handleRecommendDurationChange = async (activityId: string, newDuration: number) => {

    // api
    try {
      const updatedNote = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        place: { activityId, recommendDuration: newDuration },
      }
  
      // update to DataBase
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateDuration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNote),
      })

      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating note:", error)
    }

    // socket
    const updatedActivities = [...daysActivities];
    updatedActivities[currentDayIndex] = updatedActivities[currentDayIndex].map((act) =>
      act.id === activityId
        ? { ...act, recommendDuration: newDuration }
        : act
    );
    setDaysActivities(updatedActivities);
    socketRef.current?.emit("update_duration", {
      roomId,
      dayIndex: currentDayIndex,
      activityId,
      recommendDuration: newDuration,
    });
  };

  const handleCommutingTimeChange = async (activityId: string, newCommutingTime: number) => {
    // api
    try {
      const updatedCommutingTime = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        place: { activityId, commutingTime: newCommutingTime },
      }
  
      // update to DataBase
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateCommutingTime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCommutingTime),
      })
  
      if (!response.ok) {
        throw new Error(`Failed to update commuting time: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating commuting time:", error)
    }
  
    // socket
    const updatedActivities = [...daysActivities]
    updatedActivities[currentDayIndex] = updatedActivities[currentDayIndex].map((act) =>
      act.id === activityId ? { ...act, commutingTime: newCommutingTime } : act
    )
    setDaysActivities(updatedActivities)
    socketRef.current?.emit("update_commuting_time", {
      roomId,
      dayIndex: currentDayIndex,
      activityId,
      commutingTime: newCommutingTime,
    })
  }

  const toggleDescription = (activityId: string) => {
    setDescriptionActivityId((prevId) => (prevId === activityId ? null : activityId))
  }

  const handleDurationClick = (activityId: string, duration: number) => {
    setEditingDurationActivityId(activityId)
    setNewDuration(duration)
    setIsDurationPopupOpen(true)

    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    });
  }

  const handleTravelTimeClick = (activityId: string, travelTime: number) => {
    setEditingTravelTimeActivityId(activityId)
    setNewTravelTime(travelTime)
    setIsTravelTimePopupOpen(true)

    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    });
  }

  const handleDurationSave = async () => {
    if (editingDurationActivityId) {
      await handleRecommendDurationChange(editingDurationActivityId, newDuration)
      setIsDurationPopupOpen(false)
    }
  }

  const handleCommutingTimeSave = async () => {
    if (editingTravelTimeActivityId) {
      await handleCommutingTimeChange(editingTravelTimeActivityId, newTravelTime)
      setIsTravelTimePopupOpen(false)
    }
  }

  const handleTravelTimeChange = async (activityId: string, newTravelTime: number) => {
    // api
    try {
      const updatedTravelTime = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        place: { activityId, travelTime: newTravelTime },
      }

      // update to DataBase
      const response = await fetch(`${BACKEND_URL}/api/addactivity/updateTravelTime`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTravelTime),
      })

      if (!response.ok) {
        throw new Error(`Failed to update travel time: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating travel time:", error)
    }

    // socket
    const updatedActivities = [...daysActivities]
    updatedActivities[currentDayIndex] = updatedActivities[currentDayIndex].map((act) =>
      act.id === activityId ? { ...act, travelTime: newTravelTime } : act
    )
    setDaysActivities(updatedActivities)
    socketRef.current?.emit("update_travel_time", {
      roomId,
      dayIndex: currentDayIndex,
      activityId,
      travelTime: newTravelTime,
    })
  }

  useEffect(() => {
    if (itinerary && itinerary.days && itinerary.days.length > 0) {
      setDaysActivities(  // 根據 order 排序活動
        itinerary.days.map((day) => {
          return day.activities
            ? day.activities.sort((a, b) => a.order - b.order)
            : []
        })
      )
    }
  }, [itinerary, heyUpdateData])

  useEffect(() => {
    const socket = io(`${BACKEND_URL}/`, { withCredentials: true })
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("Connected to socket server")
      socket.emit("join_room", {roomId})
    })

    socket.on("room_user_joined", (user: User) => {
      if (auth?.user?.id === user.id) {
        toast({
          title: `${user.email.split('@')[0]} joined room`,
        })
      }
    })

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
      }
    )

    return () => {
      socket.disconnect()
    }
  }, [roomId])

  if (isLoading) return <div>Loading...</div>

  // 確保 itinerary 和 days 存在
  if (!itinerary || !itinerary.days) {
    console.log("No itinerary data available", itinerary)
    return <div>No itinerary data available</div>
  }

  // 目前選擇的 day activities
  const currentDayIndex = parseInt(selectedDayIndex, 10)
  const currentActivities = daysActivities[currentDayIndex] || []
  
  // 當重新排序時觸發
  const handleReorder = (newOrder: Itinerary["days"][number]["activities"]) => {
    setDaysActivities((prev) => {
      const newDays = [...prev]
      newDays[currentDayIndex] = newOrder
      return newDays
    })
    socketRef.current?.emit("reorder_event", {
      roomId,
      reorderData: {
        dayIndex: currentDayIndex,
        activities: newOrder,
      },
    })
  }

  // Reorder 後保存
  const saveMails = async () => {
    try {
      //console.log("currentActivities: " + JSON.stringify(currentActivities));

      // 新增 id 和 days
      const updatedActivities = {
        itineraryId: id, // 替換為實際的 id 值
        curDays: selectedDayIndex, // 替換為實際的 days 值
        currentActivities, // 包含原始活動資料
      }

      const response = await fetch(`${BACKEND_URL}/api/addactivity/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updatedActivities }), // Send the mails state
      })

      if (!response.ok) {
        throw new Error(`Failed to save mails: ${response.statusText}`)
      }
      const data = await response.json()
      console.log("Mails saved successfully:", data)
    } catch (error) {
      console.error("Error saving mails:", error)
    }
  }

  // 刪除行程
  const handleDeletePlace = async (activityId: string) => {
    
    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    });

    const updatedPlace = {
      itineraryId: id, // 替換為實際的 id 值
      curDays: selectedDayIndex, // 替換為實際的 days 值
      place: { activityId },
    }

    // delete from DataBase
    const response = await fetch(`${BACKEND_URL}/api/addactivity/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedPlace),
    })
    if (!response.ok) {
      throw new Error("Failed to delete trip")
    }

    // 從 currentActivities 移除該筆資料
    setDaysActivities((prev) => {
      const newDays = [...prev]
      newDays[currentDayIndex] = newDays[currentDayIndex].filter(
        (activity) => activity.id !== activityId
      )
      return newDays
    })
  }

  // 修改每日初始時間
  const handleStartTime = async (newStartTime: string) => {
    const updatedTime = {
      itineraryId: id, // 替換為實際的 id 值
      curDays: selectedDayIndex, // 替換為實際的 days 值
      startTime: newStartTime,
    }

    // delete from DataBase
    const response = await fetch(`${BACKEND_URL}/api/addactivity/updateStartTime`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedTime),
    })
    if (!response.ok) {
      throw new Error("Failed to update StartTime")
    }
  }

  const handleDurationChange = (activityId: string, newDuration: number) => {
    const updatedActivities = [...daysActivities];
    updatedActivities[currentDayIndex] = updatedActivities[currentDayIndex].map((act) =>
      act.id === activityId ? { ...act, recommendDuration: newDuration } : act
    );
    setDaysActivities(updatedActivities);

    // Clear the previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set a new timeout to emit the update_duration event after a delay
    timeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("update_duration", {
        roomId,
        dayIndex: currentDayIndex,
        activityId,
        recommendDuration: newDuration,
      });
    }, 2000);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours > 0 ? `${hours} hr ` : ""}${remainingMinutes} mins`
  }

  const handlePlaceClick = (activity: any) => {
    // 新增 id 和 days
    const place: Place = {
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
      icon: activity.photoUrls[0],
    };
    
    setSelectedPlace(place);
    setZoomLevel(15); // 適當調整地圖縮放層級
  };

  const handleLoadMap = () => {
    setCurrentActivities(currentActivities);
  };

  return (
    <div ref={containerRef} className="p-2 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-1">
        Itinerary: {itinerary.location}
      </h2>
      <p className="text-sm font-semibold text-gray-600 mb-1">
        {itinerary.description}
      </p>

      <div className="flex space-x-2 mb-1">
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

      {/* 顯示出發時間 */}
      <div className="flex items-center mb-2">
        <label htmlFor="start-time" className="mr-2 font-semibold">
          出發時間:
        </label>
        <input
          type="time"
          id="start-time"
          value={itinerary.days[currentDayIndex].startTime || "08:00"}
          onChange={(e) => {
            const newStartTime = e.target.value;
            const updatedDays = [...itinerary.days];
            updatedDays[currentDayIndex].startTime = newStartTime;
            setDaysActivities(updatedDays.map((day) => day.activities));

            // Update the start time of the first activity
            if (currentActivities.length > 0) {
              const firstActivity = currentActivities[0];
              const updatedActivities = [...currentActivities];
              updatedActivities[0] = { ...firstActivity};
              setDaysActivities((prev) => {
                const newDays = [...prev];
                newDays[currentDayIndex] = updatedActivities;
                return newDays;
              });
            }

            handleStartTime(newStartTime);
            socketRef.current?.emit("update_start_time", {
              roomId,
              dayIndex: currentDayIndex,
              startTime: newStartTime,
            });
          }}
          className="px-2 py-1 bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      <Reorder.Group
        axis="y"
        values={currentActivities}
        onReorder={handleReorder}
        className="flex-1 overflow-auto pb-0.5"
      >
        {currentActivities.map((activity, idx) => {
          const previousDurations = currentActivities.slice(0, idx).reduce((acc, act) => acc + act.recommendDuration + act.commutingTime, 0);
          const activityStartTime = calculateNextStartTime(itinerary.days[currentDayIndex].startTime, previousDurations);

          const timeRange = calculateTimeRange(activityStartTime, activity.recommendDuration);

          return (
            <Reorder.Item
              key={activity.id} // 如有 id，可使用 activity.id    // 我也想  但我不知道該去哪裡生個景點ID  XD    // 有id了 讚!
              value={activity}
              className="flex flex-row justify-between items-stretch rounded-lg border p-3 shadow-lg mb-2"
              onDragEnd={() => saveMails()}
              onClick={() => handlePlaceClick(activity)}
              onLoad={() => handleLoadMap()}  // 初始顯示第一筆
            >
              {/* 左側內容 */}
              <div className="flex flex-col flex-1">
                <p>行程 {idx +1}</p>
                <h3 className="text-lg font-semibold leading-6">
                {activity.name}
                </h3>
                <p className="text-xs text-gray-500">📍 {activity.location}</p>
                <p className="text-xs text-gray-500">{timeRange}</p>
                
                

                <div className="mt-auto flex space-x-2 pt-2">
                <button
                  onClick={() => toggleDescription(activity.id)}
                  className={`px-2 py-1 rounded text-xs ${
                  descriptionActivityId === activity.id
                    ? "bg-slate-500 text-white hover:bg-slate-600"
                    : "bg-cyan-700 text-white hover:bg-cyan-800"
                  }`}
                >
                  {descriptionActivityId === activity.id ? "Hide Description" : "Show Description"}
                </button>
                <button
                  onClick={() => handleDeletePlace(activity.id)}
                  className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                >
                  Delete!
                </button>
                </div>
              </div>

              {/* 右側內容 */}
              <div className="flex flex-col items-start justify-between w-40 ml-4">
                {/* 圖片或文字敘述 */}
                {descriptionActivityId === activity.id ? (
                  <div className="text-sm text-gray-600">
                    {activity.description}
                  </div>
                ) : (
                  <img
                    src={activity.photoUrls[0]}
                    alt={activity.name}
                    className="w-full h-20 object-cover rounded-md"
                  />
                )}

                {/* 固定顯示的資訊 */}
                <div className="mt-2">
                  <span className=" text-gray-500">💡</span>
                  <p
                    className="text-xs text-gray-500 cursor-pointer underline inline"
                    onClick={() => handleNoteClick(activity.id, activity.note)}
                  >
                    {activity.note ? activity.note.slice(0, 8) + "..." : <span className="underline">Edit Note</span>}
                  </p>
                  <div className="flex items-center">
                    <span className=" text-gray-500">⏳</span>
                    <p
                      className="text-xs text-gray-500 cursor-pointer underline inline"
                      onClick={() => handleDurationClick(activity.id, activity.recommendDuration)}
                    >
                      {formatDuration(activity.recommendDuration)}
                    </p>
                  </div>
                  {idx < currentActivities.length - 1 && (
                    <div className="flex items-center">
                      <span className=" text-gray-500">🚗</span>
                      <p
                        className="text-xs text-gray-500 cursor-pointer underline inline"
                        onClick={() => handleTravelTimeClick(activity.id, activity.commutingTime)}
                      >
                        {formatDuration(activity.commutingTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Reorder.Item>
          );
        })}
        <div style={{ height: "50px" }}></div> {/* 占位空間，避免裁切 */}
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
    </div>
  )
}

export { ReorderItinerary }

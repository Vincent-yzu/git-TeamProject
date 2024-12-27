import { useEffect, useRef, useState } from "react"
import { Itinerary } from "@/types/response"
import { Reorder } from "framer-motion"
import { useParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

import { useItinerary } from "@/hooks/use-itinerary"

import { useMapContext } from "./MapContext" // 引入 Context
import NotePopup from "./NotePopup" // 引入 NotePopup

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const ReorderItinerary = () => {
  const [isDescriptionOn, setIsDescriptionOn] = useState<boolean | undefined>(
    false
  )

  const { heyUpdateData } = useMapContext() // 從 Context 中取用 `heyUpdateData`
  const { selectedDayIndex, setSelectedDayIndex } = useMapContext() // 從 Context 中取用 `selectedDayIndex`

  const { id } = useParams()
  const { data: itinerary, isLoading } = useItinerary(
    id as string,
    heyUpdateData
  )

  const [daysActivities, setDaysActivities] = useState<
    Itinerary["days"][number]["activities"][]
  >([])
  //const [selectedDayIndex, setSelectedDayIndex] = useState("0")
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>(id as string)

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState<string>("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [descriptionActivityId, setDescriptionActivityId] = useState<string | null>(null)

  const handleNoteClick = (activityId: string, note: string) => {
    setEditingNoteId(activityId)
    setNoteValue(note)
    setIsPopupOpen(true)
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
      const response = await fetch(`${BACKEND_URL}/api/updateNote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ activityId, note: noteValue }),
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

  const toggleDescription = (activityId: string) => {
    setDescriptionActivityId((prevId) => (prevId === activityId ? null : activityId))
  }

  useEffect(() => {
    if (itinerary && itinerary.days && itinerary.days.length > 0) {
      // 將每一天的 activities 存入 state
      // 根據 order 排序活動
      setDaysActivities(
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
      socket.emit("create_room", roomId)
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
  const handleDeletePlace = async (name: string) => {
    const updatedPlace = {
      itineraryId: id, // 替換為實際的 id 值
      curDays: selectedDayIndex, // 替換為實際的 days 值
      place: { name },
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
        (activity) => activity.name !== name
      )
      return newDays
    })
  }

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
          value={itinerary.days[currentDayIndex].startTime || ""}
          onChange={(e) => {
            const newStartTime = e.target.value
            const updatedDays = [...itinerary.days]
            updatedDays[currentDayIndex].startTime = newStartTime
            setDaysActivities(updatedDays.map((day) => day.activities))
            socketRef.current?.emit("update_start_time", {
              roomId,
              dayIndex: currentDayIndex,
              startTime: newStartTime,
            })
          }}
          className="px-2 py-1 bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      <Reorder.Group
        axis="y"
        values={currentActivities}
        onReorder={handleReorder}
        className="flex-1 overflow-auto"
      >
        {currentActivities.map((activity) => (
          <Reorder.Item
            key={activity.id} // 如有 id，可使用 activity.id    // 我也想  但我不知道該去哪裡生個景點ID  XD    // 有id了 讚!
            value={activity}
            className="flex flex-row justify-between items-stretch rounded-lg border p-3 shadow-lg mb-2"
            onDragEnd={() => saveMails()}
          >
            {/* 左側內容 */}
            <div className="flex flex-col flex-1">
              <p>行程 {activity.order + 1}</p>
              <h3 className="text-lg font-semibold leading-6">
              {activity.name}
              </h3>
              <p className="text-xs text-gray-500">📍 {activity.location}</p>
              
              {/* 這行是示範，之後要拿掉 */}
              <p className="text-xs text-gray-500">12:00 - 14:00</p>
              {/* 下面處理的邏輯是用前一個行程最後的時間，加上在該行程停留的時間，顯示的樣子會像上面 12:00 - 14:00 那樣 */}
              {/* <p className="text-xs text-gray-500">
              {activity.startTime} -{" "}
              {new Date(
                new Date(`1970-01-01T${activity.startTime}Z`).getTime() +
                activity.recommendDuration * 60000
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p> */}

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
                onClick={() => handleDeletePlace(activity.name)}
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
                  <input
                  type="number"
                  value={activity.recommendDuration}
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value, 10)
                    const updatedActivities = [...daysActivities]
                    updatedActivities[currentDayIndex] = updatedActivities[
                    currentDayIndex
                    ].map((act) =>
                    act.id === activity.id
                      ? { ...act, recommendDuration: newDuration }
                      : act
                    )
                    setDaysActivities(updatedActivities)
                    socketRef.current?.emit("update_duration", {
                    roomId,
                    dayIndex: currentDayIndex,
                    activityId: activity.id,
                    recommendDuration: newDuration,
                    })
                  }}
                  className="w-14 px-2 py-1 bg-transparent border-b border-gray-400 focus:outline-none focus:border-blue-500 text-xs"
                  />
                  <span className="text-xs text-gray-500 ml-1">mins</span>
                </div>
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Buttons Container */}
      <div className="mt-auto flex justify-end space-x-4">
        <button
          onClick={() => saveMails()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save!
        </button>
        <button
          onClick={() => console.log("Cancel")}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cancel
        </button>
      </div>
      {isPopupOpen && (
        <NotePopup
          noteValue={noteValue}
          onChange={handleNoteChange}
          onSave={handleNoteSave}
          onCancel={handleNoteCancel}
        />
      )}
    </div>
  )
}

export { ReorderItinerary }

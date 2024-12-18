import { useEffect, useRef, useState } from "react"
import { Itinerary } from "@/types/response"
import { Reorder } from "framer-motion"
import { useParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"
import { useItinerary } from "@/hooks/use-itinerary"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const ReorderItinerary = () => {
  const { id } = useParams()
  const { data: itinerary, isLoading } = useItinerary(id as string)

  const [daysActivities, setDaysActivities] = useState<
    Itinerary["days"][number]["activities"][]
  >([])
  const [selectedDayIndex, setSelectedDayIndex] = useState("0")
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>(id as string)

  useEffect(() => {
    if (itinerary && itinerary.days && itinerary.days.length > 0) {
      // 將每一天的 activities 存入 state
      setDaysActivities(itinerary.days.map((day) => day.activities || []))
    }
  }, [itinerary])

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
  const handleReorder = (
    newOrder: Itinerary["days"][number]["activities"]
  ) => {
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

  return (
    <div ref={containerRef} className="p-2">
      <h2 className="text-xl font-bold mb-2">Itinerary: {itinerary.location}</h2>
      <p className="text-sm font-semibold text-gray-600 mb-2">
        {itinerary.description}
      </p>

      {/* 使用 button 取代 Tabs */}
      <div className="flex space-x-2 mb-4">
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

      {/* 顯示目前選擇的 day 的行程列表 */}
      <Reorder.Group
        axis="y"
        values={currentActivities}
        onReorder={handleReorder}
      >
        {currentActivities.map((activity) => (
          <Reorder.Item
            key={activity.name} // 如有 id，可使用 activity.id
            value={activity}
            className="flex flex-col gap-2 rounded-lg border p-4 shadow-lg mb-2"
          >
            <img
              src={activity.photoUrls[0]}
              alt={activity.name}
              className="w-full h-32 object-cover rounded-md"
            />
            <h3 className="text-lg font-semibold">{activity.name}</h3>
            <p className="text-sm text-gray-600">{activity.description}</p>
            <p className="text-xs text-gray-500">📍 {activity.location}</p>
            <span className="text-xs">⏳ {activity.recommendDuration} min</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

export { ReorderItinerary }

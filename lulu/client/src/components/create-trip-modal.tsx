import React, { FC } from "react"
import { useNavigate } from "react-router-dom" // 引入 useNavigate
import { useAuth } from "@/hooks/use-auth"
import { fetcher } from "@/lib/fetcher"
import { useToast } from "@/hooks/use-toast"

interface CreateTripModalProps {
  isOpen: boolean
  tripName: string
  startDate: string
  endDate: string
  destination: string
  onClose: () => void
  setTripName: (value: string) => void
  setStartDate: (value: string) => void
  setEndDate: (value: string) => void
  setDestination: (value: string) => void
}

export const CreateTripModal: FC<CreateTripModalProps> = ({
  isOpen,
  tripName,
  startDate,
  endDate,
  destination,
  onClose,
  setTripName,
  setStartDate,
  setEndDate,
  setDestination,
}) => {
  const { data: auth } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // check
  if (!isOpen) return null

  // create new Trip
  const createTrip = async () => {
    // check
    if (!auth?.user) {
      navigate("/sign-in")
    }

    // call api
    try {
      const trip = {
        location: destination,
        startDate: startDate,
        endDate: endDate,
        description: tripName,
      }

      // Check if startDate is before endDate
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start > end) {
        toast({
          title: "這裡不提供回到過去的時光旅行服務喔！",
          description: "回到過去是不可能的! 請遵守時空安全法則!",
        })
        return
      }

      const response = await fetcher("/api/addactivity/creatTrip", {
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trip),
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to create trip: ${response.statusText}`)
      }

      const data = await response.json()

      // alert("行程建立成功！")
      toast({
        title: "行程建立成功！",
        description: "趕快開始安排自己的旅行行程吧!",
      })
      onClose() // 關閉彈窗
      navigate(`/dashboard/${data.id}?destination=${encodeURIComponent(destination)}`)
    } catch (error) {
      console.error("Error creating trip:", error)
      alert("建立行程時出現問題，請稍後再試！")
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 10,
      }}
    >
      <div
        className="modal-content"
        style={{
          position: "relative",
          zIndex: 10,
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "500px",
          margin: "100px auto",
        }}
      >
        <h2>行程設定</h2>
        <form>
          <label>
            行程名稱：
            <input
              type="text"
              placeholder="新行程取個名字吧"
              maxLength={32}
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
            />
          </label>
          <label>
            行程日期：
            <input
              type="date"
              placeholder="出發日"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span> ➔ </span>
            <input
              type="date"
              placeholder="結束日"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <label>
            目的地：
            <input
              type="text"
              placeholder="要去哪裡玩呢"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              className="cancel-trip-button"
              type="button"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="confirm-create-trip-button"
              type="button"
              onClick={createTrip} // 按下按鈕觸發 createTrip
            >
              確定
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

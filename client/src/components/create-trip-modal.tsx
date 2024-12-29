import React, { FC } from "react"
import { useNavigate } from "react-router-dom" // 引入 useNavigate
import { useAuth } from "@/hooks/use-auth"
import { fetcher } from "@/lib/fetcher"

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
      
      const data = await response.json();
      

      alert("行程建立成功！")
      onClose() // 關閉彈窗
      navigate(`/dashboard/${data.id}?destination=${encodeURIComponent(destination)}`);
    } catch (error) {
      console.error("Error creating trip:", error)
      alert("建立行程時出現問題，請稍後再試！")
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
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

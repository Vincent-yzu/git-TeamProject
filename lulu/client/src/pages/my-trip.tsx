import React, { useState } from "react"
import { useNavigate } from "react-router-dom" // 引入 useNavigate

import "./my-trip.css" // 引入樣式檔案

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MyTripPage: React.FC = () => {
  const navigate = useNavigate()
  const [isModalOpen, setModalOpen] = useState(false) // 用於控制彈窗的狀態
  const [isCreateTripModalOpen, setCreateTripModalOpen] = useState(false)
  
  const [tripName, setTripName] = useState("") // 行程名稱
  const [start_date, setStartDate] = useState("") // 開始日期
  const [end_date, setEndDate] = useState("") // 結束日期
  const [destination, setDestination] = useState("") // 目的地

  const handleNavigateToMyTrip = () => {
    navigate("/my-trip")
  }

  const handleNavigateToHome = () => {
    navigate("/home")
  }

  const handleOpenModal = () => {
    setModalOpen(true) // 打開彈窗
  }

  const handleCloseModal = () => {
    setModalOpen(false) // 關閉彈窗
  }

  const handleOpenCreateTripModal = () => {
    setCreateTripModalOpen(true)
  }

  const handleCloseCreateTripModal = () => {
    setCreateTripModalOpen(false)
  }

  const handleConfirmTrip = async () => {
    navigate("/dashboard") // 無論如何，先跳轉至 Dashboard 頁面

  //   const tripData = {
  //     title: tripName, // 使用者輸入的行程名稱
  //     start_date, // 使用者選擇的開始日期
  //     end_date, // 使用者選擇的結束日期
  //     // destination // 使用者輸入的目的地
  //   }
  
  //   try {
  //     // 檢查登錄狀態
  //     const isLoggedIn = await checkLoginStatus()
  //     if (!isLoggedIn) {
  //       alert("請先登入！")
  //       navigate("/sign-in", { state: { redirectTo: "/dashboard" } }) // 跳转到登录页面并保存目标页面
  //       return
  //     }

  //     // 提交資訊
  //     const response = await fetch(`${BACKEND_URL}/api/add???`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(tripData),
  //     })
  
  //     if (response.ok) {
  //       navigate("/dashboard") // 跳轉至 Dashboard 頁面
  //     } else {
  //       console.error("提交失敗", await response.text())
  //       navigate("/dashboard") // 無論如何，先跳轉至 Dashboard 頁面
  //       alert("提交失敗，請稍後再試！")
  //     }
  //   } catch (error) {
  //     console.error("提交出錯", error)
  //     navigate("/dashboard") // 無論如何，先跳轉至 Dashboard 頁面
  //     alert("提交出錯，請稍後再試！")
  //   }
  }

  const checkLoginStatus = async () => {
    try {
      const response = await fetch("/api/user/status", {
        method: "GET",
        credentials: "include", // 攜帶 cookies
      })
  
      if (response.ok) {
        const data = await response.json()
        return data.isLoggedIn
      } else if (response.status === 401) {
        return false // 未登录
      } else {
        console.error("Unexpected response", await response.text())
        return false
      }
    } catch (error) {
      console.error("Error checking login status", error)
      return false
    }
  }

  React.useEffect(() => {
    // 按下 Esc 鍵關閉彈窗
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseModal()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div className="my-trip-page">
      <header className="header">
        <button className="logo-button" onClick={handleNavigateToHome}>
          <img src="/img/logl.png" alt="Logo" className="logo-image" />
        </button>
        <div className="menu">
          <button className="my-trip-button" onClick={handleNavigateToMyTrip}>
            我的行程
          </button>
          <div className="profile-icon"></div>
          <div className="hamburger-menu"></div>
        </div>
      </header>
      <main className="main-content">
        <h1 className="page-title">我的行程</h1>
        <div className="tabs">
          <button className="tab active">個人</button>
          <button className="tab">群組</button>
        </div>
        <div className="trip-placeholder">
          <div className="placeholder-image">
            <img src="/img/null.png" alt="null" className="null-image" />
          </div>
          <p className="placeholder-text">還沒有行程，現在就開始安排！</p>
          <button className="create-trip-button" onClick={handleOpenModal}>
            建立新行程
          </button>
        </div>
      </main>
      {/* 彈出視窗：範本選擇 */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>選擇行程範本</h2>
            <ul className="trip-options">
              <li>
                <button
                  className="option-button"
                  onClick={handleOpenCreateTripModal}
                >
                  <img
                    src="/img/plus.png"
                    alt="Create"
                    className="option-icon"
                  />
                  <span>自建行程</span>
                </button>
              </li>
              <li>
                <button className="option-button">
                  <img
                    src="/img/sample1.png"
                    alt="Sample 1"
                    className="option-icon"
                  />
                  <span>宜蘭上下海三天兩夜</span>
                </button>
              </li>
              <li>
                <button className="option-button">
                  <img
                    src="/img/sample2.png"
                    alt="Sample 2"
                    className="option-icon"
                  />
                  <span>蘭嶼海龜共游潛水套裝五天四夜</span>
                </button>
              </li>
              <li>
                <button className="option-button">
                  <img
                    src="/img/sample3.png"
                    alt="Sample 3"
                    className="option-icon"
                  />
                  <span>京阪良六天五夜自由行</span>
                </button>
              </li>
              <li>
                <button className="option-button">
                  <img
                    src="/img/sample4.png"
                    alt="Sample 4"
                    className="option-icon"
                  />
                  <span>首爾私房景點四天三夜</span>
                </button>
              </li>
              <li>
                <button className="option-button">
                  <img
                    src="/img/sample5.png"
                    alt="Sample 5"
                    className="option-icon"
                  />
                  <span>曼谷嗨翻天五天四夜自由行</span>
                </button>
              </li>
            </ul>
            <button className="cancel-button" onClick={handleCloseModal}>
              取消
            </button>
          </div>
        </div>
      )}
      {/* 彈出視窗：自建行程 */}
      {isCreateTripModalOpen && (
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
                  value={tripName} // 綁定行程名稱狀態
                  onChange={(e) => setTripName(e.target.value)} // 更新行程名稱狀態
                />
              </label>
              <label>
                行程日期：
                <input 
                  type="date" 
                  placeholder="出發日"
                  value={start_date} // 綁定開始日期狀態
                  onChange={(e) => setStartDate(e.target.value)} // 更新開始日期狀態 
                />
                <span> ➔ </span>
                <input 
                  type="date" 
                  placeholder="結束日"
                  value={end_date} // 綁定結束日期狀態
                  onChange={(e) => setEndDate(e.target.value)} // 更新結束日期狀態
                />
              </label>
              <label>
                目的地：
                <input
                  type="text"
                  placeholder="要去哪裡玩呢"
                  value={destination} // 綁定目的地狀態
                  onChange={(e) => setDestination(e.target.value)} // 更新目的地狀態 
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
                  onClick={handleCloseCreateTripModal}
                >
                  取消
                </button>
                <button className="confirm-create-trip-button" onClick={handleConfirmTrip}>
                  確定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTripPage

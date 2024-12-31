import React, { useState } from "react"
import { useNavigate } from "react-router-dom" // 引入 useNavigate

import { SidebarProvider } from "@/components/ui/sidebar"
import { fetcher } from "@/lib/fetcher"

import "./my-trip.css" // 引入樣式檔案

import { useAuth } from "@/hooks/use-auth"
import { useItineraries } from "@/hooks/use-itineraries"
import ItineraryForm from "@/components/itinerary-form"
import { NavUser } from "@/components/nav-user"
import { CreateTripModal } from "@/components/create-trip-modal"
import { DeleteTripModal } from "@/components/delete-trip"

import { useMutation } from "@tanstack/react-query";
// import { toast } from 'react-toastify';
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query";

const MyTripPage: React.FC = () => {
  const { data: auth } = useAuth()
  const navigate = useNavigate()
  if (!auth?.user) {
    navigate("/sign-in")
  }

  const { data: itineraries, isLoading } = useItineraries()
  const [isModalOpen, setModalOpen] = useState(false) // 用於控制彈窗的狀態
  const [isCreateTripModalOpen, setCreateTripModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // new 
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [email, setEmail] = useState("")

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

  const handleDeleteOpenModal = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    setIsDeleteOpen(true);
  }
  const handleDeleteCloseModal = () => {
    setIsDeleteOpen(false);
    setSelectedItineraryId(null)
  }

  // new
  const handleOpenAddMemberModal = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId)
    setAddMemberModalOpen(true)
  }

  const handleCloseAddMemberModal = () => {
    setAddMemberModalOpen(false)
    setSelectedItineraryId(null)
  }

  const handleAddMember = async () => {
    // find userID by email
    
    let userID = ""

    try {
      console.log('email:', email);
      const response = await fetcher(`/api/user/findUserID?email=${email}`, {
        options: {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      });
  
      const result = await response.json();
      if (result.success) {
        userID = result.userID
        console.log('userID:', userID);
        // add userID to itinerary
        try {
          const response = await fetcher(`/api/itinerary/addMember/${selectedItineraryId}/${userID}`, {
            options: {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }, // Optional if no body is sent
            }
          });
        
          if (response.status === 204) {
            console.log('Member added successfully');
          } else {
            const result = await response.json();
            console.error('Failed to add member:', result.message);
          }
        } catch (error) {
          console.error('Error adding member:', error);
        }

      } else {
        console.error('Failed to find userID:', result.message);
      }
    } catch (error) {
      console.error('Error finding userID:', error);
    }  

    // try {
    //   const response = await fetch(`/api/itineraries/${selectedItineraryId}`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email }),
    //   });
  
    //   const result = await response.json();
    //   if (result.success) {
    //     console.log('Member added successfully');
    //   } else {
    //     console.error('Failed to add member:', result.message);
    //   }
    // } catch (error) {
    //   console.error('Error adding member:', error);
    // }

    setAddMemberModalOpen(false)
    
  }

  // TODO:
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const handleRecommendedTrip = useMutation({
    
    mutationFn: async (variables: { itineraryId: string, userID: string }) => {
      try {
        const response = await fetcher(`/api/itinerary/recommended/${variables.itineraryId}/${variables.userID}`, {
          options: {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        });
        if (!response.ok) {
          console.log('QQQQQQQQ Failed to recommend trip');
          throw new Error('Failed to recommend trip');
        } else {
          console.log('QQQQQQQQ Successfully recommend trip');
          // return response.json();
        }
        return response.json();
      } catch (error) {
        throw new Error(error.message || 'Error adding recommended trip');
      }
    },
    onSuccess: async (data) => {
      if (data.success) {
        toast({
          title: "Recommended Trip Added Successfully!",
          description: "You can now access the recommended itinerary.",
        });
        
        if (data.itineraryId) {
          // Wait for queries to invalidate
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['itinerary', data.itineraryId] }),
            queryClient.invalidateQueries({ queryKey: ['user', data.userID] })
          ]);
          
          // Small delay to ensure everything is updated
          setTimeout(() => {
            navigate(`/dashboard/${data.itineraryId}`);
          }, 100);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Something went wrong.",
        description: error.message || "Please try again.",
      });
    },
  });
  // const handleRecommendedTrip = async (itineraryId: string, userID: string) => {
  //   // const queryClient = useQueryClient();
  //   try {
  //     console.log(itineraryId, userID);
  //     const response = await fetcher(`/api/itinerary/recommended/${itineraryId}/${userID}`, {
  //       options: {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //       }
  //     });
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       console.error('Failed to recommend trip:', errorText);
  //       alert('Failed to recommend trip: ' + errorText);
  //       return;
  //     }
  //     const result = await response.json();
  //     if (result.success) {
  //       console.log('Adding recommended trip successfully');
  //       alert('Adding recommended trip successfully');
  //       // Invalidate the relevant queries
  //       // queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
  //       // queryClient.invalidateQueries({ queryKey: ['user', userID] });
  //       navigate(`/dashboard/${itineraryId}`);
  //     } else {
  //       console.error('Failed to add recommend trip:', result.message);
  //       alert('Failed to add recommend trip');
  //     }
  //   } catch (error) {
  //     console.error('Error adding recommending trip:', error);
  //     alert('Error adding recommending trip');
  //   }
  // }

  const handleConfirmTrip = async () => {
    // navigate("/dashboard") // 無論如何，先跳轉至 Dashboard 頁面
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

  if (isLoading) return null
  // console.log(itineraries)

  return (
    <SidebarProvider>
      <div className="my-trip-page">
        <header className="header mb-2">
          <button className="logo-button" onClick={handleNavigateToHome}>
            <img src="/img/logl.png" alt="Logo" className="logo-image" />
          </button>
          <div className="menu">
            <button className="my-trip-button" onClick={handleNavigateToMyTrip}>
              我的行程
            </button>
            {auth?.user ? <NavUser user={auth.user} /> : null}
          </div>
        </header>
        <main className="main-content flex flex-col h-full" style={{ backgroundColor: "#f5f5f5" }}>
          <h1 className="page-title">我的行程</h1>
          <div className="tabs container items-center mx-auto px-4 flex justify-between">
            <div>
              <div className="flex items-center gap-4 justify-center">
                <button
                  className="create-trip-button"
                  onClick={handleOpenModal}
                >
                  建立新行程
                </button>
                <ItineraryForm />
              </div>
              </div>
          </div>
          <div className="container mx-auto px-4">
            <div className="trip-placeholder">
              {!itineraries || itineraries.length === 0 ? (
                <>
                  <div className="placeholder-image">
                    <img
                      src="/img/null.png"
                      alt="null"
                      className="null-image"
                    />
                  </div>
                  <p className="placeholder-text">
                    還沒有行程，現在就開始安排！
                  </p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-6">
                    {itineraries.map((itinerary) => {
                      return (
                        <div
                          key={itinerary.id}  // Add the `key` prop here
                          className="flex flex-col gap-2 items-center cursor-pointer"
                          onClick={() => navigate(`/dashboard/${itinerary.id}`)}
                        >
                          <div className="relative w-full">
                            <img
                              src={
                                itinerary.days?.[0]?.activities?.[0]
                                  ?.photoUrls?.[0]
                              }
                              alt={
                                itinerary.days?.[0]?.activities?.[0]?.description
                              }
                              className="w-full h-full aspect-video object-cover rounded-md"
                            />
                            <button
                              className="absolute top-0 right-0 m-2 bg-white p-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteOpenModal(itinerary.id)
                              }}
                            >
                               X
                            </button>
                            <button
                              className="absolute top-0 right-6 m-2 bg-white p-1 rounded"
                              onClick={(e) => {
                                console.log("itinerary id is :", itinerary.id)
                                e.stopPropagation()
                                handleOpenAddMemberModal(itinerary.id)
                              }}
                            >
                              添加成員
                            </button>
                          </div>
                          <h3 className="text-lg font-semibold">
                            {itinerary.location +
                              " " +
                              ((new Date(itinerary.endDate).getTime() -
                                new Date(itinerary.startDate).getTime()) /
                                (1000 * 60 * 60 * 24) +
                                1) +
                              "天" +
                              (new Date(itinerary.endDate).getTime() -
                                new Date(itinerary.startDate).getTime()) /
                              (1000 * 60 * 60 * 24) +
                              "夜之旅"}
                          </h3>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
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
                  <button 
                    className="option-button"
                    // TODO: add recommended trip
                    onClick={() => handleRecommendedTrip.mutate({ itineraryId: '3ASFvu7DZcYTwrvzNV8Hk', userID: auth.user.id })}
                  >
                    <img
                      src="/img/sample1.png"
                      alt="Sample 1"
                      className="option-icon"
                    />
                    <span>美國德州三天兩夜</span>
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

        {/* 彈出視窗：刪除行程 */}
        {isDeleteOpen && (
          <DeleteTripModal
            isOpen = {isDeleteOpen}
            itineraryId = {selectedItineraryId!}
            onClose={handleDeleteCloseModal}
          />
        )}
        {/* 彈出視窗：自建行程 */}
        {isCreateTripModalOpen && (
          <CreateTripModal
            isOpen={isCreateTripModalOpen}
            tripName={tripName}
            startDate={start_date}
            endDate={end_date}
            destination={destination}
            onClose={handleCloseCreateTripModal}
            setTripName={setTripName}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setDestination={setDestination}
          />
        )}
        {/* 彈出視窗：添加成員 */}
        {isAddMemberModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>添加新成員</h2>
              <input
                type="email"
                placeholder="輸入電子郵件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  className="cancel-button"
                  type="button"
                  onClick={handleCloseAddMemberModal}
                >
                  取消
                </button>
                <button
                  className="confirm-button"
                  onClick={handleAddMember}
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  )
}

export default MyTripPage

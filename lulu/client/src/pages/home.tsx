import React from "react"
import { useNavigate } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"

import "./home.css"

import { useItinerariesRecommended } from "@/hooks/use-itineraries"
import Header from "@/components/header"


const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: itineraries, isLoading } = useItinerariesRecommended()
  // const { data: auth } = useAuth()

  if (isLoading) return null
  console.log(itineraries)

  const handleNavigateToMyTrip = () => {
    navigate("/my-trip")
  }

  return (
    <SidebarProvider> {/* 包裹 HomePage */}
      <div className="home-page">
        <Header /> {/* 使用 Header */}
        <main className="main-content">
          <div className="hero-section">
            <div className="button-container">
              <div className="action-buttons">
                <button
                  className="start-planning-button"
                  onClick={handleNavigateToMyTrip}
                >
                  開始規劃
                </button>
                <button className="explore-ideas-button">探索靈感</button>
              </div>
            </div>
          </div>
          <section className="recommendation-section">
            <h2>推薦行程</h2>
            <div className="recommendations">
              <>
                {itineraries ? (
                  <div className="grid grid-cols-3 gap-6">
                    {itineraries.map((itinerary, index) => {
                      return (
                        <div key={index} className="flex flex-col gap-2">
                            <img
                              src={
                                itinerary.days?.[0]?.activities?.[0]
                                  ?.photoUrls?.[0]
                              }
                              alt={
                                itinerary.days?.[0]?.activities?.[0]
                                  ?.description
                              }
                              className="w-full h-full aspect-video object-cover rounded-md"
                            />

                            <h3 className="text-lg font-semibold">
                              {itinerary.location +
                                " " +
                                ((new Date(itinerary.endDate).getTime() -
                                  new Date(itinerary.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24) + 1) +
                                "天" +
                                ((new Date(itinerary.endDate).getTime() -
                                  new Date(itinerary.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)) +
                                "夜之旅"}
                            </h3>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <></>
                )}
              </>
            </div>
          </section>
        </main>
      </div>
    </SidebarProvider>
  )
}

export default HomePage

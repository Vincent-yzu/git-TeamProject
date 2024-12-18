import React from "react"
import { useNavigate } from "react-router-dom"

import "./home.css"

import { useItinerariesRecommended } from "@/hooks/use-itineraries"

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: itineraries, isLoading } = useItinerariesRecommended()
  if (isLoading) return null
  console.log(itineraries)

  const handleNavigateToMyTrip = () => {
    navigate("/my-trip")
  }

  const handleNavigateToHome = () => {
    navigate("/home")
  }

  return (
    <div className="home-page">
      <header className="header">
        {/* Logo 按鈕 */}
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
                  {itineraries.map((itinerary) => {
                    const num1 = getRandomInt(
                      0,
                      itinerary.days[0].activities.length - 1
                    )
                    const num2 = getRandomInt(
                      0,
                      itinerary.days[0].activities[num1].photoUrls.length - 1
                    )
                    return (
                      <div className="flex flex-col gap-2">
                          <img
                            src={
                              itinerary.days?.[0]?.activities?.[num1]
                                ?.photoUrls?.[num2]
                            }
                            alt={
                              itinerary.days?.[0]?.activities?.[num1]
                                ?.description
                            }
                            className="w-full h-full aspect-video object-cover rounded-md"
                          />

                          <h3 className="text-lg font-semibold">
                            {itinerary.location +
                              " " +
                              (new Date(itinerary.endDate).getTime() -
                                new Date(itinerary.startDate).getTime()) /
                                (1000 * 60 * 60 * 24) +
                              "天" +
                              ((new Date(itinerary.endDate).getTime() -
                                new Date(itinerary.startDate).getTime()) /
                                (1000 * 60 * 60 * 24) -
                                1) +
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
  )
}

export default HomePage

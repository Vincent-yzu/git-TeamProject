import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateToMyTrip = () => {
    navigate("/my-trip");
  };

  const handleNavigateToHome = () => {
    navigate("/home");
  };

  return (
    <div className="home-page">
      <header className="header">
        {/* Logo 按鈕 */}
        <button className="logo-button" onClick={handleNavigateToHome}>
          <img src="/img/logl.png" alt="Logo" className="logo-image"/>
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
            {[...Array(5)].map((_, index) => (
              <div key={index} className="recommendation-card"></div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;

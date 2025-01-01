import React from "react"
import { useNavigate } from "react-router-dom"
import { NavUser } from "@/components/nav-user"
import { NavGuest } from "../components/nav-guest"
import { useAuth } from "@/hooks/use-auth"
import { SidebarProvider } from "@/components/ui/sidebar"

import "./header.css"

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { data: auth } = useAuth()

  const handleNavigateToMyTrip = () => {
    navigate("/my-trip")
  }

  const handleNavigateToHome = () => {
    navigate("/home")
  }

  return (
    <SidebarProvider showNormalHeight={true}>
        <header className="header">
          {/* Logo 按鈕 */}
          <button className="logo-button" onClick={handleNavigateToHome}>
              <img src="/img/logl.png" alt="Logo" className="logo-image" />
          </button>

          <div className="menu">
              <button className="my-trip-button" onClick={handleNavigateToMyTrip}>
              我的行程
              </button>
              {auth?.user ? <NavUser user={auth.user} /> : <NavGuest />}
          </div>
        </header>
    </SidebarProvider>
  )
}

export default Header
import { useAuth } from "@/hooks/use-auth"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AttractionDetail } from "@/components/attraction-detail"
import { DisplayMap } from "@/components/displaymap"
import { MapProvider } from "@/components/MapContext" // 引入 Context
import { useParams, useNavigate, useSearchParams  } from "react-router-dom"
import Header from "@/components/header" // 引入 Header 組件
import React from "react"
import { ChatBox } from "@/components/chat-box"

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const destination = searchParams.get("destination") || "";
  const { data: auth } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  if (!auth?.user) {
    navigate("/sign-in")
  }

  if (!id) {
    navigate("/my-trip")
  }

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <>
      <Header /> {/* 加入 Header 組件 */}
      <div style={{ marginTop: "3px", backgroundColor: "#fafafa" }}> {/* 增加背景色和高度 */}
        <SidebarProvider
          style={
            {
              "--sidebar-width": "350px",
            } as React.CSSProperties
          }
        >
          <MapProvider>
            <AppSidebar /> {/*文字搜尋欄在裡面*/}
            <AttractionDetail /> {/* 景點詳細資訊 */}
            <SidebarInset>
              {/* <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
              </header> */}
                <div className="flex flex-1 flex-col gap-4 p-4" style={{ backgroundColor: "#fafafa", height: "calc(100vh - 3px)" }}>
                {/* {Array.from({ length: 24 }).map((_, index) => (
                  <div
                  key={index}
                  className="aspect-video h-12 w-full rounded-lg bg-muted/50"
                  />
                ))} */}

                {/* 右側 google map 大地圖 */}
                <ChatBox  />
                <DisplayMap />
                </div>
            </SidebarInset>
          </MapProvider>
        </SidebarProvider>
      </div>
    </>
  )
} 

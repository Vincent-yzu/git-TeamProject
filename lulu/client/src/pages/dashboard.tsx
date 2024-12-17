import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MapProvider  } from "@/components/MapContext"; // 引入 Context
import { DisplayMap } from "@/components/displaymap"
import { AttractionDetail } from "@/components/attraction-detail"
import { SearchBarGoogleMap } from "@/components/searchbar-googlemap"
import { useAuth } from "@/hooks/use-auth"
export default function Dashboard() {
  const { data: auth } = useAuth()
  if (!auth?.user) {
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
     
      <MapProvider>
        <AppSidebar />  {/* 文字搜尋欄在裡面 */}
        <AttractionDetail />  {/* 景點詳細資訊 */}
        <SidebarInset>
          <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Inbox</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {/* {Array.from({ length: 24 }).map((_, index) => (
              <div
                key={index}
                className="aspect-video h-12 w-full rounded-lg bg-muted/50"
              />
            ))} */}
            
            {/* 右側 google map 大地圖 */}
            <DisplayMap />

          </div>
        </SidebarInset>
      </MapProvider>
    </SidebarProvider>
  )
}

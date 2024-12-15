import { useEffect, useRef, useState } from "react"
import { Reorder } from "framer-motion"
import { Socket } from "socket.io-client"
import { useMapContext } from "./MapContext"; // 引入 Context

import { io } from "socket.io-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL


const initialMails: Mail[] = [
  {
    name: "William Smith",
    dwell_time: "09:34 AM",
    formatted_address:
      "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    icon: "",
  },
  {
    name: "Sophia White",
    dwell_time: "1 week ago",
    formatted_address:
      "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
    icon: "",
  },
]

interface Mail {
  name: string
  dwell_time: string
  formatted_address: string
  icon: string
}


const ReorderMails = () => {
  const { addedPlace } = useMapContext(); // 從 Context 中取用 `addedPlace`
  const [mails, setMails] = useState<Mail[]>(initialMails)
  const containerRef = useRef<HTMLDivElement>(null)

  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>("2123")

 
  useEffect(() => {
    if (addedPlace) {
      const updatedMails = [
        {
          name: `${addedPlace.name}`,
          dwell_time: `1小時 | 09:00 ~ 10:00`,
          formatted_address: `地址: ${addedPlace.formatted_address}`,
          icon: `${addedPlace.icon}`,
        },
        ...mails, // 將新資料添加到列表的開頭
      ];
      setMails(updatedMails);
  
      // 同步到伺服器
      socketRef.current?.emit("reorder_event", { roomId, reorderData: updatedMails });
    }
  }, [addedPlace]);
  

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (
        containerRef.current &&
        containerRef.current.contains(e.target as Node)
      ) {
        console.log("Mouse released within child component:", mails)
        // 在使用者完成拖曳動作後，將更新後的資料送往伺服器
        socketRef.current?.emit("reorder_event", { roomId, reorderData: mails })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [mails, roomId])

  const socketClient = io(`${BACKEND_URL}/`, {
    withCredentials: true,
  })
  useEffect(() => {
    
    socketRef.current = socketClient
    const socket = socketRef.current

    socket.on("connect", () => {
      console.log("Connected to socket server:", socket.id)
      // 當使用者進入 dashboard 時建立/加入房間
      socket.emit("create_room", roomId)
    })

    socket.on("room_created", (rid: string) => {
      console.log(`Joined room: ${rid}`)
    })

    // 接收來自伺服器的更新(若有其他使用者重整排序，就同步更新)
    socket.on("reorder_update", (updatedMails: Mail[]) => {
      console.log("Received reorder update:", updatedMails)
      setMails(updatedMails)
    })

    return () => {
      socket.disconnect()
    }
  }, [socketClient])

  // 使用者在前端拖曳重新排序後，只有更新 mails state，不立刻 emit
  const handleReorder = (newOrder: Mail[]) => {
    setMails(newOrder)
    // 不在這裡 emit，改由 handleMouseUp 完成最後的 emit
  }

  return (
    <div ref={containerRef}>
      <Reorder.Group axis="y" values={mails} onReorder={handleReorder}>
        {mails.map((mail) => (
          <Reorder.Item
            key={mail.formatted_address}
            value={mail}
            className="flex cursor-pointer flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {mail.icon && (
              <img
                src={mail.icon}
                alt={mail.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div className="flex w-full items-center gap-2">
              <span>{mail.name}</span>
              <span className="ml-auto text-xs">{mail.dwell_time}</span>
            </div>
            <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
              {mail.formatted_address}
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

export { ReorderMails }

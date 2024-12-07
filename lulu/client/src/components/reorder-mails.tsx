import { useEffect, useRef, useState } from "react"
import { Reorder } from "framer-motion"
import { Socket } from "socket.io-client"

import { io } from "socket.io-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const initialMails: Mail[] = [
  {
    name: "William Smith",
    email: "williamsmith@example.com",
    subject: "Meeting Tomorrow",
    date: "09:34 AM",
    teaser:
      "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
  },
  {
    name: "Alice Smith",
    email: "alicesmith@example.com",
    subject: "Re: Project Update",
    date: "Yesterday",
    teaser:
      "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
  },
  {
    name: "Bob Johnson",
    email: "bobjohnson@example.com",
    subject: "Weekend Plans",
    date: "2 days ago",
    teaser:
      "Hey everyone! I'm thinking of organizing a team outing this weekend.\nWould you be interested in a hiking trip or a beach day?",
  },
  {
    name: "Emily Davis",
    email: "emilydavis@example.com",
    subject: "Re: Question about Budget",
    date: "2 days ago",
    teaser:
      "I've reviewed the budget numbers you sent over.\nCan we set up a quick call to discuss some potential adjustments?",
  },
  {
    name: "Michael Wilson",
    email: "michaelwilson@example.com",
    subject: "Important Announcement",
    date: "1 week ago",
    teaser:
      "Please join us for an all-hands meeting this Friday at 3 PM.\nWe have some exciting news to share about the company's future.",
  },
  {
    name: "Sarah Brown",
    email: "sarahbrown@example.com",
    subject: "Re: Feedback on Proposal",
    date: "1 week ago",
    teaser:
      "Thank you for sending over the proposal. I've reviewed it and have some thoughts.\nCould we schedule a meeting to discuss my feedback in detail?",
  },
  {
    name: "David Lee",
    email: "davidlee@example.com",
    subject: "New Project Idea",
    date: "1 week ago",
    teaser:
      "I've been brainstorming and came up with an interesting project concept.\nDo you have time this week to discuss its potential impact and feasibility?",
  },
  {
    name: "Olivia Wilson",
    email: "oliviawilson@example.com",
    subject: "Vacation Plans",
    date: "1 week ago",
    teaser:
      "Just a heads up that I'll be taking a two-week vacation next month.\nI'll make sure all my projects are up to date before I leave.",
  },
  {
    name: "James Martin",
    email: "jamesmartin@example.com",
    subject: "Re: Conference Registration",
    date: "1 week ago",
    teaser:
      "I've completed the registration for the upcoming tech conference.\nLet me know if you need any additional information from my end.",
  },
  {
    name: "Sophia White",
    email: "sophiawhite@example.com",
    subject: "Team Dinner",
    date: "1 week ago",
    teaser:
      "To celebrate our recent project success, I'd like to organize a team dinner.\nAre you available next Friday evening? Please let me know your preferences.",
  },
]

interface Mail {
  name: string
  email: string
  subject: string
  date: string
  teaser: string
}


const ReorderMails = () => {
  const [mails, setMails] = useState<Mail[]>(initialMails)
  const containerRef = useRef<HTMLDivElement>(null)

  const socketRef = useRef<Socket | null>(null)
  const [roomId] = useState<string>("2123")

 
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
            key={mail.email}
            value={mail}
            className="flex cursor-pointer flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <div className="flex w-full items-center gap-2">
              <span>{mail.name}</span>
              <span className="ml-auto text-xs">{mail.date}</span>
            </div>
            <span className="font-medium">{mail.subject}</span>
            <span className="line-clamp-2 w-[260px] whitespace-break-spaces text-xs">
              {mail.teaser}
            </span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

export { ReorderMails }

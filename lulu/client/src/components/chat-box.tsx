import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

import { User } from "@/types/response"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

interface Message {
  id: string
  content: string
  userId: string
  createdAt: Date
  itineraryId: string
  avatar: string
}

export function ChatBox({ itineraryId }: { itineraryId: string}) {
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const {data: auth} = useAuth()
  const [messages, setMessages] = useState<Message[]>([])

  if (!auth?.user) return null

  useEffect(() => {
    const socket = io(`${BACKEND_URL}/`, { 
      withCredentials: true,
    })

    setSocket(socket)

    // Join room and get initial data
    socket.emit("join_room", { roomId: itineraryId, user: auth.user })

    // Listen for messages
    socket.on("initial_messages", (messages: Message[]) => {
      setMessages(messages)
    })

    socket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    // Listen for user list updates
    socket.on("users_in_room", (users: User[]) => {
      setUsers(users)
    })

    // Cleanup
    return () => {
      socket.disconnect()
    }
  }, [itineraryId, auth.user])


  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit("send_message", { 
        roomId: itineraryId, 
        content: newMessage 
      })
      setNewMessage("")
    }
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.userId === auth.user.id ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`flex ${
                message.userId === auth.user.id ? "flex-row-reverse" : "flex-row"
              } items-end gap-2`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.avatar} />
                <AvatarFallback>{message.userId}</AvatarFallback>
              </Avatar>
              <div
                className={`p-3 rounded-lg ${
                  message.userId === auth.user.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.userId !== "system" && (
                  <div className="text-xs font-medium mb-1">
                    {message.userId}
                  </div>
                )}
                <div className="text-sm">{message.content}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type a message..."
        />
        <Button onClick={handleSendMessage}>Send</Button>
      </div>
    </div>
  )
}

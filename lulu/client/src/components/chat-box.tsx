import { useEffect, useState } from "react"
import { useComments } from "@/hooks/use-comments"
import { io, Socket } from "socket.io-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
interface User {
  id: string
  email: string
  avatar: string
}

interface Message {
  id: string
  content: string
  userId: string
  createdAt: Date
  itineraryId: string
}

export function ChatBox({ itineraryId, user }: { itineraryId: string; user: User }) {
  const { data: comments } = useComments(itineraryId)
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const [users, setUsers] = useState<User[]>([])

  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const socket = io(`${BACKEND_URL}/`, { 
      withCredentials: true,
      auth: { user }
    })

    setSocket(socket)

    // Join room and get initial data
    socket.emit("join_room", { roomId: itineraryId, user })

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
  }, [itineraryId, user])

  useEffect(() => {
    // Initialize with existing comments
    if (comments) {
      setMessages(
        comments.map((comment) => ({
          ...comment,
          user: users.find((u) => u.id === comment.userId) || {
            id: comment.userId,
            name: "Unknown",
            photo: "",
          },
        }))
      )
    }
  }, [comments, users])

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
              message.userId === user.id ? "justify-end" : "justify-start"
            } mb-4`}
          >
            <div
              className={`flex ${
                message.userId === user.id ? "flex-row-reverse" : "flex-row"
              } items-end gap-2`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.photo} />
                <AvatarFallback>{message.user.name[0]}</AvatarFallback>
              </Avatar>
              <div
                className={`p-3 rounded-lg ${
                  message.userId === user.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.userId !== "system" && (
                  <div className="text-xs font-medium mb-1">
                    {message.user.name}
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

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useAuth } from "@/hooks/use-auth"
import { useCollaborateUser } from "@/hooks/use-collaborate-user"
import { useComments } from "@/hooks/use-comments"
import { useParams } from "react-router-dom"
import { User } from "@/types/response"

// ------- 新增 dayjs 相關 ------
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
dayjs.extend(relativeTime)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

interface Message {
  id: string
  content: string
  userId: string
  createdAt: Date
  itineraryId: string
}

interface CommentData {
  id: string
  content: string
  userId: string
  createdAt: string
  itineraryId: string
}

export function ChatBox() {
  const [newMessage, setNewMessage] = useState("")
  const socketRef = useRef<Socket | null>(null)
  const { data: auth } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const { id } = useParams()
  const { data: users } = useCollaborateUser(id as string)
  const { data: comments } = useComments(id as string)

  // 用來在訊息列表底部放一個空的 div
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const getUserInfo = (userId: string) => {
    const foundUser = users?.find((user: User) => user.id === userId)
    const displayName = foundUser?.email
      ? foundUser.email.split("@")[0]
      : "Unknown User"

    return {
      image: foundUser?.image || "https://github.com/shadcn.png",
      displayName,
    }
  }

  const toMessage = (comment: CommentData): Message => ({
    id: comment.id,
    content: comment.content,
    userId: comment.userId,
    createdAt: new Date(comment.createdAt),
    itineraryId: comment.itineraryId,
  })

  useEffect(() => {
    if (!auth?.user) return

    if (!socketRef.current) {
      const newSocket = io(`${BACKEND_URL}`, { withCredentials: true, path: '/api/socket.io' })

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id)
        newSocket.emit("join_room", { roomId: id as string })
      })

      newSocket.on("new_message", (message: Message) => {
        console.log("New message:", message)
        setMessages((prev) => [...prev, message])
      })

      socketRef.current = newSocket
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [id, auth?.user])

  const handleSendMessage = () => {
    if (!socketRef.current || !newMessage.trim()) return

    socketRef.current.emit("send_message", {
      roomId: id as string,
      content: newMessage,
    })
    setNewMessage("")
  }


  // 把後端抓回來的 comments 轉成與 socket 訊息相同的格式
  const commentMessages = (comments || []).map(toMessage)
  // 合併訊息
  const combinedMessages = [...commentMessages, ...messages]
  // 依照 createdAt 時間排序
  combinedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  // 當訊息列表更新時，讓 ScrollArea 捲到底
  useEffect(() => {
    scrollToBottom()
  }, [combinedMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (!auth?.user) return null


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="p-6 inline-flex absolute bottom-32 right-32 z-50">Open Chat</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl flex flex-col">
        <DialogHeader>
          <DialogTitle>ChatBox</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-4">
              {combinedMessages.map((message) => {
                const userInfo = getUserInfo(message.userId)
                const isOwnMessage = message.userId === auth?.user.id

                // 這裡透過 dayjs 來計算「xx 分鐘/小時/天前」
                const timeLabel = dayjs(message.createdAt).fromNow()

                return (
                  <div
                    key={message.id}
                    className={`
                      flex
                      items-start
                      gap-2
                      ${isOwnMessage ? "flex-row" : "flex-row-reverse"}
                    `}
                  >
                    {/* 
                      把「名字 + 頭貼」包成一個區塊，讓名字在頭貼上方 
                    */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-center mb-2">
                        {userInfo.displayName}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userInfo.image} />
                        <AvatarFallback>{userInfo.displayName}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* 
                      訊息氣泡區 
                    */}
                    <div
                      className={`
                        mt-4
                        p-3
                        rounded-lg
                        ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"}
                        max-w-[80%]
                      `}
                    >
                      {/* 訊息內容 + 幾分鐘前 */}
                      <div className="text-sm flex items-center">
                        {message.content}
                        <span className="ml-2 text-xs text-gray-500">
                          {timeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* 使 ScrollArea 捲到底的定位點 */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage()
                  scrollToBottom()
                }
              }}
              placeholder="Type a message..."
            />
            <Button
              onClick={() => {
                handleSendMessage()
                scrollToBottom()
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

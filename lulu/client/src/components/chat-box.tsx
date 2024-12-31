import { useEffect, useRef, useState } from "react"
import { User } from "@/types/response"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useParams } from "react-router-dom"
import { io, Socket } from "socket.io-client"

import { useAuth } from "@/hooks/use-auth"
import { useCollaborateUser } from "@/hooks/use-collaborate-user"
import { useComments } from "@/hooks/use-comments"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMapContext } from "./MapContext"; // 引入 Context

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

function ChatBox() {
  // 1) 使用者輸入的新訊息
  const [newMessage, setNewMessage] = useState("")
  // 2) 當前全部訊息 (含Socket即時加入，以及後端抓回來的comments)
  const [messages, setMessages] = useState<Message[]>([])
  // 3) 是否打開 Chat Dialog
  const [isChatOpen, setIsChatOpen] = useState(false)
  // 4) 是否有新訊息 (小紅標)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  // MapContext
    const { 
      setCallCloseDetail,
    } = useMapContext()

  const socketRef = useRef<Socket | null>(null)
  const { data: auth } = useAuth()
  const { id } = useParams()
  const { data: users } = useCollaborateUser(id as string)
  const { data: comments } = useComments(id as string)

  // 用來讓訊息列表自動滾到底部
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // 取得使用者資訊 (頭像與顯示名稱)
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

  // 把從後端抓回來的 comments 資料轉成跟 Socket 訊息一樣的格式
  const toMessage = (comment: CommentData): Message => ({
    id: comment.id,
    content: comment.content,
    userId: comment.userId,
    createdAt: new Date(comment.createdAt),
    itineraryId: comment.itineraryId,
  })

  // 建立 Socket 連線 + 監聽事件
  useEffect(() => {
    if (!auth?.user) return

    if (!socketRef.current) {
      const newSocket = io(`${BACKEND_URL}`, {
        withCredentials: true,
        path: "/api/socket.io",
      })

      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id)
        newSocket.emit("join_room", { roomId: id as string })
      })

      // 收到新訊息 => 若尚未開啟Chat視窗, 顯示小紅標
      newSocket.on("new_message", (message: Message) => {
        console.log("New message:", message)
        if (message.userId !== auth?.user.id && !isChatOpen) {
          setHasNewMessage(true)
        }
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
  // ↑ 把 isChatOpen 放到依賴陣列，
  //   因為若 Chat 狀態改變，需要對 new_message 行為有所不同 (小紅標)

  // 送出訊息
  const handleSendMessage = () => {
    if (!socketRef.current || !newMessage.trim()) return
    socketRef.current.emit("send_message", {
      roomId: id as string,
      content: newMessage,
    })
    setNewMessage("")
  }

  // 將後端抓回來的comments合併socket訊息
  const commentMessages = (comments || []).map(toMessage)
  const combinedMessages = [...commentMessages, ...messages]
  combinedMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // 訊息列表更新時自動滾到底
  useEffect(() => {
    scrollToBottom()
  }, [combinedMessages])

  // 滾動到底
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // 當按下「Open Chat」按鈕
  const handleOpenChatButton = () => {
    // 打開聊天視窗
    setIsChatOpen(true)
    // 清除小紅標
    setHasNewMessage(false)
    // 關閉詳細資訊
    setCallCloseDetail(() => () => {
      console.log('Close Detail!');
    })
  }

  if (!auth?.user) return null

  return (
    <Dialog
      // 透過 Dialog 的 open + onOpenChange 來控制視窗狀態
      open={isChatOpen}
      onOpenChange={(open) => {
        setIsChatOpen(open)
        if (open) {
          setHasNewMessage(false)
        }
      }}
    >
      {/* 
        DialogTrigger: 把按鈕 + 小紅標包一起 
        如果只想純粹用 Button 當 Trigger，也可以直接用 <DialogTrigger>Button</DialogTrigger> 
      */}
      <DialogTrigger asChild>
        <div className="relative">
          <Button
            variant="outline"
            className="p-6 inline-flex absolute bottom-16 right-32 z-50"
            onClick={handleOpenChatButton}
          >
            Open Chat
          </Button>

          {/* 如果 hasNewMessage === true，就顯示小紅點 */}
          {hasNewMessage && (
            <span
              className="bg-red-500 rounded-full w-4 h-4 absolute bottom-24 right-32 translate-x-2 -translate-y-2 z-50"
            />
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl flex flex-col">
        <DialogHeader>
          <DialogTitle>ChatBox</DialogTitle>
        </DialogHeader>

        {/* 聊天內容 */}
        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-4">
              {combinedMessages.map((msg) => {
                const userInfo = getUserInfo(msg.userId)
                const isOwnMessage = msg.userId === auth?.user.id
                const timeLabel = dayjs(msg.createdAt).fromNow()

                return (
                  <div
                    key={msg.id}
                    className={`
                      flex
                      items-start
                      gap-2
                      ${isOwnMessage ? "flex-row" : "flex-row-reverse"}
                    `}
                  >
                    {/* 使用者頭貼 & 暱稱 */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-center mb-2">
                        {userInfo.displayName}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userInfo.image} />
                        <AvatarFallback>{userInfo.displayName}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* 訊息氣泡 */}
                    <div
                      className={`
                        mt-4
                        p-3
                        rounded-lg
                        ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }
                        max-w-[80%]
                      `}
                    >
                      {/* 訊息內容 + 幾分鐘前 */}
                      <div className="text-sm flex items-center">
                        {msg.content}
                        <span className="ml-2 text-xs text-gray-500">
                          {timeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* 用來使 ScrollArea 捲動到底部 */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* 輸入框 + 送出按鈕 */}
          <div className="flex gap-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                // Enter 送出
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
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

export { ChatBox }

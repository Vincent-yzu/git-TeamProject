import http from "http"
import { corsConfig, PORT } from "@/config"
import cors from "cors"

import "express-async-errors"

import { authRouter, commentsRouter, googlesearchRouter, userRouter } from "@/routes"
import { requireSocketAuth } from "@/socket/require-auth"
import cookieParser from "cookie-parser"
import express from "express"
import helmet from "helmet"
import { Server } from "socket.io"

import { NotFoundError } from "@/lib/error"
import { logger } from "@/lib/logger"
import { csrfHandler } from "@/middleware/csrf-handler"
import { errorHandler } from "@/middleware/error-handler"
import { createRateLimiter } from "@/middleware/rate-limiter"
import { addactivityRouter } from "@/routes/addactivity"
import { itineraryRouter } from "@/routes/itinerary"

import { db } from "./lib/db"
import { comments } from "./lib/db/schema"
import { eq, asc } from "drizzle-orm"
import type { User } from "@/lib/db/schema"

const app = express()

app.set("trust proxy", true)

app.use(helmet())
app.use(cookieParser())
app.use(cors(corsConfig))
console.log("CORS Config:", corsConfig)
app.use(express.json())
// app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 100 }))

app.use("/api", googlesearchRouter) // for google map api (備註: 暫時繞過認證 (待修改!!))
app.use("/api/addactivity", addactivityRouter) // add activity (備註: 暫時繞過認證 (待修改!!))
app.use("/api/itinerary", itineraryRouter) // itinerary (備註: 暫時繞過認證 (待修改!!))

app.use(csrfHandler)

// app.use("/api/googlesearch", googlesearchRouter)  // for google map api
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/comments", commentsRouter)
app.get("/", (req, res) => {
  logger.info(req)
  res.json({ message: "Hello World" })
})

app.all("*", async (req, res) => {
  throw new NotFoundError()
})

app.use(errorHandler)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    ...corsConfig,
  },
})

requireSocketAuth(io)
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id)
  // 客戶端請求建立/加入房間事件
  socket.on("create_room", (roomId: string) => {
    // add query db roomId logic
    socket.join(roomId)
    console.log(`User ${socket.id} created and joined room: ${roomId}`)
    // 回傳給前端表示房間成功建立/加入
    socket.emit("room_created", roomId)
  })

  // 當客戶端在該房間中觸發重新排序時，將資訊廣播給同房的其他客戶端
  socket.on("reorder_event", (data: { roomId: string; reorderData: any }) => {
    const { roomId, reorderData } = data
    console.log(`Reorder event in room ${roomId} by ${socket.id}:`, reorderData)
    // 將更新廣播給該房間的其他使用者
    socket.to(roomId).emit("reorder_update", reorderData)
  })

  // Track users in rooms
  const roomUsers: { [roomId: string]: User[] } = {}

  socket.on("join_room", async ({ roomId, user }: { roomId: string; user: User }) => {
    socket.join(roomId)
    
    // Add user to room
    if (!roomUsers[roomId]) {
      roomUsers[roomId] = []
    }
    roomUsers[roomId].push(user)
    
    // Broadcast updated user list
    io.to(roomId).emit("users_in_room", roomUsers[roomId])
    
    // Send existing messages
    const existingMessages = await db
      .select()
      .from(comments)
      .where(eq(comments.itineraryId, roomId))
      .orderBy(asc(comments.createdAt))
      
    socket.emit("initial_messages", existingMessages)
  })

  socket.on("send_message", async ({ roomId, content }: { roomId: string; content: string }) => {
    // Store message in database
    const [message] = await db
      .insert(comments)
      .values({
        userId: socket.data.user.id,
        itineraryId: roomId,
        content,
        createdAt: new Date()
      })
      .returning()
      
    // Broadcast message to room
    io.to(roomId).emit("new_message", message)
  })

  socket.on("disconnect", () => {
    // Remove user from all rooms
    Object.entries(roomUsers).forEach(([roomId, users]) => {
      const updatedUsers = users.filter(u => u.id !== socket.data.user.id)
      roomUsers[roomId] = updatedUsers
      io.to(roomId).emit("users_in_room", updatedUsers)
    })
  })

})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

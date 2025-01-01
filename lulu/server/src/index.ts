import http from "http"
import { corsConfig, PORT } from "@/config"
import cors from "cors"

import "express-async-errors"

import {
  authRouter,
  commentsRouter,
  googlesearchRouter,
  userRouter,
} from "@/routes"
import { requireSocketAuth } from "@/socket/require-auth"
import cookieParser from "cookie-parser"
import { and, asc, eq, inArray, sql } from "drizzle-orm"
import express from "express"
import helmet from "helmet"
import { Server } from "socket.io"

import type { User } from "@/lib/db/schema"
import { NotFoundError, UnauthorizedError } from "@/lib/error"
import { logger } from "@/lib/logger"
import { csrfHandler } from "@/middleware/csrf-handler"
import { errorHandler } from "@/middleware/error-handler"
import { createRateLimiter } from "@/middleware/rate-limiter"
import { addactivityRouter } from "@/routes/addactivity"
import { itineraryRouter } from "@/routes/itinerary"

import { db } from "./lib/db"
import { comments, itineraries } from "./lib/db/schema"

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

// app.use(csrfHandler)

// app.use("/api/googlesearch", googlesearchRouter)  // for google map api
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/comments", commentsRouter)
app.get("/api", (req, res) => {
  logger.info(req)
  res.json({ message: "Hello World" })
})

app.all("*", async (req, res) => {
  throw new NotFoundError()
})

app.use(errorHandler)

const server = http.createServer(app)

const io = new Server(server, {
  path: "/api/socket.io",
  cors: {
    ...corsConfig,
  },
})

requireSocketAuth(io)
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id)

  // 當客戶端在該房間中觸發重新排序時，將資訊廣播給同房的其他客戶端
  socket.on("reorder_event", (data: { roomId: string; reorderData: any }) => {
    const { roomId, reorderData } = data
    console.log(`Reorder event in room ${roomId} by ${socket.id}:`, reorderData)
    // 將更新廣播給該房間的其他使用者
    socket.to(roomId).emit("reorder_update", reorderData)
  })

  // Track users in rooms
  const roomUsers: { [roomId: string]: User[] } = {}

  socket.on("join_room", async ({ roomId }: { roomId: string }) => {
    try {
      const [itinerary] = await db
        .select()
        .from(itineraries)
        .where(
          and(
            eq(itineraries.id, roomId),
            sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${itineraries.allowedEditors}) AS editor WHERE editor = ${socket.data.user.id})`
          )
        )
      if (!itinerary) {
        throw new UnauthorizedError("Unauthorized: invalid session")
      }
    } catch (error) {
      console.log(error)
    }

    console.log(`User ${socket.data.user.id} joined room:`, roomId)
    socket.join(roomId)

    io.to(roomId).emit("room_user_joined", socket.data.user)
  })

  // ========= 新增: add_trip =========
  socket.on("add_trip", async (data) => {
    const { roomId, dayIndex, newActivity } = data
    console.log(`Add trip in room ${roomId} by ${socket.id}:`, newActivity)

    try {
      // 1) 寫入 DB (示範)
      // const createdRecord = await db.insert(...).values({...}).returning()
      // 2) 廣播給同房
      socket.to(roomId).emit("trip_added", {
        dayIndex,
        newActivity: newActivity, // or createdRecord
      })
    } catch (error) {
      console.error("Error adding trip:", error)
    }
  })

  // ========= 新增: delete_trip =========
  socket.on("delete_trip", async (data) => {
    const { roomId, dayIndex, activityId } = data
    console.log(`Delete trip in room ${roomId} by ${socket.id}:`, activityId)
    try {
      // 1) 刪除 DB
      // await db.delete(...).where(...)
      // 2) 廣播給同房
      socket.to(roomId).emit("trip_deleted", { dayIndex, activityId })
    } catch (error) {
      console.error("Error deleting trip:", error)
    }
  })

  // ========= 新增: edit_note =========
  socket.on("edit_note", async (data) => {
    const { roomId, dayIndex, activityId, note } = data
    console.log(`Edit note in room ${roomId} by ${socket.id}:`, data)
    try {
      // 1) Update DB
      // await db.update(...).set({ note }).where(...)
      // 2) 廣播
      socket.to(roomId).emit("note_edited", { dayIndex, activityId, note })
    } catch (error) {
      console.error("Error editing note:", error)
    }
  })

  // ========= 新增: update_start_time =========
  socket.on("update_start_time", async (data) => {
    const { roomId, dayIndex, startTime } = data
    console.log(`Update start_time in room ${roomId} by ${socket.id}:`, data)
    try {
      // 1) Update DB
      // await db.update(...).set({ startTime }).where(...)
      // 2) 廣播
      socket.to(roomId).emit("start_time_updated", { dayIndex, startTime })
    } catch (error) {
      console.error("Error updating start_time:", error)
    }
  })

  // ========= 新增: update_duration (建議停留時間) =========
  socket.on("update_duration", async (data) => {
    const { roomId, dayIndex, activityId, recommendDuration } = data
    console.log(`Update duration in room ${roomId} by ${socket.id}:`, data)
    try {
      // 1) Update DB
      // await db.update(...).set({ recommendDuration }).where(...)
      // 2) 廣播
      socket.to(roomId).emit("duration_updated", {
        dayIndex,
        activityId,
        recommendDuration,
      })
    } catch (error) {
      console.error("Error updating duration:", error)
    }
  })

  // ========= 新增: update_commuting_time (交通時間) =========
  socket.on("update_commuting_time", async (data) => {
    const { roomId, dayIndex, activityId, commutingTime } = data
    console.log(
      `Update commuting_time in room ${roomId} by ${socket.id}:`,
      data
    )
    try {
      // 1) Update DB
      // await db.update(...).set({ commutingTime }).where(...)
      // 2) 廣播
      socket.to(roomId).emit("commuting_time_updated", {
        dayIndex,
        activityId,
        commutingTime,
      })
    } catch (error) {
      console.error("Error updating commuting_time:", error)
    }
  })

  socket.on(
    "send_message",
    async ({ roomId, content }: { roomId: string; content: string }) => {
      // Store message in database
      const [message] = await db
        .insert(comments)
        .values({
          userId: socket.data.user.id,
          itineraryId: roomId,
          content,
          createdAt: new Date(),
        })
        .returning()

      // Broadcast message to room
      io.to(roomId).emit("new_message", message)
    }
  )

  socket.on("disconnect", () => {
    // Remove user from all rooms
    Object.entries(roomUsers).forEach(([roomId, users]) => {
      const updatedUsers = users.filter((u) => u.id !== socket.data.user.id)
      roomUsers[roomId] = updatedUsers
      io.to(roomId).emit("users_in_room", updatedUsers)
    })
  })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

import cookie from "cookie"
import { Server } from "socket.io"

import { validateSession } from "@/lib/auth"
import { InternalServerError, UnauthorizedError } from "@/lib/error"

export const requireSocketAuth = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "")
      const sessionCookie = cookies.session

      if (!sessionCookie || typeof sessionCookie !== "string") {
        return next(new UnauthorizedError("no cookie"))
      }

      // 驗證 session
      const { session, user } = await validateSession(sessionCookie)
      if (!session || !user) {
        return next(new UnauthorizedError("Unauthorized: invalid session"))
      }

      // 將使用者訊息存到 socket.data 中供後續使用
      socket.data.session = session
      socket.data.user = user
      next() // 驗證通過
    } catch (err) {
      next(new InternalServerError())
    }
  })
}

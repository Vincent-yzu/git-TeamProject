import { Socket } from "socket.io"

import { CustomError } from "@/lib/error"
import { logger } from "@/lib/logger"

export function handleSocketError(socket: Socket, err: Error) {
  if (err instanceof CustomError) {
    socket.emit("error_response", {
      status: err.statusCode,
      msg: err.message,
    })
    logger.warn({
      socketId: socket.id,
      handshake: socket.handshake,
      error: {
        status: err.statusCode,
        msg: err.message,
      },
    })
  } else {
    socket.emit("error_response", {
      status: 500,
      msg: err.message,
    })
    logger.error({
      socketId: socket.id,
      handshake: socket.handshake,
      error: {
        status: 500,
        msg: err.message,
        stack: err.stack,
      },
    })
  }
}

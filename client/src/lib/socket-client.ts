import { io } from "socket.io-client"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const socketClient = io(`${BACKEND_URL}/`, {
  withCredentials: true,
})

import { env } from "@/config/env"

export const corsConfig = {
  origin: env.ORIGIN_URL,
  credentials: true,
} as const

export const cookieConfig = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const

export const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 30
export const VERIFICATION_EXPIRES_IN_MS = 1000 * 60 * 10
export const GOOGLE_OAUTH_EXPIRES_IN_MS = 1000 * 60 * 10
export const PORT = 4000
import dotenv from "dotenv"
import { z } from "zod"

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production"]),
  ORIGIN_URL: z.string().url("ORIGIN_URL must be a valid URL"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  BASE_URL: z.string().url("BASE_URL must be a valid URL"),
})

const env = envSchema.safeParse(process.env)

if (!env.success) {
  console.error("Invalid environment variables:", env.error.format())
  throw new Error("Environment variables validation failed")
}

const parsedEnv = env.data

export { parsedEnv as env }

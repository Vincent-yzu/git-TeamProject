import rateLimit from "express-rate-limit"
import Redis from "ioredis"
import { RedisStore } from "rate-limit-redis"

import { env } from "@/config/env"
import { TooManyRequestsError } from "@/lib/error"

const redisClient = new Redis(env.REDIS_URL)

export const createRateLimiter = ({
  windowMs,
  limit,
}: {
  windowMs: number
  limit: number
}) =>
  rateLimit({
    windowMs,
    limit,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      throw new TooManyRequestsError()
    },
    standardHeaders: "draft-7",
    validate: { trustProxy: false },
    store: new RedisStore({
      // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
      sendCommand: (...args: string[]) => redisClient.call(...args),
    }),
  })

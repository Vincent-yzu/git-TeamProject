import type { NextFunction, Request, Response } from "express"

import { env } from "@/config/env"
import { ForbiddenError } from "@/lib/error"

export const csrfHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.method === "GET") {
    return next()
  }

  const origin = req.headers.origin
  const referer = req.headers.referer

  const allowedOrigin = env.ORIGIN_URL

  const isAllowedOrigin = origin === allowedOrigin
  const isAllowedReferer = referer && referer.startsWith(allowedOrigin)

  if (!isAllowedOrigin || !isAllowedReferer) {
    throw new ForbiddenError()
  }

  next()
}

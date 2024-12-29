import type { NextFunction, Request, Response } from "express"

import { validateSession } from "@/lib/auth"
import { UnauthorizedError } from "@/lib/error"

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.cookies["session"] || typeof req.cookies["session"] !== "string") {
    throw new UnauthorizedError()
  }

  const { session, user } = await validateSession(req.cookies.session)

  if (!session || !user) {
    throw new UnauthorizedError("Invalid session")
  }
  
  req.session = session
  req.user = user
  next()
}

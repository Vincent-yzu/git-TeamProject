import { type NextFunction, type Request, type Response } from "express"

import { CustomError } from "@/lib/error"
import { logger } from "@/lib/logger"

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof CustomError) {
    res.status(err.statusCode).send({
      status: err.statusCode,
      msg: err.message, 
    })
    logger.warn({
      request: {
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        body: req.body,
        cookies: req.cookies,
        headers: {
          host: req.headers.host,
          origin: req.headers.origin,
          referer: req.headers.referer,
          "user-agent": req.headers["user-agent"],
          ...Object.fromEntries(
            Object.entries(req.headers).filter(
              ([key]) => key.startsWith("x-") || key.startsWith("cf-")
            )
          ),
        },
        error: {
          status: err.statusCode,
          msg: err.message,
        },
      },
    })
  } else {
    res.status(500).send({
      status: 500,
      msg: err.message,
    })
    logger.error({
      request: {
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        body: req.body,
        cookies: req.cookies,
        headers: {
          host: req.headers.host,
          origin: req.headers.origin,
          referer: req.headers.referer,
          "user-agent": req.headers["user-agent"],
          ...Object.fromEntries(
            Object.entries(req.headers).filter(
              ([key]) => key.startsWith("x-") || key.startsWith("cf-")
            )
          ),
        },
        error: {
          status: 500,
          msg: err.message,
          stack: err.stack,
        },
      },
    })
  }
}

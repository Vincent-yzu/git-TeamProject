import fs from "fs"
import path from "path"
import pino from "pino"

import { env } from "@/config/env"

const isProduction = env.NODE_ENV === "production"

const logDir = path.resolve("./logs")
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const createSonicBoom = (filename: string) =>
  pino.destination({
    dest: path.join(logDir, filename),
    append: true,
    sync: true,
  })

const streams = isProduction
  ? [{ stream: createSonicBoom("error.log") }]
  : [
      {
        stream: pino.transport({
          target: "pino-pretty",
          options: {
            levelFirst: true,
            translateTime: "HH:MM:ss",
          },
        }),
      },
    ]

export const logger = pino(
  {
    base: null,
    level: isProduction ? "warn" : "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      log: (obj) => {
        const { pid, hostname, ...rest } = obj
        return rest
      },
    },
  },
  pino.multistream(streams)
)

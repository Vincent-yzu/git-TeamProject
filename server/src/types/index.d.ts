import { type Session, type User } from "@/lib/db/schema"

declare global {
  namespace Express {
    interface Request {
      session: Session | null
      user: User | null
    }
  }
}
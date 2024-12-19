import { SESSION_EXPIRES_IN_MS, VERIFICATION_EXPIRES_IN_MS } from "@/config"
import { hash, verify } from "@node-rs/argon2"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  sessions,
  users,
  verifications,
  type InsertSession,
  type InsertVerification,
  type Session,
  type User,
  type Verification,
} from "@/lib/db/schema"
import { env } from "@/config/env"
import { Google } from "arctic"

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.BASE_URL}/api/auth/sign-in/google/callback`
)

export const createVerification = async (userId: string) => {
  const verification: InsertVerification = {
    userId,
    expiresAt: new Date(Date.now() + VERIFICATION_EXPIRES_IN_MS),
  }

  const result = await db
    .insert(verifications)
    .values(verification)
    .returning()

  return result[0] as Verification
}

export const hashPassword = async (password: string) => {
  return await hash(password)
}

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  return await verify(hashedPassword, password)
}

export const createSession = async (userId: string) => {
  const session: InsertSession = {
    userId,
    expiresAt: new Date(Date.now() + SESSION_EXPIRES_IN_MS),
  }

  const result = await db
    .insert(sessions)
    .values(session)
    .returning()

  return result[0] as Session
}

export const validateSession = async (
  sessionId: string
): Promise<{
  session: Session | null
  user: User | null
}> => {
  const [selectedSessionAndUser] = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))

  if (!selectedSessionAndUser) {
    return { session: null, user: null }
  }

  const { session, user } = selectedSessionAndUser

  if (Date.now() >= session.expiresAt.getTime()) {
    await invalidateSession(sessionId)
    return { session: null, user: null }
  }

  if (Date.now() >= session.expiresAt.getTime() - SESSION_EXPIRES_IN_MS / 2) {
    session.expiresAt = new Date(Date.now() + SESSION_EXPIRES_IN_MS)
    await db
      .update(sessions)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(sessions.id, session.id))
      .returning()
  }

  return {
    session,
    user,
  }
}

export const invalidateSession = async (sessionId: string) => {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

import { SESSION_EXPIRES_IN_MS, VERIFICATION_EXPIRES_IN_MS } from "@/config"
import { hash, verify } from "@node-rs/argon2"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import {
  activities, 
  sessions,
  users,
  verifications,
  type InsertSession,
  type InsertVerification,
  type Session,
  type User,
  type Verification,
  type Activity,
  type InsertActivity,
} from "@/lib/db/schema"
import { env } from "@/config/env"

export const createActivity = async (title: string) => {
  const activity: InsertActivity = {
    title: title,
    startTime: new Date(Date.now()),
    estimatedDuration: 60,
    attractionId: 1,
    subTripId: 1,
    note: "no note now",
    order: 1,
  }

  const result = await db
    .insert(activities)
    .values(activity)
    .returning()

  return result[0] as Activity
}

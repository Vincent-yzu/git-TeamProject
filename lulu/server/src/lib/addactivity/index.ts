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

// Insert
export const createActivity = async (name: string, description: string) => {
  const activity: InsertActivity = {
    title: name,
    startTime: new Date(Date.now()),
    estimatedDuration: 60,
    attractionId: 1,
    subTripId: 1,
    note: description,
    order: 1,
  }

  const result = await db
    .insert(activities)
    .values(activity)
    .returning()

  return result[0] as Activity
}

// Delete
export const deleteActivity = async (activityId: number) => {
  try {
    await db.delete(activities).where(eq(activities.id, activityId));
    console.log(`Activity with id ${activityId} has been deleted successfully.`);
  } catch (error) {
    console.error("Error deleting activity:", error);
  }
}


import {
  cookieConfig,
  GOOGLE_OAUTH_EXPIRES_IN_MS,
  SESSION_EXPIRES_IN_MS,
} from "@/config"
import { generateCodeVerifier, generateState } from "arctic"
import { and, eq, gt } from "drizzle-orm"
import { Router } from "express"
import { credentialsSchema } from "validation"
import { z } from "zod"

import { env } from "@/config/env"
import {
  createSession,
  google,
  hashPassword,
  invalidateSession,
  verifyPassword,
} from "@/lib/auth"
import { db } from "@/lib/db"
import { users, verifications, trips, userTrips } from "@/lib/db/schema"
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/error"
import { requireAuth } from "@/middleware/require-auth"
import { randomInt } from "crypto";

const router = Router()

router.post("/sign-in", async (req, res) => {
  const result = credentialsSchema.safeParse(req.body)

  if (!result.success) {
    throw new BadRequestError()
  }

  const [selectedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, result.data.email))

  if (!selectedUser || !selectedUser.hashedPassword) {
    throw new UnauthorizedError()
  }

  if (!verifyPassword(result.data.password, selectedUser.hashedPassword)) {
    throw new UnauthorizedError()
  }

  const session = await createSession(selectedUser.id)

  res.cookie("session", session.id, {
    ...cookieConfig,
    maxAge: SESSION_EXPIRES_IN_MS,
  })

  res.status(200).send()
})

router.post("/sign-up", async (req, res) => {
  console.log(req.body)
  const result = credentialsSchema.safeParse(req.body)

  if (!result.success) {
    throw new BadRequestError()
  }

  const [selectedUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, result.data.email))

  if (selectedUser) {
    throw new BadRequestError("User already exists")
  }

  const hashedPassword = await hashPassword(result.data.password)

  const [insertedUser] = await db
    .insert(users)
    .values({
      email: result.data.email,
      hashedPassword,
    })
    .returning()

  //TODO: also sent to "trips" table

  const randomTripId = randomInt(1, 10001);

  // 插入新行程到 trips 表
  const [newTrip] = await db
    .insert(trips)
    .values({
      id: randomTripId,
      title: `Default Trip for ${result.data.email}`,
      destination: "Default Destination",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 預設為一周後結束
    })
    .returning();

  // 插入用戶與行程的關聯到 userTrips 表
  if (!insertedUser) {
    throw new InternalServerError("User insertion failed");
  }

  if (!newTrip) {
    throw new InternalServerError("Trip insertion failed");
  }

  await db.insert(userTrips).values({
    userId: insertedUser.id,
    tripId: newTrip.id,
    role: "editor", // 預設角色為 editor
  });

  const session = await createSession(insertedUser!.id)

  res.cookie("session", session.id, {
    ...cookieConfig,
    maxAge: SESSION_EXPIRES_IN_MS,
  })

  res.status(201).send()
})

router.post("/sign-out", requireAuth, async (req, res) => {
  await invalidateSession(req.session!.id)
  res.clearCookie("session", cookieConfig)

  res.status(200).send()
})

const verificationSchema = z.object({
  token: z.string().min(1),
})

router.get("/verification", async (req, res) => {
  const result = verificationSchema.safeParse(req.query)

  if (!result.success) {
    throw new BadRequestError()
  }

  const [selectedVerification] = await db
    .select()
    .from(verifications)
    .where(
      and(
        eq(verifications.token, result.data.token),
        gt(verifications.expiresAt, new Date())
      )
    )

  if (!selectedVerification) {
    throw new BadRequestError("Invalid verification token")
  }

  await db
    .update(users)
    .set({
      emailVerified: true,
    })
    .where(eq(users.id, selectedVerification.userId))

  const session = await createSession(selectedVerification.userId)

  res.cookie("session", session.id, {
    ...cookieConfig,
    maxAge: SESSION_EXPIRES_IN_MS,
  })

  res.status(200).send()
})

router.get("/google/sign-in", async (req, res) => {
  const state = generateState()
  const code = generateCodeVerifier()

  const url = google.createAuthorizationURL(state, code, ["email", "profile"])
  url.searchParams.set("access_type", "offline")

  res.cookie("google_oauth_state", state, {
    ...cookieConfig,
    maxAge: GOOGLE_OAUTH_EXPIRES_IN_MS,
  })
  res.cookie("google_oauth_code", code, {
    ...cookieConfig,
    maxAge: GOOGLE_OAUTH_EXPIRES_IN_MS,
  })

  res.redirect(url.toString())
})

type GoogleUser = {
  email: string
  email_verified: boolean
  picture: string
}

router.get("/sign-in/google/callback", async (req, res) => {
  const url = new URL(`${env.BASE_URL}/${req.url}`)

  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const storedState = req.cookies["google_oauth_state"] ?? null
  const storedCode = req.cookies["google_oauth_code"] ?? null

  if (!code || !state || !storedCode || !storedState || state !== storedState) {
    throw new BadRequestError()
  }
  const token = await google.validateAuthorizationCode(code, storedCode)
  const googleUserResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token.accessToken()}`,
      },
    }
  )

  if (!googleUserResponse.ok) {
    throw new InternalServerError("Google user info fetch failed")
  }

  const googleUser = (await googleUserResponse.json()) as GoogleUser

  const [upsertedUser] = await db
    .insert(users)
    .values({
      email: googleUser.email,
      emailVerified: googleUser.email_verified,
      image: googleUser.picture,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        emailVerified: googleUser.email_verified,
        image: googleUser.picture,
      },
    })
    .returning()

  const session = await createSession(upsertedUser!.id)

  res.cookie("session", session.id, {
    ...cookieConfig,
    maxAge: SESSION_EXPIRES_IN_MS,
  })

  res.redirect(`${env.ORIGIN_URL}/dashboard`)
})

export { router as authRouter }

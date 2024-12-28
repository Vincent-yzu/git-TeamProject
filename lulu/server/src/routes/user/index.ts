import { eq, inArray } from "drizzle-orm"
import { Router } from "express"

import { db } from "@/lib/db"
import { itineraries, users } from "@/lib/db/schema"
import { BadRequestError, NotFoundError } from "@/lib/error"
import { requireAuth } from "@/middleware/require-auth"

const router = Router()

router.get("/", requireAuth, async (req, res) => {
  const { hashedPassword, ...filteredUser } = req.user!
  res.status(200).json({
    user: filteredUser,
  })
})

router.get("/collaborate-user", requireAuth, async (req, res) => {
  const itineraryId = req.query.itinerary_id
  if (!itineraryId || typeof itineraryId !== "string") {
    throw new BadRequestError("Itinerary ID is required")
  }
  console.log("hihihihi")
  // get allowEditors in itinerary table join with user table
  const [result] = await db
    .select()
    .from(itineraries)
    .where(eq(itineraries.id, itineraryId))
  if (!result) {
    throw new NotFoundError("Itinerary not found")
  }
  const result2 = await db.select().from(users).where(inArray(users.id, result.allowedEditors))
  console.log(result2)
  res.status(200).json( result2 ) 
})

export { router as userRouter }

import { Router } from "express"
import { db } from "@/lib/db"
import { comments } from "@/lib/db/schema"
import { requireAuth } from "@/middleware/require-auth"
import { eq } from "drizzle-orm"
import { BadRequestError } from "@/lib/error"
const router = Router()

router.get("/", requireAuth, async (req, res) => {
  const itineraryId = req.query.itinerary_id
  if (!itineraryId || typeof itineraryId !== "string") {
    throw new BadRequestError("itinerary_id is required")
  }
  const results = await db.select().from(comments).where(eq(comments.itineraryId, itineraryId))
  res.json(results)
})

export { router as commentsRouter }

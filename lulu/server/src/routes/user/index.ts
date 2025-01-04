import { Router } from "express"

import { BadRequestError, NotFoundError } from "@/lib/error"
import { requireAuth } from "@/middleware/require-auth"
import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { eq, and, or, sql, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { itineraries, users } from "@/lib/db/schema"
import {
  itineraryBackendSchema,
  itineraryFrontendSchema,
  type ItineraryBackend,
} from "@/lib/validation"

dotenv.config()

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

// TODO: use email to find userID in database
router.get("/findUserID", async (req, res) => {
  const email = req.query.email as string;

  try {
    // search user
    const userID = await db.select().from(users).where(eq(users.email, email));

    if (userID.length === 0) {
      console.log("User not found");
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const user = userID[0];
    if (user) {
      console.log("User found:", user.id);
      res.status(200).json({
        success: true,
        userID: user.id, //return ID
      });
    } else {
      console.log("User not found");
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error querying user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export { router as userRouter }

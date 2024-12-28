import { requireAuth } from "@/middleware/require-auth"
import { Router } from "express"

import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { eq, and, or, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { itineraries, users } from "@/lib/db/schema"
import { BadRequestError } from "@/lib/error"
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

// TODO: use email to find userID in database
router.get("/findUserID", async (req, res) => {
  const email = req.query.email as string;

  try {
    // 查询用户
    const userID = await db.select().from(users).where(eq(users.email, email));

    if (userID.length === 0) {
      console.log("User not found");
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const user = userID[0]; // 获取第一个用户记录
    if (user) {
      console.log("User found:", user.id);
      res.status(200).json({
        success: true,
        userID: user.id, // 返回用户 ID
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
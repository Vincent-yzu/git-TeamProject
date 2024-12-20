import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { Router } from "express"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { itineraries } from "@/lib/db/schema"
import { BadRequestError } from "@/lib/error"
import {
  itineraryBackendSchema,
  itineraryFrontendSchema,
  type ItineraryBackend,
} from "@/lib/validation"
import { requireAuth } from "@/middleware/require-auth"

dotenv.config()
const router = Router()

router.get("/select", async (req, res) => {
  try {
    // 指定要查找的行程 ID
    const itineraryId = "k81RtOSyvV3EuVNtAx6YM";

    // 從資料庫查找行程資料，匹配行程 ID
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1); // 確保只取得第一筆結果

    // 如果找不到資料，回傳 404 錯誤
    if (itinerary.length === 0) {
      res.status(404).json({ error: "Itinerary not found" });
    }

    // 抓取行程中的 `days` 資料
    const days = itinerary?.[0]?.days;

    // 回傳成功的回應
    res.status(200).json({ days });
  } catch (error) {
    console.error("Error fetching itinerary:", error);

    // 處理其他潛在錯誤，回傳 500 錯誤
    res.status(500).json({ error: "Internal Server Error" });
  }
});

interface Mail {
  name: string;
  type: string;
  order: number;
  latitude: number;
  longitude: number;
  location: string;
  photoUrls: string[];
  description: string;
  recommendDuration: number;
}

// Save updated mails (activities order)
router.post("/save", async (req, res) => {
  const { currentActivities } = req.body; // 取得前端傳來的資料
  const itineraryId = "k81RtOSyvV3EuVNtAx6YM"; // 指定要查詢的行程 ID

  // console.log("RRRRR");
  // console.log(mails);

  try {
    // 從資料庫查詢行程並找到對應的 `days` 資料
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1);

    if (itinerary.length === 0) {
      res.status(404).json({ error: "Itinerary not found" });
    }

    //console.log(itinerary?.[0]?.days);
    const firstItinerary = itinerary?.[0]; // 提取陣列中的第一個物件
    const days = firstItinerary?.days; // 確保第一個物件存在並提取 days

    // console.log("itinerary:", itinerary);
    // console.log("days:", days);

    if(!days)  throw new BadRequestError("Invalided days");
    const dayOne = ((days as unknown) as any[]).find((day: any) => day.day === 1);
    // console.log(dayOne);


    if (!dayOne) {
      res.status(404).json({ error: "Day 1 not found" });
    }

    // 找到 day 1 裡面的 activities 並根據 name 更新 order
    dayOne!.activities = dayOne!.activities.map((activity: any) => {
      const matchedMail = currentActivities.find((mail: Mail) => mail.name === activity.name);
      if (matchedMail) {
        activity.order = currentActivities.indexOf(matchedMail); 
      }
      return activity;
    });

    // 將更新後的 `days` 資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    // 回應成功訊息
    res.status(200).json({ message: "Activities updated successfully" });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/insert', async (req, res) => {
  const { name, type, order, latitude, longitude, location, photoUrls, description, recommendDuration } = req.body;

  const itineraryId = "k81RtOSyvV3EuVNtAx6YM";

  try {
    // Validate input data to prevent undefined values
    if (!itineraryId || !name || !type || !latitude || !longitude || !location || !recommendDuration) {
      console.log('Missing fields:', { itineraryId, name, type, latitude, longitude, location, recommendDuration });
      throw new BadRequestError("Missing required fields");
    }

    // Retrieve the itinerary and corresponding days
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1);

    if (itinerary.length === 0) {
      throw new BadRequestError("Itinerary not found");
    }

    const firstItinerary = itinerary[0];
    const days = firstItinerary?.days;

    if (!days) {
      throw new Error("Invalid days");
    }

    const dayOne = (days as unknown as any[]).find((day: any) => day.day === 1);

    if (!dayOne) {
      throw new BadRequestError("Day 1 not found");
    }

    // Ensure the new activity properties are valid
    const newActivity = {
      name,
      type,
      order: dayOne.activities.length + 1,
      latitude,
      longitude,
      location,
      photoUrls: photoUrls || [], // Default to empty array if undefined
      description,
      recommendDuration,
    };

    // Log the new activity for debugging purposes
    console.log('New activity:', newActivity);

    dayOne.activities.push(newActivity);

    // Ensure that days is not undefined or null before updating the database
    if (!Array.isArray(days) || days.length === 0) {
      throw new Error('Days array is invalid');
    }

    // Update the days field in the database
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    res.status(201).json({ message: 'Activity added successfully', activity: newActivity });

  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({ message: 'Failed to add activity', error: (error as Error).message });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const { place } = req.body; // 從前端取得地點資訊
    const itineraryId = "k81RtOSyvV3EuVNtAx6YM"; // 指定要刪除活動的行程 ID

    if (!place || !place.name) {
      throw new BadRequestError("Missing place name");
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1);

    if (itinerary.length === 0) {
      throw new Error('Itinerary not found');
    }

    const firstItinerary = itinerary[0];
    const days = firstItinerary?.days;

    if (!days) {
      throw new Error("Invalid days");
    }

    const dayOne = (days as unknown as any[]).find((day: any) => day.day === 1);

    if (!dayOne) {
      throw new Error('Day 1 not found');
    }

    // 從活動列表中刪除匹配名稱的活動
    const updatedActivities = dayOne.activities.filter(
      (activity: any) => activity.name !== place.name
    );

    if (updatedActivities.length === dayOne.activities.length) {
      throw new Error('Activity not found');
    }

    // 更新 dayOne 的活動列表
    dayOne.activities = updatedActivities;

    // 將更新後的資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



export { router as addactivityRouter }

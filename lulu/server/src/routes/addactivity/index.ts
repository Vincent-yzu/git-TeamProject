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

const client = new Client({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
})

import { generateItinerary } from "@/lib/blackbox"

const router = Router()

async function getPlaceDetails(query: string) {
  const [textSearchResponse] = await client.searchText(
    { textQuery: query },
    {
      otherArgs: {
        headers: { "X-Goog-FieldMask": "places.name" },
      },
    }
  )

  const [placeResponse] = await client.getPlace(
    { name: textSearchResponse.places?.[0]?.name },
    {
      otherArgs: {
        headers: { "X-Goog-FieldMask": "photos,formattedAddress,location" },
      },
    }
  )

  const photoUrls = await Promise.all(
    (placeResponse.photos || []).map(async (photo) => {
      const [photoResponse] = await client.getPhotoMedia({
        name: `${photo.name}/media`,
        maxHeightPx: 500,
        maxWidthPx: 500,
      });
      return photoResponse.photoUri;
    })
  );
  

  return {
    photoUrls,
    latitude: placeResponse.location?.latitude,
    longitude: placeResponse.location?.longitude,
  }
}

router.get("/", requireAuth, async (req, res) => {
  // 模擬使用者輸入
  // req.body = {
  //   location: "Taipei, Taiwan",
  //   startDate: "2024-04-01T10:00:00Z",
  //   endDate: "2024-04-05T18:00:00Z",
  //   travelCategories: ["City & Sightseeing"],
  //   language: "中文",
  // }

  const parsedBody = itineraryFrontendSchema.safeParse(req.body)

  if (!parsedBody.success) {
    throw new BadRequestError("Invalid itinerary frontend data")
  }

  const { location, startDate, endDate, travelCategories, language } =
    parsedBody.data

  const total_days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  const modelizedItinerary = await generateItinerary({
    location,
    duration: `${total_days}天 ${total_days - 1}夜`,
    language,
    total_days,
    travelCategories,
  })

  // 驗證後端產生的行程格式
  const parsedItinerary = itineraryBackendSchema.safeParse(modelizedItinerary)
  if (!parsedItinerary.success) {
    throw new BadRequestError("Invalided itinerary backend data")
  }

  const parsedItineraryData = parsedItinerary.data
  const completedItinerary = {
    ...parsedItineraryData,
    days: await Promise.all(
      parsedItineraryData.days.map(async (day) => {
        // 處理每個 day 的 activities
        const updatedActivities = await Promise.all(
          day.activities.map(async (activity) => {
            const data = await getPlaceDetails(activity.name);
            return {
              ...activity,
              photoUrls: data.photoUrls,
              latitude: data.latitude,
              longitude: data.longitude,
            };
          })
        );
  
        // 回傳更新後的 day
        return {
          ...day,
          activities: updatedActivities,
        };
      })
    ),
  };
  // @ts-ignore
  await db.insert(itineraries).values({
    userId: req.user!.id,
    allowedEditors: [req.user!.id],
    isPublic: false,
    isAuthorized: false,
    location: location,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    travelCategories: travelCategories,
    language: language,
    days: completedItinerary.days,
    description: completedItinerary.description,
  })

  res.status(201).json({ msg: "success" })
})



router.get("/select", async (req, res) => {
  try {
    // 指定要查找的行程 ID
    const itineraryId = "RRRuscsUmgQLVutbazZYf";

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
  const { mails } = req.body; // 取得前端傳來的資料
  const itineraryId = "RRRuscsUmgQLVutbazZYf"; // 指定要查詢的行程 ID

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
      const matchedMail = mails.find((mail: Mail) => mail.name === activity.name);
      if (matchedMail) {
        activity.order = mails.indexOf(matchedMail); 
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

  const itineraryId = "RRRuscsUmgQLVutbazZYf";

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
    const itineraryId = "RRRuscsUmgQLVutbazZYf"; // 指定要刪除活動的行程 ID

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

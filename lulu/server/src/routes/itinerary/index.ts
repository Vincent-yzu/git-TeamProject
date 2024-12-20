import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { Router } from "express"
import { eq, and} from "drizzle-orm"
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

router.get("/recommended", async (req, res) => {
  const itinerariesFromDB = await db.select().from(itineraries).where(eq(itineraries.isPublic, true))
  const responseData = itinerariesFromDB.map((itinerary) => {
    const {userId, allowedEditors, ...rest} = itinerary
    return {
      ...rest
    }
  }) 
  res.json(responseData)
})

router.get("/", requireAuth, async (req, res) => {
  const itinerariesFromDB = await db.select().from(itineraries).where(eq(itineraries.userId, req.user!.id))
  res.json(itinerariesFromDB)
})

router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  if (typeof id !== "string") {
    throw new BadRequestError("Invalid itinerary id")
  }
  const [itinerary] = await db.select().from(itineraries).where(and(eq(itineraries.id, id), eq(itineraries.userId, req.user!.id)))
  res.json(itinerary)
})


router.post("/", requireAuth, async (req, res) => {

  const parsedBody = itineraryFrontendSchema.safeParse(req.body)

  if (!parsedBody.success) {
    throw new BadRequestError("Invalid itinerary frontend data")
  }

  const { location, startDate, endDate, travelCategories, language } =
    parsedBody.data

  const total_days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime() + 1000 * 60 * 60 * 18) /
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
  const [itinerary] = await db.insert(itineraries).values({
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
  }).returning()

  res.status(201).json({ msg: "success", id: itinerary?.id })
})

// Delete
// router.post("/delete", async (req, res) => {
//   try {
//     // 檢查 place
//     const { place } = req.body;
//     if (!place || typeof place.id === "undefined") {
//       res.status(400).json({ error: "Invalid request: place and id are required" });
//     }

//     // 呼叫 deleteActivity 並獲取結果
//     const { id } = place;
//     const activity = await deleteActivity(id);

//     // 回傳結果作為 JSON
//     res.status(201).json({ message: "Activity deleted successfully", activity });
//   } catch (error) {
//     console.error("Error deleting activity:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// })

export { router as itineraryRouter }

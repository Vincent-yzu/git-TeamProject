import { Router } from "express"
import { requireAuth } from "@/middleware/require-auth"
import { itineraryBackendSchema, itineraryFrontendSchema, type ItineraryBackend } from "@/lib/validation"
import { BadRequestError } from "@/lib/error"
import { getModelizedItinerary } from "@/lib/perplexity"
import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { db } from "@/lib/db"
import { itineraries } from "@/lib/db/schema"

dotenv.config()

const client = new Client({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
})

const router = Router()

/**
 * 取得地點詳細資訊
 */
async function getPlaceDetails(placeName: string): Promise<{
  location: { latitude: number; longitude: number }
  formattedAddress?: string
  photos?: { name: string | null | undefined }[]
}> {
  const response = await client.getPlace(
    { name: placeName },
    {
      otherArgs: {
        headers: { "X-Goog-FieldMask": "photos,formattedAddress,location" },
      },
    }
  )

  const placeData = response[0]

  return {
    location: {
      latitude: placeData.location?.latitude ?? 0,
      longitude: placeData.location?.longitude ?? 0,
    },
    formattedAddress: placeData.formattedAddress ?? "",
    photos: placeData.photos 
      ? await Promise.all(
          placeData.photos.map(async (photo) => ({
            // @ts-expect-error
            name: await getPhoto(photo.name),
          }))
        )
      : [],
  }
}

async function getPhoto(photoName: string) {
  const response = await client.getPhotoMedia({
    name: `${photoName}/media`,
    maxHeightPx: 1000,
    maxWidthPx: 1000,
  });

  return response[0]?.photoUri
}

/**
 * 以查詢字串進行文字搜尋並更新行程資料
 */
async function textSearch(query: string): Promise<{
  location: { latitude: number; longitude: number }
  formattedAddress?: string
  photos?: { name: string | null | undefined }[]
} | null> {
  try {
    const response = await client.searchText(
      { textQuery: query },
      {
        otherArgs: {
          headers: { "X-Goog-FieldMask": "places.name" },
        },
      }
    )

    const placeName = response[0]?.places?.[0]?.name
    if (!placeName) return null

    const placeDetails = await getPlaceDetails(placeName)
    return placeDetails

  } catch (error: any) {
    console.error(`Error during text search: ${error.message}`)
    return null
  }
}

router.get("/", requireAuth, async (req, res) => {
  // 模擬使用者輸入
  req.body = {
    location: "Tokyo, Japan",
    startDate: "2024-04-01T10:00:00Z",
    endDate: "2024-04-05T18:00:00Z",
    travelCategories: ["Family & Group Activities", "History & Culture"],
    language: "zh-TW",
  }

  // 驗證前端傳入的資料
  const parsedBody = itineraryFrontendSchema.safeParse(req.body)
  if (!parsedBody.success) {
    throw new BadRequestError("Invalid itinerary data")
  }

  const { location, startDate, endDate, travelCategories, language } = parsedBody.data

  // 呼叫 getModelizedItinerary 取得 AI 產生的行程規劃
  const modelizedItinerary = await getModelizedItinerary({ location, startDate, endDate, travelCategories, language })

  // 驗證後端產生的行程格式
  const parsedItinerary = itineraryBackendSchema.safeParse(modelizedItinerary)
  if (!parsedItinerary.success) {
    throw new BadRequestError("Invalided itinerary data")
  }

  const parsedItineraryData = parsedItinerary.data

  await Promise.all(
    parsedItineraryData.days.map(async (day, dayIndex) => {
      await Promise.all(
        day.activities.map(async (activity, activityIndex) => {
          const data = await textSearch(activity.name)
          // @ts-expect-error
          day.activities[activityIndex]["photoUrl"] = data?.photos
          // @ts-expect-error
          day.activities[activityIndex]["latitude"] = data?.location.latitude
          // @ts-expect-error
          day.activities[activityIndex]["longitude"] = data?.location.longitude

          console.log(data)
        })
      )
    })
  )
  // console.log(JSON.stringify(parsedItineraryData, null, 2))

  // @ts-expect-error
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
    days: parsedItineraryData.days,
    description: parsedItineraryData.description,
  })

  res.status(201).json({ msg: "success" })
})

export { router as addactivityRouter }

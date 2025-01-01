import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { Router } from "express"
import OpenAI from "openai"
import { createRateLimiter } from "../../middleware/rate-limiter"
dotenv.config()

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
})

const client = new Client({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
})

async function getPlaceDetails(query: string) {
  // const start = Date.now()
  const [textSearchResponse] = await client.searchText(
    { textQuery: query, maxResultCount: 5 },
    {
      otherArgs: {
        headers: {
          "X-Goog-FieldMask":
            "places.name,places.photos,places.formattedAddress,places.location,places.displayName",
        },
      },
    }
  )
  // console.log("textSearchResponse", (Date.now() - start) / 1000)
  // const start2 = Date.now()
  const updatedPlaces = await Promise.all(
    (textSearchResponse?.places || []).map(async (place) => {
      const start = Date.now()
      const [photoResponse] = await client.getPhotoMedia({
        name: `${place.photos?.[0]?.name}/media`,
        maxHeightPx: 500,
        maxWidthPx: 500,
      })
      return {
        place_id: place.name,
        icon: photoResponse.photoUri,
        formatted_address: place.formattedAddress,
        geometry: {
          location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude,
          },
        },
        name: place.displayName?.text,
      }
    })
  )
  // console.log("updatedPlaces", (Date.now() - start2) / 1000)
  // console.log(updatedPlaces.length)

  const systemMessage = `
你是一個熟知景點的專家，請以 20 字以內的簡短描述介紹景點，並以 JSON 格式回應。

JSON 格式範例：
{
  "description": "景點的簡短描述",
}
`.trim()

  const updatedPlacesWithDescription = await Promise.all(
    updatedPlaces.map(async (place) => {
      const userMessage = `${place.name}`

      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      })
      console.log(completion?.choices[0]?.message?.content)
      return {
        ...place,
        ...JSON.parse(completion?.choices[0]?.message?.content || "{}"),
      }
    })
  )

  return {
    updatedPlaces: updatedPlacesWithDescription,
  }
}

const router = Router()

// Define the type for Place (you can extend this as needed)
interface Place {
  name: string
  rating: number
  // Add other properties as necessary, such as address, location, etc.
}

// handle api
router.get("/googlesearch", createRateLimiter({ windowMs: 5 * 60 * 1000, limit: 15 }), async (req, res) => {
  //const { latitude, longitude } = req.body;
  const { query } = req.query // 接收查詢參數

  try {
    const placeDetails = await getPlaceDetails(query as string)

    res.json(placeDetails.updatedPlaces) // 返回景點資料
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching places from Google:", error.message)
    } else {
      console.error("An unknown error occurred:", error)
    }
    res.status(500).send("Error fetching places")
  }

  // // check
  // if (!latitude || !longitude) {
  //   throw new BadRequestError("Empty Text Input")
  // }

  // // google map api
  // const apiKey = process.env.GOOGLE_API_KEY;
  // const radius = 1500; // 搜尋範圍（以公尺為單位）
  // const response = await axios.get(
  //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
  //   {
  //     params: {
  //       location: `${latitude},${longitude}`,
  //       radius,
  //       rankby: "prominence", // 按知名度排序
  //       type: "tourist_attraction", // 限制為旅遊景點
  //       keyword: "famous",  // 熱門篩選
  //       language: "zh-TW", // 設置為繁體中文
  //       key: apiKey,
  //     },
  //   }
  // );
  // const results = response.data.results.filter((place: Place) => place.rating >= 4);
  // res.json(results);

  // // check
  // if (!response.data.results) {
  //   throw new BadRequestError("Failed to fetch nearby places.");  // 待修改
  // }
})

export { router as googlesearchRouter }

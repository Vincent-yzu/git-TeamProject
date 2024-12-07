import { PlacesClient as Client } from "@googlemaps/places";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();

if (!process.env.GOOGLE_MAPS_API_KEY) {
  throw new Error("GOOGLE_MAPS_API_KEY is not set");
}

const writeFile = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const client = new Client({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
});

async function textSearch(query: string) {
  try {
    const response = await client.searchText(
      {
        textQuery: query,
      },
      {
        otherArgs: {
          headers: {
            "X-Goog-FieldMask":
              "*",
          },
        },
      }
    );
    const filePath = path.join(__dirname, "textSearch.json");

    writeFile(filePath, response[0]);
    console.log(response[0].places?.length);
  } catch (error) {
    console.error(error);
  }
}

async function getPlaceDetails(placeName: string) {
  const response = await client.getPlace(
    {
      name: placeName,
    },
    {
      otherArgs: {
        headers: {
          "X-Goog-FieldMask": "*",
        },
      },
    }
  );
  const filePath = path.join(__dirname, "placeDetails.json");
  writeFile(filePath, response[0]);
}

async function getPhoto(photoName: string) {
  const response = await client.getPhotoMedia({
    name: photoName,
    maxHeightPx: 1000,
    maxWidthPx: 1000,
  });
  const filePath = path.join(__dirname, "photo.json");
  writeFile(filePath, response[0]);
}

// Usage
textSearch("台北市20個熱門景點");
// getPlaceDetails("places/ChIJu8BdQQmpQjQRyAwMGhhFVD8");
// getPhoto(
//   "places/ChIJK4Tktz-uEmsR4wAu4Lf6dCg/photos/AdDdOWokMez2JlecauKn8i4ATbo9nb_2WVjPbVa-Tku8hbc-wUSqHIU6QW_ZHS0kn86mDECnSC-XZ_vAmYHOYNmw5Ac4jWX8ZeflA5VViGB8vc_HAn8jsXsCXMFu4TOzMXaXydzXXkjz6OpDv2bfKevYnLuFQgBRKyH2Hjfk/media"
// );


// displayName,rating,editSummary,weekdayDesciptions,photos,types,formattedAddress,viewport,phonenumber

// 10 個濃縮選項
// Relaxation & Wellness
// 包括 Spa wellness 和放鬆體驗，如溫泉、瑜伽或靜修活動。

// City & Sightseeing
// 探索城市著名景點和建築，結合 City sightseeing 和 Cultural experiences。

// Nature & Wildlife
// 體驗自然風光，如山林健行、野生動物觀賞，涵蓋 Wildlife and nature 與 Hiking and trekking。

// Beaches & Water Activities
// 包括 Beaches、潛水、水上運動和海灘活動。

// History & Culture
// 深入當地歷史與傳統，涵蓋 Historical tours、宗教與文化探索。

// Shopping & Local Crafts
// 包括購物、當地工藝體驗和市場探索。

// Food & Culinary Experiences
// 結合 Food exploration 與烹飪課程，體驗當地美食文化。

// Festivals & Nightlife
// 包括參加當地節慶活動與夜生活探索，如酒吧、夜市。

// Adventure & Sports
// 極限運動和冒險活動，如滑翔傘、跳傘、攀岩，涵蓋 Outdoor adventures。

// Family & Group Activities
// 親子活動與團體遊玩，涵蓋動物園、水上樂園、遊樂場等。

// 整體description

// 包含早中晚餐


// curl --request POST \
//   --url https://api.perplexity.ai/chat/completions \
//   --header 'Authorization: Bearer <token>' \
//   --header 'Content-Type: application/json' \
//   --data '{
//   "model": "llama-3.1-sonar-small-128k-online",
//   "messages": [
//     {
//       "role": "system",
//       "content": "You are an AI travel planner. Your task is to create a customized travel itinerary based on the user's input. The response must include:\n1. A summary of the trip.\n2. A day-by-day itinerary segmented by time slots (Morning, Afternoon, Evening, Night).\n3. For each activity, include:\n   - Location name\n   - Description\n   - Recommended duration\n   - Relevance to the travel season\n   - Photo URL\n   - Opening hours\n4. Recommended accommodations based on location and preferences, including a photo.\n5. Seamless transitions for multi-location trips.\n\nOutput should be in JSON format and support output in ${req.language} (e.g., English or Chinese)."
//     },
//     {
//       "role": "user",
//       "content": "Generate a travel itinerary with the following details:\n- Location: ${req.locations}\n- Travel Category: ${req.travelCategory}\n- Duration: ${req.duration}\n- Companion: ${req.companion}\n- Pace: ${req.pace}\n- Season: ${req.season}\n- Accommodation Preferences: ${req.accommodationPreferences}\n- Language: ${req.language}."
//     }
//   ],
//   "max_tokens": 3000,
//   "temperature": 0.5,
//   "top_p": 0.9,
//   "search_domain_filter": [
//     "perplexity.ai"
//   ],
//   "return_images": false,
//   "return_related_questions": false,
//   "search_recency_filter": "month",
//   "top_k": 0,
//   "stream": false,
//   "presence_penalty": 0,
//   "frequency_penalty": 1
// }'



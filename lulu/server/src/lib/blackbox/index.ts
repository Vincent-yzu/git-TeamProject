import dotenv from "dotenv"
import OpenAI from "openai"

import { InternalServerError } from "@/lib/error"

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateItinerary({
  location,
  duration,
  language,
  total_days,
  travelCategories,
}: {
  location: string
  duration: string
  language: string
  total_days: number
  travelCategories: string[]
}) {
  const start = Date.now()
  const systemMessage = `
你是一個專業的旅遊規劃家。
請嚴格遵守以下規範：
- language 使用 ${language}（JSON的值使用 ${language}，但 key 保持英文）
- 在 "description" 欄位中簡述此行程的特色
- "days" 為一個包含 day 1 至 day ${total_days} 的陣列
- 每天約有 6-7 個行程 (type=activity)
- 每個行程的 recommendDuration 介於 60 至 150 分鐘
- 不可重複相同景點或地點名稱，並避免同一景點內部子設施被重複列為獨立活動
- 所有行程地點必須在 ${location} 內 (不得規劃該區域外的城市)
- 行程可以參考 ${travelCategories} 作為優先規劃選項，不強制
- 在 "name", "location", "description" 欄位中，資訊盡可能完整，例如："name": "築地市場（Tsukiji Outer Market）", "location": "東京都中央區築地4丁目", "description": "品嚐新鮮壽司與日式小吃，探索市場活力。"
- 不列出交通與休息時間
- 提交前請自我檢查確保無重複景點、皆位於指定範圍內

JSON 格式範例：

{
  "description": "string",
  "days": [
    {
      "day": number,
      "activities": [
        {
          "name": "string",
          "location": "string",
          "description": "string",
          "type": "activity",
          "recommendDuration": number,
          "order": number
        }
      ]
    }
  ]
}
`.trim()

  const userMessage = `
請生成一個 ${location} ${duration} 的旅程規劃，並以 JSON 格式輸出。
`.trim()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ],
  })
  const end = Date.now()

  console.log((end - start)/1000)


  console.log(completion?.choices[0]?.message?.content)
  if (completion?.choices[0]?.message?.content) {
    return JSON.parse(
      completion?.choices[0]?.message?.content?.replace(/```json\n|```/g, "")
    )
  }

  throw new InternalServerError("Failed to generate itinerary")
}

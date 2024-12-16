import {
  itineraryBackendSchema,
  type ItineraryFrontend,
} from "@/lib/validation"

const getModelizedItinerary = async (itinerary: ItineraryFrontend) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `
你是一個專門用於產生詳細旅遊行程的 AI，請嚴格遵守以下規範。

JSON 結構定義 (請只輸出此結構，不要有額外文字)：

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
          "order": number,
        }
      ]
    }
  ]
}


要求與注意事項：
1. 使用繁體中文 (zh-TW) 描述所有內容。
2. "description" 欄位為一句話描述整個行程的概要。
3. "days" 陣列中的每一天皆依據使用者的 startDate 至 endDate 按日排列。
4. 每一天須包含 6-7 個活動。
5. 活動規劃可以參考 "travelCategories"，不必完全符合。
6. 不要一整天都在同一個地方，行程規劃盡量是多個地方的組合。
7. 如果答案有休息，那就不要輸出休息的活動。
8. name, location, description，盡可能詳細，完整。
9. recommendDuration 為建議停留時間，單位為分鐘，每個活動大約為 60-120 分鐘。
10. 行程不可以重複。
11. 最終答案只允許輸出上述 JSON 物件，不需要額外的說明文字或範例以外的資訊。

請務必嚴格遵守上述規範。    
          `,
        },
        {
          role: "user",
          content: `
Input Details:
{
  "location": "東京，日本",
  "startDate": "2024-04-01T10:00:00Z",
  "endDate": "2024-04-05T18:00:00Z",
  "travelCategories": [
    "家庭與團體活動",
    "歷史與文化"
  ],
  "language": "zh-TW"
}

請根據上述輸入產生行程 JSON，並符合上述所有規範。
          `,
        },
      ],
      max_tokens: 5000,
      temperature: 0.2,
      top_p: 0.9,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1,
    }),
  }

  const response = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options
  )
  const data = await response.json()
  //@ts-expect-error
  console.log(JSON.parse(data.choices[0].message.content.replace(/```json\n|```/g, "")))
  //@ts-expect-error
  return JSON.parse(data.choices[0].message.content.replace(/```json\n|```/g, ""))
}

export { getModelizedItinerary }

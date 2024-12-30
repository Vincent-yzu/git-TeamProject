import { useQuery } from "@tanstack/react-query"
import { Itinerary } from "@/types/response"
import { fetcher } from "@/lib/fetcher"

const useItinerary = (id: string, heyUpdateData: number) => {
  // 使用 useQuery 來獲取行程資料
  const { data, isLoading, error } = useQuery<Itinerary>({
    queryKey: ["itinerary", id, heyUpdateData], // 使用 heyUpdateData 來強制更新資料
    queryFn: async () => {
      const response = await fetcher(`/api/itinerary/${id}`)
      return response.json()
    },
    enabled: !!id, // 確保 id 存在時才發送請求
  })

  // 如果需要，也可以處理錯誤或加載狀態
  if (error) {
    console.error("Error fetching itinerary:", error)
  }

  return { data, isLoading }
}

export { useItinerary }

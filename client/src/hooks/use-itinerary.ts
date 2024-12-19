import { useQuery } from "@tanstack/react-query"
import { Itinerary } from "@/types/response"
import { fetcher } from "@/lib/fetcher"

const useItinerary = (id: string) => {
  return useQuery<Itinerary>({
    queryKey: ["itinerary", id],
    queryFn: async () => {
      const response = await fetcher(`/api/itinerary/${id}`)
      return response.json()
    },
  })
}

export { useItinerary }

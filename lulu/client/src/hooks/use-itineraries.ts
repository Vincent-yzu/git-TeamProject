import { useQuery } from "@tanstack/react-query"
import { Itinerary } from "@/types/response"
import { fetcher } from "@/lib/fetcher"

const useItineraries = () => {
  return useQuery<Itinerary[]>({
    queryKey: ["itineraries"],
    queryFn: async () => {
      const response = await fetcher(`/api/itinerary`)
      return response.json()
    },
  })
}

export { useItineraries }

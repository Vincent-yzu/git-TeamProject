import { fetcher } from "@/lib/fetcher"
import { useQuery } from "@tanstack/react-query"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export function useComments(itineraryId: string) {
  return useQuery({
    queryKey: ["comments", itineraryId],
    queryFn: () => fetchComments(itineraryId),
  })
}

async function fetchComments(itineraryId: string) {
  const response = await fetcher(`${BACKEND_URL}/comments?itinerary_id=${itineraryId}`)
  return response.json()
}
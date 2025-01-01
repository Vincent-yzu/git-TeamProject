import { fetcher } from "@/lib/fetcher"
import { useQuery } from "@tanstack/react-query"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export function useComments(itineraryId: string) {
  return useQuery({
    queryKey: ["comments", itineraryId],
    queryFn: () => fetchComments(itineraryId),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  })
}

async function fetchComments(itineraryId: string) {
  const response = await fetcher(`/api/comments?itinerary_id=${itineraryId}`)
  return response.json()
}
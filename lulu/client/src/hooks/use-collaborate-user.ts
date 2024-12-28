import { fetcher } from "@/lib/fetcher"
import { useQuery } from "@tanstack/react-query"
import {User} from "@/types/response"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export function useCollaborateUser(itineraryId: string) {
  return useQuery({
    queryKey: ["collaborate-user", itineraryId],
    queryFn: () => fetchCollaborateUser(itineraryId),
  })
}

async function fetchCollaborateUser(itineraryId: string): Promise< User[]> {
  const response = await fetcher(`/api/user/collaborate-user?itinerary_id=${itineraryId}`)
  return response.json()
}

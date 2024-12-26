import { fetcher } from "@/lib/fetcher"
import { useQuery } from "@tanstack/react-query"

type Comment = {
  id: string;
  createdAt: Date;
  userId: string;
  itineraryId: string;
  content: string;
}

export const useComments = (itineraryId: string) => {
  return useQuery({
    queryKey: ["comments"],
    queryFn: () => fetchComments(itineraryId),
  })
}

async function fetchComments(itineraryId: string): Promise<Comment[]> {
  const response = await fetcher(`/api/comments?itinerary_id=${itineraryId}`)
  return response.json()
}

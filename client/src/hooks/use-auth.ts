import { User } from "@/types/response"
import { useQuery } from "@tanstack/react-query"

import { fetcher } from "@/lib/fetcher"

const useAuth = () => {
  return useQuery<{ user: User }>({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetcher("/api/user")
      return response.json()
    },
  })
}

export { useAuth }

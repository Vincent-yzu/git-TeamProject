const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export const fetcher = async (
  endpoint: string,
  {
    options,
  }: {
    options?: RequestInit
  } = {}
) => {
  const method = options?.method ?? "GET"
  return await fetch(`${BACKEND_URL}${endpoint}`, {
    credentials: "include",
    headers:
      method === "GET"
        ? {}
        : {
            "Content-Type": "application/json",
          },
    ...options,
  })
} 


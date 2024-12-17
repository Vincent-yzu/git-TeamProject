export type User = {
  id: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export type Itinerary = {
  id: string
  userId: string
  description: string
  location: string
  startDate: Date
  endDate: Date
  travelCategories: string[]
  language: string
  days: {
    day: number
    activities: {
      type: "activity"
      name: string
      description: string
      recommendDuration: number
      order: number
      location: string
      photoUrls: string[]
      latitude: number
      longitude: number
    }[]
  }[]
}

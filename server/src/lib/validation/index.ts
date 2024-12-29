  import { z } from "zod"

  export const itineraryFrontendSchema = z.object({
    location: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    travelCategories: z.array(
      z.enum([
        "Relaxation & Wellness",
        "City & Sightseeing",
        "Nature & Wildlife",
        "Beaches & Water Activities",
        "History & Culture",
        "Shopping & Local Crafts",
        "Food & Culinary Experiences",
        "Festivals & Nightlife",
        "Adventure & Sports",
        "Family & Group Activities",
      ])
    ).default([]),
    language: z.enum(["英文", "中文"]),
  })

  export const itineraryBackendSchema = z.object({
    description: z.string().min(1),
    days: z.array(
      z.object({
        day: z.number(),
        activities: z.array(
          z.object({
            type: z.enum(["activity"]),
            name: z.string().min(1),
            description: z.string().min(1),
            recommendDuration: z.number(),
            order: z.number(),
            location: z.string().min(1),
          })
        ),
      })
    ),
  })

  export type ItineraryBackend = z.infer<typeof itineraryBackendSchema>

  export type ItineraryFrontend = z.infer<typeof itineraryFrontendSchema>

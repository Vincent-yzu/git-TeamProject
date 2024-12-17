'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { CalendarIcon } from 'lucide-react'

const itineraryFrontendSchema = z.object({
  location: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
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
  ),
  language: z.enum(["英文", "中文"]),
})

type TravelCategories = "Relaxation & Wellness" | "City & Sightseeing" | "Nature & Wildlife" | "Beaches & Water Activities" | "History & Culture" | "Shopping & Local Crafts" | "Food & Culinary Experiences" | "Festivals & Nightlife" | "Adventure & Sports" | "Family & Group Activities"

type ItineraryFormValues = z.infer<typeof itineraryFrontendSchema>

export default function ItineraryForm() {
  const form = useForm<ItineraryFormValues>({
    resolver: zodResolver(itineraryFrontendSchema),
    defaultValues: {
      location: "",
      startDate: "",
      endDate: "",
      travelCategories: [],
      language: "英文",
    },
  })

  function onSubmit(data: ItineraryFormValues) {
    console.log(data)
    // Handle form submission here
  }

  const travelCategories = [
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
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter your travel destination" {...field} />
              </FormControl>
              <FormDescription>
                Where do you plan to travel?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When does your trip start?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                When does your trip end?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="travelCategories"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Travel Categories</FormLabel>
                <FormDescription>
                  Select the categories that interest you for this trip.
                </FormDescription>
              </div>
              {travelCategories.map((category) => (
                <FormField
                  key={category}
                  control={form.control}
                  name="travelCategories"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={category}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(category as TravelCategories)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, category])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== category
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {category}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="英文">英文 (English)</SelectItem>
                  <SelectItem value="中文">中文 (Chinese)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your preferred language for the itinerary.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit Itinerary</Button>
      </form>
    </Form>
  )
}

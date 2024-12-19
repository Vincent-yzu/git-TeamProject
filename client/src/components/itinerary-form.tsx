import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { fetcher } from "@/lib/fetcher"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useNavigate } from "react-router-dom"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multi-select"
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

// Schema Integration
const itineraryFrontendSchema = z.object({
  location: z.string().min(1, "Location is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travelCategories: z
    .array(
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

export default function ItineraryForm() {
  const navigate = useNavigate()
  const today = new Date()
  const form = useForm<z.infer<typeof itineraryFrontendSchema>>({
    resolver: zodResolver(itineraryFrontendSchema),
    defaultValues: {
      location: "Tokyo, Japan",
      startDate: today,
      endDate: today,
      travelCategories: [],
      language: "英文",
    },
  })

  const resetToMidnight = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof itineraryFrontendSchema>) => {
      console.log(data)

      data.startDate = resetToMidnight(data.startDate)
      data.endDate = resetToMidnight(data.endDate)

      const response = await fetcher("/api/itinerary", {
        options: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      })
      if (!response.ok) {
        throw new Error("Failed to submit form")
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast.success("Form Submitted Successfully!")
      navigate(`/dashboard/${data.id}`)
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.")
    },
  })

  function onSubmit(values: z.infer<typeof itineraryFrontendSchema>) {
    console.log(values)
    mutation.mutate(values)
  }
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open || mutation.isPending} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className=" size-[44px] px-14" disabled={mutation.isPending} variant="outline">AI Planner</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm md:max-w-md lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Your Itinerary</DialogTitle>
          <DialogDescription>
            Fill out the form below to create your personalized travel
            itinerary.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="container mx-auto max-w-sm">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 max-w-3xl mx-auto py-4"
              >
                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter location (e.g., Tokyo, Japan)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Date */}
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
                              {field.value
                                ? format(field.value, "PPP")
                                : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
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
                              {field.value
                                ? format(field.value, "PPP")
                                : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                   {/* Travel Categories */}
                   <FormField
                  control={form.control}
                  name="travelCategories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Categories</FormLabel>
                      <FormControl>
                        <MultiSelector
                          values={field.value}
                          onValuesChange={field.onChange}
                          loop
                          className="max-w-xs"
                        >
                          <MultiSelectorTrigger>
                            <MultiSelectorInput placeholder="Select categories" />
                          </MultiSelectorTrigger>
                          <MultiSelectorContent>
                            <MultiSelectorList>
                              {[
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
                              ].map((category) => (
                                <MultiSelectorItem
                                  key={category}
                                  value={category}
                                >
                                  {category}
                                </MultiSelectorItem>
                              ))}
                            </MultiSelectorList>
                          </MultiSelectorContent>
                        </MultiSelector>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="英文">英文</SelectItem>
                          <SelectItem value="中文">中文</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

             

                {/* Submit Button */}
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

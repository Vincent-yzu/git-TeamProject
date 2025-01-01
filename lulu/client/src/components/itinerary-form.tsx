import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import * as z from "zod"

import { fetcher } from "@/lib/fetcher"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
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
    )
    .default([]),
  language: z.enum(["英文", "中文"]),
})

function formatToUTC(originalDate: Date) {
  // 將日期轉換為 Date 對象
  const date = new Date(originalDate) // 假設傳入的是 '2024-12-28' 這樣的格式

  // 設置時間為 UTC 的零點
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )

  // 輸出格式為 ISO 8601
  return new Date(utcDate.toISOString()) // 格式為 '2024-12-28T00:00:00.000Z'
}

export default function ItineraryForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const form = useForm<z.infer<typeof itineraryFrontendSchema>>({
    resolver: zodResolver(itineraryFrontendSchema),
    defaultValues: {
      location: "Tokyo, Japan",
      startDate: new Date(),
      endDate: new Date(),
      travelCategories: [],
      language: "英文",
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof itineraryFrontendSchema>) => {
      data.startDate = formatToUTC(data.startDate)
      data.endDate = formatToUTC(data.endDate)
      if (data.startDate > data.endDate) {
        throw new Error("Start date cannot be greater than end date")
      }
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
      if (!noRedirect) {
        toast({
          title: "Form Submitted Successfully!",
          description: "You can now explore the world.",
        })
        navigate(`/dashboard/${data.id}`)
      }
    },
    onError: (error) => {
      if (error.message === "Start date cannot be greater than end date") {
        toast({
          title: "這裡不提供回到過去的時光旅行服務喔！",
          description: "回到過去是不可能的! 請遵守時空安全法則!",
        })
      } else {
        toast({
          title: "Something went wrong.",
          description: "Please try again.",
        })
      }
    },
  })
  const [noRedirect, setNoRedirect] = useState(false)
  function onSubmit(values: z.infer<typeof itineraryFrontendSchema>) {
    console.log(values)
    mutation.mutate(values)
  }
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="size-[44px] px-24 bg-purple-500 text-white hover:bg-purple-400 disabled:bg-purple-200"
          onClick={() => setNoRedirect(true)}
          variant="outline"
        >
          讓 AI 安排你的旅程吧！
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm md:max-w-md lg:max-w-lg">
        <DialogHeader>
          <DialogTitle>你希望 AI 產生怎麼樣的行程呢？</DialogTitle>
          <DialogDescription>
            填寫以下表單，為您打造專屬的旅行行程！<br/>
            小提醒：每15分鐘只能生成3個行程，讓我們一起避免過度旅行！
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
                      <FormLabel>目的地</FormLabel>
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
                      <FormLabel>出發日期</FormLabel>
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
                      <FormLabel>結束日期</FormLabel>
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
                      <FormLabel>您喜歡哪種類型的旅行呢？</FormLabel>
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
                      <FormLabel>您的語言是？</FormLabel>
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

import { PlacesClient as Client } from "@googlemaps/places"
import dotenv from "dotenv"
import { eq } from "drizzle-orm"
import { Router } from "express"
import { nanoid } from "nanoid"

import { db } from "@/lib/db"
import { itineraries } from "@/lib/db/schema"
import { BadRequestError } from "@/lib/error"
import {
  itineraryBackendSchema,
  itineraryFrontendSchema,
  type ItineraryBackend,
} from "@/lib/validation"
import { requireAuth } from "@/middleware/require-auth"

dotenv.config()
const router = Router()

// 查找目前行程的景點  (目前用不到)
router.get("/select", async (req, res) => {
  try {
    // 指定要查找的行程 ID
    const itineraryId = "k81RtOSyvV3EuVNtAx6YM"

    // 從資料庫查找行程資料，匹配行程 ID
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1) // 確保只取得第一筆結果

    // 如果找不到資料，回傳 404 錯誤
    if (itinerary.length === 0) {
      res.status(404).json({ error: "Itinerary not found" })
    }

    // 抓取行程中的 `days` 資料
    const days = itinerary?.[0]?.days

    // 回傳成功的回應
    res.status(200).json({ days })
  } catch (error) {
    console.error("Error fetching itinerary:", error)

    // 處理其他潛在錯誤，回傳 500 錯誤
    res.status(500).json({ error: "Internal Server Error" })
  }
})

interface Mail {
  id: string
  name: string
  note: string
  type: string
  order: number
  latitude: number
  longitude: number
  location: string
  photoUrls: string[]
  description: string
  recommendDuration: number
}

// 保存景點順序
router.post("/save", async (req, res) => {
  const { updatedActivities } = req.body
  const { itineraryId, curDays, currentActivities } = updatedActivities
  const curDay = parseInt(curDays, 10) + 1

  // console.log("RRR: " + currentActivities);
  // console.log("itineraryId: " + itineraryId);
  // console.log("curDay: " + curDay);

  // 驗證資料是否存在
  if (!itineraryId || !curDays || !currentActivities) {
    res
      .status(400)
      .json({
        error: "Missing required fields: id, days, or currentActivities",
      })
  }

  try {
    // 從資料庫查詢行程並找到對應的 `days` 資料
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      res.status(404).json({ error: "Itinerary not found" })
    }

    //console.log(itinerary?.[0]?.days);
    const firstItinerary = itinerary?.[0] // 提取陣列中的第一個物件
    const days = firstItinerary?.days // 確保第一個物件存在並提取 days

    // console.log("itinerary:", itinerary);
    // console.log("days:", days);

    if (!days) throw new BadRequestError("Invalided days")
    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )
    // console.log(dayOne);

    if (!dayOne) {
      res.status(404).json({ error: "Days not found" })
    }

    // 找到 day 1 裡面的 activities 並根據 name 更新 order
    dayOne!.activities = dayOne!.activities.map((activity: any) => {
      const matchedMail = currentActivities.find(
        (mail: Mail) => mail.id === activity.id
      )
      if (matchedMail) {
        activity.order = currentActivities.indexOf(matchedMail)
      }
      return activity
    })

    // 將更新後的 `days` 資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId))

    // 回應成功訊息
    res.status(200).json({ message: "Activities updated successfully" })
  } catch (error) {
    console.error("Error updating itinerary:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 新增行程中的景點
router.post("/insert", async (req, res) => {
  //const { updatedPlaceWithDetail } = req.body;
  const { itineraryId, curDays, placeWithDetail } = req.body
  const {
    name,
    note,
    type,
    order,
    latitude,
    longitude,
    location,
    photoUrls,
    description,
    recommendDuration,
    commutingTime,
  } = placeWithDetail
  const curDay = parseInt(curDays, 10) + 1

  try {
    // Validate input data to prevent undefined values
    if (
      !itineraryId ||
      !name ||
      !type ||
      !latitude ||
      !longitude ||
      !location ||
      !recommendDuration ||
      !commutingTime
    ) {
      console.log("Missing fields:", {
        itineraryId,
        name,
        note, 
        type,
        latitude,
        longitude,
        location,
        recommendDuration,
        commutingTime,
      })
      throw new BadRequestError("Missing required fields")
    }

    // Retrieve the itinerary and corresponding days
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      throw new BadRequestError("Itinerary not found")
    }

    const firstItinerary = itinerary[0]
    const days = firstItinerary?.days

    if (!days) {
      throw new Error("Invalid days")
    }

    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )

    if (!dayOne) {
      throw new BadRequestError("Day 1 not found")
    }

    // Ensure the new activity properties are valid
    const newActivity = {
      name,
      note, 
      type,
      order: dayOne.activities.length + 1,
      latitude,
      longitude,
      location,
      id: nanoid(),
      photoUrls: photoUrls || [], // Default to empty array if undefined
      description,
      recommendDuration,
      commutingTime,
    }

    // Log the new activity for debugging purposes
    console.log("New activity:", newActivity)

    dayOne.activities.push(newActivity)

    // Ensure that days is not undefined or null before updating the database
    if (!Array.isArray(days) || days.length === 0) {
      throw new Error("Days array is invalid")
    }

    // Update the days field in the database
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId))

    res
      .status(201)
      .json({ message: "Activity added successfully", activity: newActivity })
  } catch (error) {
    console.error("Error adding activity:", error)
    res
      .status(500)
      .json({
        message: "Failed to add activity",
        error: (error as Error).message,
      })
  }
})

// router.get("/add-id", async (req, res) => {
//   const results = await db.select().from(itineraries)
//   const newDays = results.map((result) => {
//     return {
//       ...result,
//       days: result.days.map((day) => {
//         return {
//           ...day,
//           activities: day.activities.map((activity, index) => {
//             return {
//               ...activity,
//               commutingTime: 30,
//             }
//           }),
//         }
//       }),
//     }
//   })
//   for (const updatedDays of newDays) {
//     await db.update(itineraries).set({ days: updatedDays.days }).where(eq(itineraries.id, updatedDays.id))
//   }
// })

// 刪除行程中的景點
router.post("/delete", async (req, res) => {
  try {
    const { itineraryId, curDays, place } = req.body // 從前端取得地點資訊
    const curDay = parseInt(curDays, 10) + 1

    if (!place || !place.activityId) {
      throw new BadRequestError("Missing place id")
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      throw new Error("Itinerary not found")
    }

    const firstItinerary = itinerary[0]
    const days = firstItinerary?.days

    if (!days) {
      throw new Error("Invalid days")
    }

    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )

    if (!dayOne) {
      throw new Error("Day 1 not found")
    }

    // 從活動列表中刪除匹配名稱的活動
    const updatedActivities = dayOne.activities.filter(
      (activity: any) => activity.id !== place.activityId
    )

    if (updatedActivities.length === dayOne.activities.length) {
      throw new Error("Activity not found")
    }

    // 更新 dayOne 的活動列表
    dayOne.activities = updatedActivities

    // 將更新後的資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId))

    res.status(200).json({ message: "Activity deleted successfully" })
  } catch (error) {
    console.error("Error deleting activity:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 修改景點備註
router.post("/updateNote", async (req, res) => {
  try {
    const { itineraryId, curDays, place } = req.body // 從前端取得地點資訊
    const curDay = parseInt(curDays, 10) + 1

    if (!place || !place.activityId) {
      throw new BadRequestError("Missing updated note")
    }

    if (!place.note) {
      place.note = ""
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      throw new Error("Itinerary not found")
    }

    const firstItinerary = itinerary[0]
    const days = firstItinerary?.days

    if (!days) {
      throw new Error("Invalid days")
    }

    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )

    if (!dayOne) {
      throw new Error("Day 1 not found")
    }

    // 找到指定的 activity 並更新 note
    const activityToUpdate = dayOne.activities.find(
      (activity: any) => activity.id === place.activityId
    );

    if (!activityToUpdate) {
      throw new Error("Activity not found");
    }

    activityToUpdate.note = place.note;

    // 將更新後的資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    res.status(200).json({ message: "Activity deleted successfully" })
  } catch (error) {
    console.error("Error deleting activity:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 修改景點停留時間
router.post("/updateDuration", async (req, res) => {
  try {
    const { itineraryId, curDays, place } = req.body // 從前端取得地點資訊
    const curDay = parseInt(curDays, 10) + 1

    if (!place || !place.activityId || !place.recommendDuration) {
      throw new BadRequestError("Missing updated note")
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      throw new Error("Itinerary not found")
    }

    const firstItinerary = itinerary[0]
    const days = firstItinerary?.days

    if (!days) {
      throw new Error("Invalid days")
    }

    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )

    if (!dayOne) {
      throw new Error("Day 1 not found")
    }

    // 找到指定的 activity 並更新 recommendDuration
    const activityToUpdate = dayOne.activities.find(
      (activity: any) => activity.id === place.activityId
    );

    if (!activityToUpdate) {
      throw new Error("Activity not found");
    }

    activityToUpdate.recommendDuration = place.recommendDuration;

    // 將更新後的資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    res.status(200).json({ message: "Activity update Duration successfully" })
  } catch (error) {
    console.error("Error update Duration activity:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 修改景點通勤時間
router.post("/updateCommutingTime", async (req, res) => {
  try {
    const { itineraryId, curDays, place } = req.body // 從前端取得地點資訊
    const curDay = parseInt(curDays, 10) + 1

    if (!place || !place.activityId || !place.commutingTime) {
      throw new BadRequestError("Missing updated note")
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      throw new Error("Itinerary not found")
    }

    const firstItinerary = itinerary[0]
    const days = firstItinerary?.days

    if (!days) {
      throw new Error("Invalid days")
    }

    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )

    if (!dayOne) {
      throw new Error("Day 1 not found")
    }

    // 找到指定的 activity 並更新 commutingTime
    const activityToUpdate = dayOne.activities.find(
      (activity: any) => activity.id === place.activityId
    );

    if (!activityToUpdate) {
      throw new Error("Activity not found");
    }

    activityToUpdate.commutingTime = place.commutingTime;

    // 將更新後的資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    res.status(200).json({ message: "Activity update CommutingTime successfully" })
  } catch (error) {
    console.error("Error update CommutingTime activity:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 修改每日出發時間
router.post("/updateStartTime", async (req, res) => {
  try {
    const { itineraryId, curDays, startTime } = req.body // 從前端取得地點資訊
    const curDay = parseInt(curDays, 10) + 1

    if (!startTime) {
      throw new BadRequestError("Missing startTime")
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1)

    if (itinerary.length === 0) {
      throw new Error("Itinerary not found")
    }

    const firstItinerary = itinerary[0]
    const days = firstItinerary?.days

    if (!days) {
      throw new Error("Invalid days")
    }

    const dayOne = (days as unknown as any[]).find(
      (day: any) => day.day === curDay
    )

    if (!dayOne) {
      throw new Error("Day 1 not found")
    }

    dayOne.startTime = startTime;

    // 將更新後的資料寫回資料庫
    await db
      .update(itineraries)
      .set({ days })
      .where(eq(itineraries.id, itineraryId));

    res.status(200).json({ message: "Activity update StartTime successfully" })
  } catch (error) {
    console.error("Error update StartTime activity:", error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

// 建立新行程
router.post("/creatTrip", requireAuth, async (req, res) => {
  const { location, startDate, endDate, description } = req.body; // 從前端取得地點資訊
  
  const daysArray = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 計算天數範圍，並建立空的行程表
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    daysArray.push({
      day: daysArray.length + 1,
      startTime: "08:00",
      activities: [],
    });
  }

  const emptyDays = JSON.stringify(daysArray); // 儲存為 JSON 字串
  
  // 準備要插入的資料
  const itineraryData = {
    userId: req.user!.id,
    allowedEditors: [req.user!.id],
    isPublic: false,
    isAuthorized: false,
    location: location,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    travelCategories: [],
    language: "中文",
    days: emptyDays, // 儲存空行程
    description: description,
  };

  // 輸出內容進行檢查
  //console.log("準備存入資料庫的內容:", itineraryData);

  try {
    // @ts-ignore
    const [itinerary] = await db.insert(itineraries).values(itineraryData).returning();

    res.status(201).json({ msg: "success", id: itinerary?.id });
  } catch (error) {
    console.error("資料庫插入失敗:", error);
    res.status(500).json({ error: "Failed to insert itineraryData into database" })
  }
});

// 刪除行程中的使用者編輯權限
router.post("/deleteEditor", requireAuth, async (req, res) => {
  try {
    const { itineraryId } = req.body; // 從前端取得行程 ID

    if (!itineraryId) {
      throw new BadRequestError("Missing itinerary id");
    }

    const userId = req.user?.id; // 從請求中取得使用者 ID

    if (!userId) {
      throw new Error("Unauthorized user");
    }

    // 從資料庫查找行程
    const itinerary = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itineraryId))
      .limit(1);

    if (itinerary.length === 0) {
      throw new Error("Itinerary not found");
    }

    const firstItinerary = itinerary[0];
    const allowedEditors = firstItinerary!.allowedEditors;
    const itineraryOwner = firstItinerary!.userId;

    if (!Array.isArray(allowedEditors)) {
      throw new Error("Invalid allowedEditors format");
    }

    if (!allowedEditors.includes(userId)) {
      throw new Error("User is not in the allowedEditors list");
    }

    // 移除 allowedEditors 中的該使用者 ID
    const updatedEditors = allowedEditors.filter((editor) => editor !== userId);

    // 如果 userId 等於行程擁有者，嘗試替換 ownerId
    let updatedOwnerId: string | null | undefined = itineraryOwner;
    if (itineraryOwner === userId) {
      if (updatedEditors.length > 0) {

        // 將 userId 替換為 allowedEditors 中的第一個使用者 ID
        updatedOwnerId = updatedEditors[0];

        // 更新資料庫中的 allowedEditors
        await db
        .update(itineraries)
        .set({ allowedEditors: updatedEditors })
        .where(eq(itineraries.id, itineraryId));
        res.status(200).json({ message: "Editor removed successfully" });

      } else {
        // 如果沒有其他編輯者，刪除資料庫中的這筆資料
        await db
          .delete(itineraries)
          .where(eq(itineraries.id, itineraryId));
        res.status(200).json({ message: "Itinerary deleted successfully" });
      }
    }

  } catch (error) {
    console.error("Error removing editor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


export { router as addactivityRouter }

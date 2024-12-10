import { Router } from "express"
import { db } from "@/lib/db"
import { users, verifications } from "@/lib/db/schema"
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/error"
import { createActivity } from "@/lib/addactivity"

const router = Router()


router.post("/", async (req, res) => {
  try {
    
    console.log("req.body" + req.body);

    // 檢查 title
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ error: "Title is required" });
    }

    // 呼叫 createActivity 並獲取結果
    const activity = await createActivity(title);

    // 回傳結果作為 JSON
    res.status(201).json({ message: "Activity created successfully", activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

export { router as addactivityRouter }
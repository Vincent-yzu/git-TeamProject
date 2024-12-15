import { Router } from "express"
import { db } from "@/lib/db"
import { users, verifications } from "@/lib/db/schema"
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
} from "@/lib/error"
import { 
  createActivity,
  deleteActivity,
} from "@/lib/addactivity"

const router = Router()

// Insert
router.post("/insert", async (req, res) => {
  try {
    //console.log("req.body" + req.body);

    const { name, description, coordinates } = req.body;

    // 檢查必填欄位
    if (!name) {
      res.status(400).json({ error: "名稱（name）是必填欄位" });
    }
    if (!description) {
      res.status(400).json({ error: "描述（description）是必填欄位" });
    }
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      res.status(400).json({ error: "經緯度（coordinates）是必填欄位" });
    }

    // 呼叫 createActivity 並獲取結果
    const activity = await createActivity(name, description);

    // 回傳結果作為 JSON
    res.status(201).json({ message: "Activity created successfully", activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

// Delete
router.post("/delete", async (req, res) => {
  try {
    // 檢查 place
    const { place } = req.body;
    if (!place || typeof place.id === "undefined") {
      res.status(400).json({ error: "Invalid request: place and id are required" });
    }

    // 呼叫 deleteActivity 並獲取結果
    const { id } = place;
    const activity = await deleteActivity(id);

    // 回傳結果作為 JSON
    res.status(201).json({ message: "Activity deleted successfully", activity });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})

export { router as addactivityRouter }
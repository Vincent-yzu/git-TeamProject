import { Router } from "express"
import {
  BadRequestError,
} from "@/lib/error"
import axios from 'axios';

const router = Router()

// Define the type for Place (you can extend this as needed)
interface Place {
  name: string;
  rating: number;
  // Add other properties as necessary, such as address, location, etc.
}

// handle api
router.get("/googlesearch", async (req, res) => {
  //const { latitude, longitude } = req.body;
  const { query } = req.query; // 接收查詢參數

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const queryString = typeof query === 'string' ? encodeURIComponent(query) : '';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${queryString}&key=${apiKey}`;

    const response = await axios.get(url);
    res.json(response.data.results); // 返回景點資料
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching places from Google:', error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    res.status(500).send('Error fetching places');
  }

  // // check
  // if (!latitude || !longitude) {
  //   throw new BadRequestError("Empty Text Input")
  // }

  // // google map api
  // const apiKey = process.env.GOOGLE_API_KEY;
  // const radius = 1500; // 搜尋範圍（以公尺為單位）
  // const response = await axios.get(
  //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
  //   {
  //     params: {
  //       location: `${latitude},${longitude}`,
  //       radius,
  //       rankby: "prominence", // 按知名度排序
  //       type: "tourist_attraction", // 限制為旅遊景點
  //       keyword: "famous",  // 熱門篩選
  //       language: "zh-TW", // 設置為繁體中文
  //       key: apiKey,
  //     },
  //   }
  // );
  // const results = response.data.results.filter((place: Place) => place.rating >= 4);
  // res.json(results);

  // // check
  // if (!response.data.results) {
  //   throw new BadRequestError("Failed to fetch nearby places.");  // 待修改
  // }

})

export { router as googlesearchRouter }
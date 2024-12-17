import { requireAuth } from "@/middleware/require-auth"
import { Router } from "express"

const router = Router()
 
router.get("/", requireAuth, async (req, res) => {
  const { hashedPassword, ...filteredUser } = req.user!
  res.status(200).json({
    user: filteredUser,
  })
})

export { router as userRouter }
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function NavGuest() {
  return (
    <div className="flex items-center gap-4">
      <Link to="/sign-in">
        <Button variant="outline">登入</Button>
      </Link>
      <Link to="/sign-up">
        <Button>註冊</Button>
      </Link>
    </div>
  )
}

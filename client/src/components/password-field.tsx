import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { ControllerRenderProps } from "react-hook-form"

import { FormControl, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const PasswordField = ({
  field,
}: {
  field: ControllerRenderProps<
    {
      password: string
      email: string
    },
    "password"
  >
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false)

  const toggleVisibility = () => setIsVisible((prev) => !prev)

  return (
    <FormItem>
      <FormControl>
        <div className="relative">
          <Input
            {...field}
            id="password"
            className="pe-9"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
          />
          <button
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 outline-offset-2 transition-colors hover:text-foreground focus:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? "Hide password" : "Show password"}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOff size={16} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Eye size={16} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </FormControl>
    </FormItem>
  )
}

export { PasswordField }

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { credentialsSchema } from "validation"
import * as z from "zod"
import { fetcher } from "@/lib/fetcher"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { GoogleIcon } from "@/components/google-icon"
import { PasswordField } from "@/components/password-field"
import { useAuth } from "@/hooks/use-auth"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

export default function SignUpForm() {
  const form = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const { data: auth } = useAuth()
  const navigate = useNavigate()
  if (auth?.user) {
    navigate("/dashboard")
  }

  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof credentialsSchema>) => {
      const response = await fetcher("/api/auth/sign-up", {
        options: {
          method: "POST",
          body: JSON.stringify(data),
        },
      })
      if (!response.ok) {
        throw new Error("Failed to sign up")
      }
    },
    onSuccess: () => {
      toast({
        title: "Sign-up successful!",
        description: "You can now sign in.",
      })
      navigate("/dashboard") // FIXME: shouldn't directly navigate to dashboard, go to home page and click the trip we had created
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with your request.",
      })
    },
  })

  function onSubmit(values: z.infer<typeof credentialsSchema>) {
    mutation.mutate(values)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Join us and explore the world</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder="john@doe.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordField field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Signing up..." : "Sign up"}
              </Button>
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">Or</span>
                <Separator className="flex-1" />
              </div>
              <Link to={`${BACKEND_URL}/api/auth/google/sign-up`}>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  type="button"
                >
                  <GoogleIcon />
                  Sign up with Google
                </Button>
              </Link>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/sign-in" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

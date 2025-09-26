"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { AppHeader } from "@/components/app-header"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Update last session time
        await supabase
          .from("UserProfile")
          .update({ last_session: new Date().toISOString() })
          .eq("id", data.user.id)

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        })

        router.push("/?view=discover")
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-[800px] py-10">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => router.push("/?view=discover", { scroll: false })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Discovery
        </Button>

        <div className="grid gap-6">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-base font-serif font-bold text-black mb-2" style={{fontSize: '16px', fontFamily: 'Times New Roman, serif'}}>
              Welcome back
            </h1>
            <p className="text-sm font-sans text-black" style={{fontSize: '14px', fontFamily: 'Arial, sans-serif'}}>
              Sign in to continue exploring and collecting art specially curated for you.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button
              variant="link"
              type="button"
              className="p-0 h-auto font-normal text-sm"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </Button>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => router.push("/register")}
            >
              Create one
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
} 
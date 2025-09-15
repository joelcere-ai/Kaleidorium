"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Mail, Key, UserPlus, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  
  // Login form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Invite form state
  const [artistEmail, setArtistEmail] = useState("")
  const [generatedToken, setGeneratedToken] = useState("")
  const [tokenCopied, setTokenCopied] = useState(false)
  
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setIsLoggedIn(false)
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      setIsLoggedIn(true)
      
      // Check if user is admin
      const user = session.user
      const adminCheck = user.email === 'joel.cere@hypehack.sg' || 
                        user.user_metadata?.role === 'admin' ||
                        user.app_metadata?.role === 'admin'
      
      // Also check the Collectors table for admin role
      if (!adminCheck) {
        const { data: collector } = await supabase
          .from('Collectors')
          .select('role')
          .eq('user_id', user.id)
          .single()
        
        if (collector?.role === 'admin') {
          setIsAdmin(true)
        }
      } else {
        setIsAdmin(true)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      setIsLoggedIn(false)
      setIsAdmin(false)
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        toast({
          title: "Login successful",
          description: "Checking admin privileges...",
        })
        
        // Re-check auth status after login
        await checkAuthStatus()
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)

    try {
      // Get the current session and access token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No access token available')
      }

      const response = await fetch('/api/invite-artist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: artistEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate invitation')
      }

      const data = await response.json()
      setGeneratedToken(data.token)
      setTokenCopied(false)
      
      toast({
        title: "Invitation token generated",
        description: `Token created for ${artistEmail}`,
      })

      // Clear the email field
      setArtistEmail("")
    } catch (error: any) {
      toast({
        title: "Token generation failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken)
      setTokenCopied(true)
      toast({
        title: "Token copied",
        description: "Invitation token copied to clipboard",
      })
      
      setTimeout(() => setTokenCopied(false), 3000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy token to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setIsAdmin(false)
    setGeneratedToken("")
    setEmail("")
    setPassword("")
    toast({
      title: "Logged out",
      description: "You have been signed out successfully",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in - show login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto py-20">
          <Button
            className="mb-8"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Access</CardTitle>
              <CardDescription>
                Sign in with admin credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginLoading}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginLoading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto py-20">
          <Card className="border-destructive">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <Key className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have admin privileges to access this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleLogout}>
                Sign Out
              </Button>
              <Button className="w-full" onClick={() => router.push("/")}>
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button onClick={handleLogout}>
            Sign Out
          </Button>
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Generate invitation tokens for approved artists
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Artist Invitation
              </CardTitle>
              <CardDescription>
                Enter an approved artist's email to generate a unique invitation token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateToken} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Artist email address"
                    value={artistEmail}
                    onChange={(e) => setArtistEmail(e.target.value)}
                    disabled={inviteLoading}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={inviteLoading}>
                  {inviteLoading ? "Generating..." : "Generate Invitation Token"}
                </Button>
              </form>

              {generatedToken && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h3 className="font-semibold">Generated Token</h3>
                    <div className="flex gap-2">
                      <Input
                        value={generatedToken}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        size="icon"
                        onClick={copyToClipboard}
                        className={tokenCopied ? "text-green-600" : ""}
                      >
                        {tokenCopied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <strong>Usage:</strong> Send this token to the artist. They should enter it on the registration page.
                      </p>
                      <p>
                        <strong>Registration URL:</strong> {window.location.origin}/for-artists/register
                      </p>
                      <p className="text-amber-600">
                        <strong>Security:</strong> Token expires in 36 hours and is single-use only.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-800">Security Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 space-y-2">
              <p>• Tokens are single-use and expire after the artist registers</p>
              <p>• Only share tokens with pre-approved artists</p>
              <p>• Each token is unique and cannot be reused</p>
              <p>• Keep this admin interface secure and private</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
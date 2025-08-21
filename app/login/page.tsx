"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobilePageHeader } from "@/components/mobile-page-header"

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        redirect: false,
        usernameOrEmail,
        password,
        // If a callbackUrl is present in URL, respect it; otherwise default home
        callbackUrl: params?.get("callbackUrl") || "/",
      })

      if (!res) {
        setError("Unexpected error")
      } else if (res.error) {
        setError("Incorrect username/email or password")
      } else {
        router.push(res.url || "/")
      }
    } catch (err) {
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError(null)
    setLoading(true)
    try {
      await signIn("google", {
        callbackUrl: params?.get("callbackUrl") || "/",
      })
    } catch (err) {
      setError("Google login failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header consistent with other pages */}
      <MobilePageHeader title="Sign in" subtitle="Access your PyLearn account" />

      {/* Main content container consistent widths/paddings */}
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                🔒 Secure sign-in
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                🐍 PyLearn
              </span>
            </div>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in with your email and password or continue with Google
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <form onSubmit={handleCredentialsLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Username or Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">👤</span>
                  <Input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="yourname or you@example.com"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔒</span>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <Button disabled={loading} className="w-full mt-2">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-border w-full" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px bg-border w-full" />
            </div>

            <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleGoogleLogin}>
              <span className="mr-2">🟦</span> Continue with Google
            </Button>

            <ul className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><span>⚡</span><span>Quick access to your progress</span></li>
              <li className="flex items-center gap-2"><span>💎</span><span>Earn diamonds and XP</span></li>
              <li className="flex items-center gap-2"><span>🔐</span><span>Secure and private</span></li>
            </ul>

            <div className="text-sm text-muted-foreground mt-3">
              Don't have an account?{" "}
              <Link className="text-primary underline underline-offset-4" href="/register">
                Create account
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
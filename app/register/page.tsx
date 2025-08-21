"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobilePageHeader } from "@/components/mobile-page-header"

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Registration failed")
        setLoading(false)
        return
      }

      // Auto login with credentials after successful registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        usernameOrEmail: email, // email is also accepted by our Credentials authorize
        password,
        callbackUrl: params?.get("callbackUrl") || "/",
      })

      if (signInRes?.error) {
        // If auto login fails, fallback to login page with prefilled callback
        router.push(`/login?callbackUrl=${encodeURIComponent(params?.get("callbackUrl") || "/")}`)
        return
      }

      router.push(signInRes?.url || "/")
    } catch (err) {
      setError("Registration failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header consistent with other pages */}
      <MobilePageHeader title="Create account" subtitle="Join PyLearn in seconds" />

      {/* Main content container consistent widths/paddings */}
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <Card className="bg-card border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                ✨ Start free
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                🐍 PyLearn
              </span>
            </div>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">
              Create your account
            </CardTitle>
            <CardDescription>
              Track progress, earn rewards, and sync across devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
                {error}
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">📧</span>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Username (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🧑</span>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    className="pl-9"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">You can leave this blank, we’ll suggest one.</p>
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
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px bg-border w-full" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px bg-border w-full" />
            </div>

            <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => signIn("google", { callbackUrl: params?.get("callbackUrl") || "/" })}>
              <span className="mr-2">🟦</span> Continue with Google
            </Button>

            <ul className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><span>⚡</span><span>Start earning XP instantly</span></li>
              <li className="flex items-center gap-2"><span>💎</span><span>Collect diamonds from challenges</span></li>
              <li className="flex items-center gap-2"><span>🔐</span><span>Your data stays private</span></li>
            </ul>

            <div className="text-sm text-muted-foreground mt-3">
              Already have an account?{" "}
              <Link className="text-primary underline underline-offset-4" href={`/login${params?.get("callbackUrl") ? `?callbackUrl=${encodeURIComponent(params.get("callbackUrl")!)}` : ""}`}>
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
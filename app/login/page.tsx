"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { ShieldCheck, User as UserIcon, Lock as LockIcon, Chrome as ChromeIcon, Eye, EyeOff } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

function LoginFormInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const remembered = localStorage.getItem("remembered-username")
      if (remembered) {
        setUsernameOrEmail(remembered)
        setRemember(true)
      }
    } catch {}
  }, [])

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUsernameError(null)
    setPasswordError(null)
    setLoading(true)
    try {
      if (!usernameOrEmail.trim()) {
        setUsernameError("Please enter your username or email")
        throw new Error("Validation")
      }
      if (!password) {
        setPasswordError("Please enter your password")
        throw new Error("Validation")
      }

      // persist remembered username
      try {
        if (remember) localStorage.setItem("remembered-username", usernameOrEmail.trim())
        else localStorage.removeItem("remembered-username")
      } catch {}

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
    <main className="max-w-md mx-auto px-4 py-10 space-y-6">
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Secure sign in to your account</span>
          </div>
          <CardTitle className="font-[family-name:var(--font-work-sans)]">
            Welcome back
          </CardTitle>
          <CardDescription>
            Use your credentials or continue with Google.
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
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Username or email"
                  required
                  className="pl-9"
                />
                {usernameError && <p className="mt-1 text-xs text-destructive">{usernameError}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {passwordError && <p className="mt-1 text-xs text-destructive">{passwordError}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-foreground/90">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                Remember me
              </label>
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
            <ChromeIcon className="h-4 w-4 mr-2" /> Continue with Google
          </Button>

          <ul className="mt-4 grid gap-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />Quick access to your progress</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />Earn diamonds and XP</li>
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />Secure and private</li>
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
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header consistent with other pages */}
      <MobilePageHeader title="Sign in" subtitle="Access your PyLearn account" />

      <Suspense fallback={<main className="max-w-md mx-auto px-4 py-8"><div className="text-sm text-muted-foreground">Loading…</div></main>}>
        <LoginFormInner />
      </Suspense>
    </div>
  )
}
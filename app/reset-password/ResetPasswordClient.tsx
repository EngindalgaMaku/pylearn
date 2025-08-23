"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MobilePageHeader } from "@/components/mobile-page-header"

export default function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (!token) {
      setError("Missing token")
      return
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Reset failed")
      setMessage("Your password has been reset. You can now sign in with your new password.")
      setTimeout(() => router.push("/login"), 1500)
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobilePageHeader title="Reset password" subtitle="Set a new password" />
      <main className="max-w-md mx-auto px-4 py-8">
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">Create a new password</CardTitle>
            <CardDescription>Enter and confirm your new password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && <div className="text-sm text-green-600 border border-green-200 bg-green-50 rounded-md px-3 py-2">{message}</div>}
            {error && <div className="text-sm text-destructive border border-destructive/20 bg-destructive/10 rounded-md px-3 py-2">{error}</div>}
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading || !token}>{loading ? "Updating..." : "Reset password"}</Button>
            </form>
            <div className="flex gap-2">
              <Link href="/login"><Button variant="secondary" className="flex-1">Back to sign in</Button></Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

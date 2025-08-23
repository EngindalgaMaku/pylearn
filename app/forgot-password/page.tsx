"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (!email) {
      setError("Please enter your email")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Request failed")
      setMessage("If an account exists with that email, a reset link has been sent.")
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MobilePageHeader title="Forgot password" subtitle="Recover your account" />
      <main className="max-w-md mx-auto px-4 py-8">
        <Card className="bg-card border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">Reset your password</CardTitle>
            <CardDescription>
              Enter the email associated with your account. We'll send a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && <div className="text-sm text-green-600 border border-green-200 bg-green-50 rounded-md px-3 py-2">{message}</div>}
            {error && <div className="text-sm text-destructive border border-destructive/20 bg-destructive/10 rounded-md px-3 py-2">{error}</div>}
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
            </form>
            <div className="flex gap-2">
              <Link href="/login"><Button variant="secondary" className="flex-1">Back to sign in</Button></Link>
              <Link href="/register"><Button className="flex-1">Create account</Button></Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

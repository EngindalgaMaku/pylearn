"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function ChangeUsernameForm({ initialUsername }: { initialUsername?: string }) {
  const [newUsername, setNewUsername] = useState(initialUsername ?? "")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [allowed, setAllowed] = useState<boolean>(true)
  const [nextAllowedAt, setNextAllowedAt] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadWindow() {
      try {
        const res = await fetch("/api/profile/username", { method: "GET" })
        const data = await res.json()
        if (!mounted) return
        if (res.ok) {
          setAllowed(Boolean(data?.allowed))
          setNextAllowedAt(data?.nextAllowedAt ? new Date(data.nextAllowedAt) : null)
        } else {
          // On unauthorized, keep allowed but show nothing
        }
      } catch {}
    }
    loadWindow()
    return () => { mounted = false }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
      setError("Username must be 3-20 chars, letters/numbers/underscore only")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newUsername }),
      })
      const data = await res.json()
      if (!res.ok) {
        // 429: include nextAllowedAt
        if (res.status === 429 && data?.nextAllowedAt) {
          const dt = new Date(data.nextAllowedAt)
          setAllowed(false)
          setNextAllowedAt(dt)
        }
        throw new Error(data?.error || "Failed to change username")
      }
      setMessage("Username changed successfully")
      // After success, update limit window from response
      if (data?.nextAllowedAt) setNextAllowedAt(new Date(data.nextAllowedAt))
      setAllowed(false)
    } catch (e: any) {
      setError(e?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="newUsername">New username</Label>
        <Input
          id="newUsername"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="your_name"
          pattern="[A-Za-z0-9_]{3,20}"
          required
        />
        <p className="text-xs text-muted-foreground">
          Allowed: letters, numbers, underscore. 3-20 characters. You can change once per week.
        </p>
        {!allowed && (
          <p className="text-xs text-amber-600">
            Next allowed change: {nextAllowedAt ? nextAllowedAt.toLocaleString() : "soon"}
          </p>
        )}
      </div>
      {message && <div className="text-xs text-green-600">{message}</div>}
      {error && <div className="text-xs text-destructive">{error}</div>}
      <Button type="submit" disabled={loading || !allowed}>{loading ? "Saving..." : "Change Username"}</Button>
    </form>
  )
}

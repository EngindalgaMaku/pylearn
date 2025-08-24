"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Diamond,
  Puzzle,
  Timer,
  Trophy,
  Award,
} from "lucide-react"
import { getMatchingConfig, type MatchingConfig, type MatchingPair } from "./matching-banks"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type Props = {
  slug: string
  title?: string
  diamondReward?: number
  xpReward?: number
  config?: MatchingConfig | null
}

type Phase = "start" | "in-progress" | "completed"

type PairView = MatchingPair & { id: number }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchingRunner({ slug, title, diamondReward = 10, xpReward = 25, config }: Props) {
  const cfg: MatchingConfig | null = useMemo(() => {
    if (config && Array.isArray(config.pairs) && typeof config.timeLimitSec === "number") return config
    return getMatchingConfig(slug)
  }, [config, slug])
  const router = useRouter()
  const searchParams = useSearchParams()
  const backHref = useMemo(() => {
    const category = searchParams?.get("category") || ""
    const type = searchParams?.get("type") || ""
    const qs = new URLSearchParams()
    if (category) qs.set("category", category)
    if (type) qs.set("type", type)
    const s = qs.toString()
    return s ? `/activities?${s}` : "/activities"
  }, [searchParams])

  const [phase, setPhase] = useState<Phase>("start")
  const [timeLeft, setTimeLeft] = useState<number>(cfg?.timeLimitSec ?? 6 * 60)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  // Build pairs model
  const [pairs, setPairs] = useState<PairView[]>(() => (cfg?.pairs || []).map((p, i) => ({ ...p, id: i + 1 })))

  // Left terms and right definitions are separately shuffled
  const [leftItems, setLeftItems] = useState<PairView[]>([])
  const [rightItems, setRightItems] = useState<PairView[]>([])

  // Selection & matches
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null) // id
  const [selectedRight, setSelectedRight] = useState<number | null>(null) // id
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set())
  const [mistakes, setMistakes] = useState<number>(0)
  // Brief pulse feedback set
  const [pulseIds, setPulseIds] = useState<Set<number>>(new Set())

  // Rewards UI
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [showAlreadyClaimedDialog, setShowAlreadyClaimedDialog] = useState(false)
  const [awardedDiamonds, setAwardedDiamonds] = useState<number>(diamondReward)
  const [awardedXP, setAwardedXP] = useState<number>(xpReward)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [prevXP, setPrevXP] = useState<number | null>(null)
  const [prevDiamonds, setPrevDiamonds] = useState<number | null>(null)
  const { data: session, update } = useSession()

  // Initialize on config change
  useEffect(() => {
    if (!cfg) return
    const pv = (cfg.pairs || []).map((p, i) => ({ ...p, id: i + 1 }))
    setPairs(pv)
    setLeftItems(shuffle(pv))
    setRightItems(shuffle(pv))
    setMatchedIds(new Set())
    setSelectedLeft(null)
    setSelectedRight(null)
    setMistakes(0)
    setPhase("start")
    setTimeLeft(cfg.timeLimitSec)
    setStartTime(null)
    setEndTime(null)
  }, [cfg])

  // Timer
  useEffect(() => {
    if (phase !== "in-progress") return
    if (timeLeft <= 0) {
      handleComplete()
      return
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  // Auth check for unauthenticated finish button
  useEffect(() => {
    let cancelled = false
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" })
        const json = await res.json().catch(() => null)
        if (!cancelled) setIsAuthenticated(!!json?.user)
      } catch {
        if (!cancelled) setIsAuthenticated(false)
      }
    }
    checkAuth()
    return () => { cancelled = true }
  }, [])

  const total = pairs.length
  const matchedCount = matchedIds.size
  const progress = total ? (matchedCount / total) * 100 : 0

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  function startRun() {
    setPhase("in-progress")
    setStartTime(new Date())
    setTimeLeft((t) => (t > 0 ? t : cfg?.timeLimitSec ?? 6 * 60))
  }

  function resetRun() {
    if (!cfg) return
    const pv = (cfg.pairs || []).map((p, i) => ({ ...p, id: i + 1 }))
    setLeftItems(shuffle(pv))
    setRightItems(shuffle(pv))
    setMatchedIds(new Set())
    setSelectedLeft(null)
    setSelectedRight(null)
    setMistakes(0)
    setPhase("start")
    setTimeLeft(cfg.timeLimitSec)
    setStartTime(null)
    setEndTime(null)
  }

  function onChooseLeft(id: number) {
    if (phase !== "in-progress") return
    if (matchedIds.has(id)) return
    setSelectedLeft(id)
    // If right already selected, attempt match
    setTimeout(() => tryCommitMatch(id, selectedRight), 0)
  }

  function onChooseRight(id: number) {
    if (phase !== "in-progress") return
    if (matchedIds.has(id)) return
    setSelectedRight(id)
    // If left already selected, attempt match
    setTimeout(() => tryCommitMatch(selectedLeft, id), 0)
  }

  function tryCommitMatch(leftId: number | null, rightId: number | null) {
    if (!leftId || !rightId) return
    // A match is correct if the underlying source pair id matches
    if (leftId === rightId) {
      const next = new Set(matchedIds)
      next.add(leftId)
      setMatchedIds(next)
      setSelectedLeft(null)
      setSelectedRight(null)
      // Vibrate shortly on supported devices
      if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        try { (navigator as any)?.vibrate?.(60) } catch {}
      }
      // Pulse feedback
      setPulseIds((prev) => {
        const n = new Set(prev)
        n.add(leftId)
        return n
      })
      setTimeout(() => {
        setPulseIds((prev) => {
          const n = new Set(prev)
          n.delete(leftId)
          return n
        })
      }, 650)
      // Notify user of successful match
      const pair = pairs.find((p) => p.id === leftId)
      if (pair) {
        const explanation = pair.explanation ? ` — ${pair.explanation}` : ""
        toast({
          title: "Matched!",
          description: `${pair.left} ↔ ${pair.right}${explanation}`,
          duration: 1600,
        })
      }
      // Completed?
      if (next.size === total) {
        handleComplete()
      }
    } else {
      // Wrong: flash and count mistake
      setMistakes((m) => m + 1)
      // Briefly show selection then clear
      setTimeout(() => {
        setSelectedLeft(null)
        setSelectedRight(null)
      }, 350)
    }
  }

  function handleComplete() {
    setPhase("completed")
    const ended = new Date()
    setEndTime(ended)
    // Auto-claim on successful completion; compute timeSpent immediately to avoid race with setState
    const timeSpent = startTime ? Math.floor((ended.getTime() - startTime.getTime()) / 1000) : undefined
    // Defer to next tick to avoid React state batching issues
    setTimeout(() => handleClaimRewards(timeSpent), 0)
  }

  async function handleClaimRewards(timeSpentOverride?: number) {
    if (completing || completed) return
    try {
      setCompleting(true)
      const scorePct = Math.round((matchedCount / Math.max(1, total)) * 100)
      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          score: scorePct,
          timeSpent: typeof timeSpentOverride === "number"
            ? timeSpentOverride
            : startTime && endTime
              ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
              : undefined,
        }),
        cache: "no-store",
      })

      if (res.status === 401) {
        toast({ title: "Login required", description: "You must log in to claim your rewards." })
        return
      }

      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Activity could not be completed (HTTP ${res.status})`)
      }

      // Capture previous totals before updating session
      const currentXP = (session?.user as any)?.experience ?? 0
      const currentDiamonds = (session?.user as any)?.currentDiamonds ?? 0
      setPrevXP(currentXP)
      setPrevDiamonds(currentDiamonds)

      // Update session with returned user snapshot
      const userAfter = data?.user
      if (userAfter && typeof update === "function") {
        try {
          await update({
            currentDiamonds: userAfter.currentDiamonds,
            totalDiamonds: userAfter.totalDiamonds,
            experience: userAfter.experience,
            level: userAfter.level,
          } as any)
        } catch (e) {
          console.warn("Session update after matching completion failed:", e)
        }
      }

      const diamonds = data.rewards?.diamonds ?? 0
      const experience = data.rewards?.experience ?? 0
      setAwardedDiamonds(diamonds)
      setAwardedXP(experience)
      const already = data.alreadyCompleted === true

      if (already) {
        setShowAlreadyClaimedDialog(true)
        setCompleted(true)
      } else {
        setShowRewardDialog(true)
        setCompleted(true)
      }

      // Do not auto-redirect; let user navigate via dialog buttons
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while completing the activity. Please try again.", variant: "destructive" })
    } finally {
      setCompleting(false)
    }
  }

  // Games-style reward dialogs using Dialog
  const RewardModal = () => (
    <Dialog open={showRewardDialog} onOpenChange={(open) => { setShowRewardDialog(open); if (!open) router.push(backHref) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Rewards Unlocked! 🎉</DialogTitle>
          <DialogDescription className="text-center">Keep learning to earn more XP and diamonds.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg border p-3 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-2xl">⭐</span><span className="font-medium">XP</span></div>
                <div className="text-right"><div className="text-sm text-muted-foreground">Before</div><div className="font-semibold">{prevXP ?? (session?.user as any)?.experience ?? 0}</div></div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-primary"><span className="text-xs uppercase tracking-wide">+ Gained</span><span className="font-bold">{awardedXP ?? 0}</span></div>
              <div className="mt-2 text-center text-sm text-muted-foreground">=<span className="ml-2 font-semibold text-foreground">{(prevXP ?? (session?.user as any)?.experience ?? 0) + (awardedXP ?? 0)}</span></div>
            </div>
            <div className="rounded-lg border p-3 bg-secondary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-2xl">💎</span><span className="font-medium">Diamonds</span></div>
                <div className="text-right"><div className="text-sm text-muted-foreground">Before</div><div className="font-semibold">{prevDiamonds ?? (session?.user as any)?.currentDiamonds ?? 0}</div></div>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 text-primary"><span className="text-xs uppercase tracking-wide">+ Gained</span><span className="font-bold">{awardedDiamonds ?? 0}</span></div>
              <div className="mt-2 text-center text-sm text-muted-foreground">=<span className="ml-2 font-semibold text-foreground">{(prevDiamonds ?? (session?.user as any)?.currentDiamonds ?? 0) + (awardedDiamonds ?? 0)}</span></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => { setShowRewardDialog(false); router.push(backHref) }}>Back to Activities</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowRewardDialog(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const AlreadyModal = () => (
    <Dialog open={showAlreadyClaimedDialog} onOpenChange={(open) => { setShowAlreadyClaimedDialog(open); if (!open) router.push(backHref) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Already Completed</DialogTitle>
          <DialogDescription className="text-center">You've already claimed these rewards.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <DialogFooter className="flex justify-center">
          <Button onClick={() => { setShowAlreadyClaimedDialog(false); router.push(backHref) }}>Back to Activities</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (!cfg) {
    return <div className="text-center text-muted-foreground">No matching config found.</div>
  }

  if (phase === "start") {
    return (
      <div className="mt-4">
        <RewardModal />
        <AlreadyModal />
        <Card className="w-full">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Puzzle className="w-8 h-8 text-primary" />
              </div>
              {/* Title/description removed: handled by page-level header */}
            </div>

            {cfg.instructions && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="text-sm whitespace-pre-line text-muted-foreground">{cfg.instructions}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="font-semibold">{pairs.length} Pairs</div>
                <div className="text-sm text-muted-foreground">Matching</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Timer className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{Math.floor((cfg.timeLimitSec) / 60)} Minutes</div>
                <div className="text-sm text-muted-foreground">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">Earn XP</div>
                <div className="text-sm text-muted-foreground">Improve your skills</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Click a term on the left, then its matching definition on the right</li>
                <li>• Correct matches lock in; wrong guesses briefly flash</li>
                <li>• Complete all pairs before time runs out</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href={backHref}><Button variant="outline">Back to Activities</Button></Link>
              <Button onClick={startRun} className="px-8">Start</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === "completed") {
    const tTaken = startTime && endTime ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000)) : (cfg.timeLimitSec - timeLeft)
    const finalPct = Math.round((matchedCount / Math.max(1, total)) * 100)
    return (
      <div className="mt-4 space-y-6">
        <RewardModal />
        <AlreadyModal />
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">All Pairs Matched!</h2>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-primary">{finalPct}%</p>
              <p className="text-muted-foreground">{matchedCount} of {total} pairs matched</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Badge className="bg-secondary/10 text-secondary border-secondary/20">+{finalPct >= 80 ? 100 : finalPct >= 60 ? 75 : 50} XP</Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20">+{finalPct >= 80 ? 25 : finalPct >= 60 ? 15 : 10} Diamonds</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{formatTime(tTaken)}</div><div className="text-sm text-muted-foreground">Total Time</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><Timer className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{mistakes}</div><div className="text-sm text-muted-foreground">Mistakes</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><Puzzle className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{total}</div><div className="text-sm text-muted-foreground">Pairs</div></CardContent></Card>
        </div>

        <div className="flex gap-3 justify-center pb-2">
          <Link href={backHref}><Button variant="outline">Back to Activities</Button></Link>
          <Button variant="outline" onClick={resetRun}>Try Again</Button>
          {isAuthenticated ? (
            <Button onClick={() => handleClaimRewards()} disabled={completing || completed}>{completing ? "Processing..." : completed ? "Completed" : "Claim Rewards"}</Button>
          ) : (
            <Button onClick={() => router.push(backHref)}>Finish and Go to List</Button>
          )}
        </div>
      </div>
    )
  }

  // In-progress UI
  return (
    <div className="mt-4">
      <RewardModal />
      <AlreadyModal />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Badge variant="outline">{matchedCount} / {total} matched</Badge></div>
        <div className="flex items-center gap-2 text-primary"><Clock className="w-4 h-4" /><span className="font-mono font-medium">{formatTime(timeLeft)}</span></div>
      </div>
      <Progress value={progress} className="h-2 mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left terms */}
        <Card>
          <CardHeader><CardTitle className="text-base">Terms</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {leftItems.map((item) => {
              const disabled = matchedIds.has(item.id)
              const selected = selectedLeft === item.id
              const pulsing = pulseIds.has(item.id)
              const base = "w-full p-3 text-left rounded-lg border-2 transition-all"
              const pulseCls = pulsing ? " border-green-500 bg-emerald-50 animate-pulse" : ""
              const stateCls = disabled && !pulsing
                ? " opacity-50 cursor-default border-border"
                : selected
                  ? " border-primary bg-primary/5"
                  : " border-border hover:border-primary/50 hover:bg-muted/50"
              return (
                <button
                  key={item.id}
                  onClick={() => onChooseLeft(item.id)}
                  disabled={disabled}
                  className={`${base}${stateCls}${pulseCls}`}
                >
                  <span className="font-medium">{item.left}</span>
                  {item.topic ? <span className="ml-2 text-xs text-muted-foreground">({item.topic})</span> : null}
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Right definitions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Definitions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {rightItems.map((item) => {
              const disabled = matchedIds.has(item.id)
              const selected = selectedRight === item.id
              const pulsing = pulseIds.has(item.id)
              const base = "w-full p-3 text-left rounded-lg border-2 transition-all"
              const pulseCls = pulsing ? " border-green-500 bg-emerald-50 animate-pulse" : ""
              const stateCls = disabled && !pulsing
                ? " opacity-50 cursor-default border-border"
                : selected
                  ? " border-primary bg-primary/5"
                  : " border-border hover:border-primary/50 hover:bg-muted/50"
              return (
                <button
                  key={item.id}
                  onClick={() => onChooseRight(item.id)}
                  disabled={disabled}
                  className={`${base}${stateCls}${pulseCls}`}
                >
                  <span className="font-mono text-sm">{item.right}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Link href={backHref}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Back</Button></Link>
        <Button onClick={resetRun} variant="outline">Reset</Button>
        <Button onClick={() => setPhase("completed")}>{matchedCount === total ? "Finish" : "Give Up"}<ArrowRight className="w-4 h-4 ml-2"/></Button>
      </div>
    </div>
  )
}

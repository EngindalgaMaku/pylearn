"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, CheckCircle, Code, Calendar, Trophy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface PythonTip {
  id: string
  title: string
  content: string
  codeExample: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  xpReward: number
  isLiked?: boolean
  isCompleted?: boolean
}

interface PythonTipWidgetProps {
  tip: PythonTip
  // mode: 'daily' (homepage daily tip) | 'tips' (general tips list with 3/day limit)
  mode?: "daily" | "tips"
}

export default function PythonTipWidget({ tip, mode = "daily" }: PythonTipWidgetProps) {
  const { data: session, update } = useSession()
  const [isLiked, setIsLiked] = useState(tip.isLiked || false)
  const [isCompleted, setIsCompleted] = useState(tip.isCompleted || false)
  const [showCode, setShowCode] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const { toast } = useToast()

  // Reward modal state (games-style)
  const [rewardOpen, setRewardOpen] = useState(false)
  const [alreadyOpen, setAlreadyOpen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const prevExperience = useMemo(() => (session?.user as any)?.experience ?? 0, [session])
  const prevDiamonds = useMemo(() => (session?.user as any)?.currentDiamonds ?? 0, [session])
  const [gainedXP, setGainedXP] = useState(0)
  const [gainedDiamonds, setGainedDiamonds] = useState(0)
  const afterExperience = prevExperience + gainedXP
  const afterDiamonds = prevDiamonds + gainedDiamonds

  // On mount, check status
  useEffect(() => {
    let aborted = false
    async function run() {
      try {
        setChecking(true)
        const statusUrl = mode === "tips" ? "/api/python-tips/complete-tip" : "/api/python-tips/complete"
        const res = await fetch(statusUrl, { cache: "no-store" })
        if (res.status === 401) {
          // On homepage (mode === 'daily'), don't auto-open login dialog.
          // Only show dialog when the user clicks "Complete".
          // Keep tips page behavior (mode === 'tips') the same.
          if (!aborted && mode === "tips") setLoginOpen(true)
          return
        }
        if (!res.ok) {
          const msg = await res.text().catch(() => "Failed to check daily tip status")
          toast({ title: "Tip status error", description: msg })
          return
        }
        const json = await res.json()
        if (!aborted && json?.success) {
          if (mode === "daily") {
            if (json.alreadyCompletedToday) setIsCompleted(true)
          }
          // For tips mode we don't have per-tip status here; skip
        }
      } catch (e) {
        toast({ title: "Network error", description: "Could not check daily tip status." })
      } finally {
        if (!aborted) setChecking(false)
      }
    }
    run()
    return () => {
      aborted = true
    }
  }, [mode])

  const handleInteraction = (type: "view" | "like" | "share" | "complete") => {
    console.log(`[v0] Daily tip interaction: ${type} on tip ${tip.id}`)

    if (type === "like") {
      setIsLiked(!isLiked)
    } else if (type === "complete") {
      void handleComplete()
    }

    // In real app, this would call an API to update user progress
  }

  async function handleComplete() {
    try {
      if (checking) return
      const url = mode === "tips" ? "/api/python-tips/complete-tip" : "/api/python-tips/complete"
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipId: tip.id }),
      })
      if (res.status === 401) {
        setLoginOpen(true)
        return
      }
      let json: any = null
      try {
        json = await res.json()
      } catch {}
      if (!res.ok || !json?.success) {
        toast({ title: "Could not complete tip", description: json?.error || `HTTP ${res.status}` })
        return
      }

      // Daily-specific gating
      if (mode === "daily") {
        if (json.alreadyCompletedToday) {
          setIsCompleted(true)
          setGainedXP(0)
          setGainedDiamonds(0)
          setAlreadyOpen(true)
          return
        }
      }
      // Tips page: enforce daily limit and already-completed-for-tip
      if (mode === "tips") {
        if (json.dailyLimitReached) {
          setGainedXP(0)
          setGainedDiamonds(0)
          setLimitOpen(true)
          return
        }
        if (json.alreadyCompletedForTip) {
          setIsCompleted(true)
          setGainedXP(0)
          setGainedDiamonds(0)
          setAlreadyOpen(true)
          return
        }
      }

      // Success path (reward granted)
      setIsCompleted(true)

      // Update session totals from server snapshot
      const user = json.user as any
      if (user) {
        await update({
          user: {
            ...(session?.user as any),
            level: user.level,
            experience: user.experience,
            currentDiamonds: user.currentDiamonds,
            totalDiamonds: user.totalDiamonds,
          },
        })
      }

      const rxp = Number(json?.rewards?.experience ?? tip.xpReward ?? 0)
      const rdm = Number(json?.rewards?.diamonds ?? 0)
      setGainedXP(isFinite(rxp) ? rxp : 0)
      setGainedDiamonds(isFinite(rdm) ? rdm : 0)
      setRewardOpen(true)
    } catch (e) {
      toast({ title: "Network error", description: "Please try again." })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
            <span className="text-xs md:text-sm text-blue-400 font-medium">Daily Python Tip</span>
          </div>
          <Badge className={getDifficultyColor(tip.difficulty)}>{tip.difficulty}</Badge>
        </div>
        <CardTitle className="text-base md:text-lg font-semibold text-white">{tip.title}</CardTitle>
        <Badge variant="outline" className="w-fit text-[10px] md:text-xs px-1.5 py-0.5 border-slate-600 text-slate-300">
          {tip.category}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
        <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{tip.content}</p>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="w-full h-9 md:h-10 text-xs md:text-sm border-slate-300 bg-white text-slate-900 hover:bg-slate-100 font-semibold"
          >
            <Code className="h-4 w-4 mr-2" />
            {showCode ? "Hide Code" : "Show Code Example"}
          </Button>

          {showCode && (
            <div className="bg-slate-950 rounded-lg p-3 md:p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs text-slate-400 ml-2">Python</span>
              </div>
              <pre className="text-xs md:text-sm text-green-400 font-mono overflow-x-auto">
                <code>{tip.codeExample}</code>
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 md:pt-2 border-t border-slate-700">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInteraction("like")}
              className={`text-slate-400 hover:text-red-400 ${isLiked ? "text-red-400" : ""}`}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              Like
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleInteraction("share")}
              className="text-slate-400 hover:text-blue-400"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>

            {!isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleInteraction("complete")}
                className="text-slate-400 hover:text-green-400"
                disabled={checking}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge className="bg-green-600 text-white">
                <Trophy className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            <span className="text-[10px] md:text-xs text-slate-400">+{tip.xpReward} XP</span>
          </div>
        </div>
      </CardContent>

      {/* Reward Dialog */}
      <Dialog open={rewardOpen} onOpenChange={setRewardOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Daily Tip Completed!</DialogTitle>
            <DialogDescription className="text-slate-300">
              Nice work. Here are your rewards and updated totals.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="rounded-lg border border-slate-700 p-3">
              <div className="text-xs text-slate-400">XP Before</div>
              <div className="text-lg font-semibold">{prevExperience}</div>
            </div>
            <div className="rounded-lg border border-slate-700 p-3">
              <div className="text-xs text-slate-400">Diamonds Before</div>
              <div className="text-lg font-semibold">{prevDiamonds}</div>
            </div>
            <div className="rounded-lg border border-slate-700 p-3">
              <div className="text-xs text-green-300">+ Gained XP</div>
              <div className="text-lg font-semibold text-green-400">+{gainedXP}</div>
            </div>
            <div className="rounded-lg border border-slate-700 p-3">
              <div className="text-xs text-green-300">+ Gained Diamonds</div>
              <div className="text-lg font-semibold text-green-400">+{gainedDiamonds}</div>
            </div>
            <div className="rounded-lg border border-slate-700 p-3 col-span-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400">XP After</div>
                <div className="text-lg font-semibold">{afterExperience}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Diamonds After</div>
                <div className="text-lg font-semibold">{afterDiamonds}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRewardOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Already Completed Dialog */}
      <Dialog open={alreadyOpen} onOpenChange={setAlreadyOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Already Completed Today</DialogTitle>
            <DialogDescription className="text-slate-300">
              {mode === "daily"
                ? "You have already completed a Daily Python Tip today. Come back tomorrow for more XP!"
                : "You have already completed this tip before. Try a different tip!"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setAlreadyOpen(false)} className="w-full sm:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit Reached Dialog (tips mode) */}
      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent className="bg-gradient-to-br from-rose-900 to-rose-800 text-white border-rose-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Daily Limit Reached</DialogTitle>
            <DialogDescription className="text-rose-100">
              You can earn rewards from up to 3 tips per day. Come back tomorrow for more XP!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setLimitOpen(false)} className="w-full sm:w-auto">Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Required Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl">Login required</DialogTitle>
            <DialogDescription className="text-slate-300">
              Please log in to complete the Daily Python Tip and earn XP.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <a href="/login" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Go to Login</Button>
            </a>
            <Button variant="outline" onClick={() => setLoginOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}


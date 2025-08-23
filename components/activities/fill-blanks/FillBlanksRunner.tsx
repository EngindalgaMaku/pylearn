"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Diamond, Award, Trophy, Clock, Timer } from "lucide-react"

export type FillBlankItem = {
  id?: string | number
  prompt: string // e.g., "print(___)" - use ___ as placeholder
  answer: string // expected answer (case-insensitive trim compare by default)
  hint?: string
  explanation?: string
}

export type FillBlanksConfig = {
  slug: string
  title: string
  timeLimitSec?: number
  instructions?: string
  items: FillBlankItem[]
}

export default function FillBlanksRunner({
  slug,
  title,
  diamondReward = 10,
  xpReward = 25,
  config,
}: {
  slug: string
  title: string
  diamondReward?: number
  xpReward?: number
  config?: FillBlanksConfig | null
}) {
  const { toast } = useToast()

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

  const timeLimit = Math.max(30, Math.min(30 * 60, Number(config?.timeLimitSec ?? 180)))

  const items = useMemo(() => (config?.items?.length ? config.items : [
    { prompt: String.raw`x = 5\nprint(___)`, answer: "x", hint: "Use the variable name.", explanation: "The variable x holds 5, so print(x) outputs 5." },
    { prompt: String.raw`name = 'Ada'\nprint(f"Hello, ___!")`, answer: "{name}", hint: "Use an f-string expression.", explanation: "In an f-string, wrap the variable in braces like {name}." },
  ] as FillBlankItem[]), [config])

  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [answers, setAnswers] = useState<string[]>(() => items.map(() => ""))
  const [correctMap, setCorrectMap] = useState<Record<number, boolean>>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Rewards UI
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [showAlreadyClaimedDialog, setShowAlreadyClaimedDialog] = useState(false)
  const [awardedDiamonds, setAwardedDiamonds] = useState<number>(diamondReward)
  const [awardedXP, setAwardedXP] = useState<number>(xpReward)

  useEffect(() => {
    if (!started || completed) return
    if (timeLeft <= 0) { handleSubmit() ; return }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [started, completed, timeLeft])

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

  function normalize(s: string) {
    return (s ?? "").trim().replace(/^['"]|['"]$/g, "").toLowerCase()
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  function checkAll(): { correct: Record<number, boolean>; count: number } {
    const map: Record<number, boolean> = {}
    let c = 0
    items.forEach((it, i) => {
      const ok = normalize(answers[i]) === normalize(it.answer)
      map[i] = ok
      if (ok) c++
    })
    return { correct: map, count: c }
  }

  async function handleSubmit() {
    const { correct, count } = checkAll()
    setCorrectMap(correct)
    const ended = new Date()
    setEndTime(ended)
    setCompleted(true)

    const pct = Math.round((count / items.length) * 100)
    toast({ title: "Submitted", description: `${count}/${items.length} correct (${pct}%)` })

    // Preview dynamic rewards like MatchingRunner
    const previewXP = pct >= 80 ? 100 : pct >= 60 ? 75 : 50
    const previewDiamonds = pct >= 80 ? 25 : pct >= 60 ? 15 : 10
    setAwardedXP(previewXP)
    setAwardedDiamonds(previewDiamonds)

    // Auto-claim, similar to MatchingRunner
    const timeSpent = startTime ? Math.floor((ended.getTime() - startTime.getTime()) / 1000) : undefined
    setTimeout(() => handleClaimRewards(pct, timeSpent), 0)
  }

  async function handleClaimRewards(scorePct?: number, timeSpentOverride?: number) {
    if (completing) return
    try {
      setCompleting(true)
      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          score: typeof scorePct === "number" ? scorePct : Math.round((Object.values(correctMap).filter(Boolean).length / Math.max(1, items.length)) * 100),
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

      const diamonds = data.rewards?.diamonds ?? 0
      const experience = data.rewards?.experience ?? 0
      setAwardedDiamonds(diamonds)
      setAwardedXP(experience)
      const already = data.alreadyCompleted === true

      if (already) {
        setShowAlreadyClaimedDialog(true)
      } else {
        setShowRewardDialog(true)
      }

      // Redirect back after short delay
      setTimeout(() => { router.push(backHref) }, 3000)
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while completing the activity. Please try again.", variant: "destructive" })
    } finally {
      setCompleting(false)
    }
  }

  function onChange(i: number, val: string) {
    setAnswers(prev => {
      const n = prev.slice()
      n[i] = val
      return n
    })
  }

  function reset() {
    setAnswers(items.map(() => ""))
    setCorrectMap({})
    setTimeLeft(timeLimit)
    setCompleted(false)
    setStarted(false)
    setStartTime(null)
    setEndTime(null)
  }

  // Modals
  const RewardModal = () => (
    showRewardDialog ? (
      <Card className="sm:max-w-md mx-auto mb-4">
        <CardHeader>
          <CardTitle className="text-center">Congratulations! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
                <Diamond className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{awardedDiamonds}</div>
              <div className="text-sm text-muted-foreground">Diamonds</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-bold">{awardedXP}</div>
              <div className="text-sm text-muted-foreground">Experience</div>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-2">Redirecting to activities page in 3 seconds...</p>
          <div className="flex justify-center mt-3">
            <Button onClick={() => { setShowRewardDialog(false); router.push(backHref) }}>Back to Activities</Button>
          </div>
        </CardContent>
      </Card>
    ) : null
  )

  const AlreadyModal = () => (
    showAlreadyClaimedDialog ? (
      <Card className="sm:max-w-md mx-auto mb-4">
        <CardHeader>
          <CardTitle className="text-center">Already Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-center text-muted-foreground">Redirecting to activities page in 3 seconds...</p>
          <div className="flex justify-center mt-3">
            <Button onClick={() => { setShowAlreadyClaimedDialog(false); router.push(backHref) }}>Back to Activities</Button>
          </div>
        </CardContent>
      </Card>
    ) : null
  )

  return (
    <div>
      {/* Start Screen */}
      {!started ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{config?.title || title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {config?.instructions ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{config.instructions}</div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Fill in the blanks. Use Python syntax as needed. Answers are case-insensitive and trimmed.
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{items.length} questions</Badge>
              <Badge variant="outline">{Math.ceil(timeLimit/60)} min limit</Badge>
              <Badge variant="default">{xpReward} XP</Badge>
              <Badge variant="default">{diamondReward} 💎</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => { setStarted(true); setStartTime(new Date()) }}>Start</Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{config?.title || title}</CardTitle>
              <div className="text-sm text-muted-foreground">Time left: {Math.max(0, timeLeft)}s</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RewardModal />
            <AlreadyModal />
            <Progress value={((timeLimit - timeLeft) / timeLimit) * 100} className="h-2" />

            <div className="space-y-4">
              {items.map((it, i) => {
                const correct = completed ? correctMap[i] : undefined
                return (
                  <div key={i} className={`p-3 rounded-lg border ${correct === true ? 'border-green-500 bg-emerald-50' : correct === false ? 'border-rose-500 bg-rose-50/60' : 'border-border'}`}>
                    <div className="whitespace-pre-wrap font-mono text-sm mb-2">{it.prompt.replaceAll('___', '_____')}</div>
                    <div className="flex items-center gap-2">
                      <Input
                        value={answers[i]}
                        onChange={(e) => onChange(i, e.target.value)}
                        placeholder="Type answer"
                        className="font-mono"
                        disabled={completed}
                      />
                      {it.hint && !completed && (
                        <Badge variant="outline" className="text-[10px]">Hint: {it.hint}</Badge>
                      )}
                      {completed && (
                        <Badge variant={correct ? 'default' : 'outline'} className="text-[10px]">
                          {correct ? 'Correct' : `Answer: ${it.answer}`}
                        </Badge>
                      )}
                    </div>
                    {completed && it.explanation && (
                      <div className="text-xs text-muted-foreground mt-2">{it.explanation}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {completed && (() => {
              const correctCount = Object.values(correctMap).filter(Boolean).length
              const finalPct = Math.round((correctCount / Math.max(1, items.length)) * 100)
              const tTaken = startTime && endTime
                ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000))
                : (timeLimit - timeLeft)
              const mistakes = Math.max(0, items.length - correctCount)
              return (
                <div className="mt-4 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-4xl font-bold text-primary">{finalPct}%</div>
                    <div className="flex gap-2 justify-center">
                      <Badge className="bg-secondary/10 text-secondary border-secondary/20">+{awardedXP} XP</Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20">+{awardedDiamonds} Diamonds</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card><CardContent className="p-6 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{formatTime(tTaken)}</div><div className="text-sm text-muted-foreground">Total Time</div></CardContent></Card>
                    <Card><CardContent className="p-6 text-center"><Timer className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{mistakes}</div><div className="text-sm text-muted-foreground">Mistakes</div></CardContent></Card>
                    <Card><CardContent className="p-6 text-center"><Trophy className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{items.length}</div><div className="text-sm text-muted-foreground">Questions</div></CardContent></Card>
                  </div>
                </div>
              )
            })()}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="ghost" onClick={reset}>Restart</Button>
            {completed ? (
              isAuthenticated ? (
                <Button onClick={() => handleClaimRewards()} disabled={completing}>{completing ? "Processing..." : "Claim Rewards"}</Button>
              ) : (
                <Button onClick={() => router.push(backHref)}>Finish and Go to List</Button>
              )
            ) : (
              <Button onClick={handleSubmit} disabled={completing}>Submit</Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

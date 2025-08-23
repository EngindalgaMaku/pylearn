"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, XCircle, ArrowLeft, ArrowRight, Play, Trophy, 
  Target, Timer, Clock, Diamond, Award
} from "lucide-react"
import { getQuizConfig, type QuizConfig } from "@/components/activities/quiz/question-banks"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

type Props = {
  slug: string
  title?: string
  diamondReward?: number
  xpReward?: number
}

type Phase = "start" | "in-progress" | "completed"

export default function QuizRunner({ slug, title, diamondReward = 10, xpReward = 25 }: Props) {
  const config: QuizConfig | null = useMemo(() => getQuizConfig(slug), [slug])
  const cfg = config as QuizConfig

  // Utility: Fisher–Yates shuffle
  function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const [phase, setPhase] = useState<Phase>("start")
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [score, setScore] = useState(0)
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [showAlreadyClaimedDialog, setShowAlreadyClaimedDialog] = useState(false)
  const [awardedDiamonds, setAwardedDiamonds] = useState<number>(diamondReward)
  const [awardedXP, setAwardedXP] = useState<number>(xpReward)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update } = useSession()
  const backHref = useMemo(() => {
    const category = searchParams?.get("category") || ""
    const type = searchParams?.get("type") || ""
    const qs = new URLSearchParams()
    if (category) qs.set("category", category)
    if (type) qs.set("type", type)
    const s = qs.toString()
    return s ? `/activities?${s}` : "/activities"
  }, [searchParams])

  // Timing
  const totalSeconds = cfg?.timeLimitSec ?? 10 * 60
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  // Shuffled questions state (must be declared before effects that use it)
  const [questions, setQuestions] = useState(cfg?.questions || [])

  useEffect(() => {
    if (!cfg) return
    // Shuffle questions when config changes
    const qs = shuffleArray(cfg.questions)
    setQuestions(qs)
    // keep answers array length in sync
    setAnswers(new Array(qs.length).fill(null))
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setPhase("start")
    setTimeLeft(cfg.timeLimitSec ?? 10 * 60)
    setStartTime(null)
    setEndTime(null)
  }, [cfg])

  // Auth check for unauthenticated completion flow button
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

  useEffect(() => {
    if (phase !== "in-progress") return
    if (timeLeft <= 0) {
      handleComplete()
      return
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  const total = questions.length
  const progress = ((current + 1) / total) * 100

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  function startQuiz() {
    setPhase("in-progress")
    setStartTime(new Date())
    // keep existing timeLeft if user resumed from start
    setTimeLeft((t) => (t > 0 ? t : totalSeconds))
  }

  function handleAnswerSelect(idx: number) {
    if (phase !== "in-progress") return
    setSelected(idx)
    setAnswers((prev) => {
      const copy = [...prev]
      copy[current] = idx
      return copy
    })
  }

  function handleNext() {
    if (phase !== "in-progress") return
    if (current < total - 1) {
      const next = current + 1
      setCurrent(next)
      setSelected(answers[next])
    } else {
      handleComplete()
    }
  }

  function handlePrev() {
    if (phase !== "in-progress") return
    if (current > 0) {
      const prev = current - 1
      setCurrent(prev)
      setSelected(answers[prev])
    }
  }

  function handleComplete() {
    setPhase("completed")
    setEndTime(new Date())
    // compute score
    let s = 0
    for (let i = 0; i < total; i++) {
      if (answers[i] === questions[i].correctIndex) s++
    }
    setScore(s)
  }
  
  async function handleClaimRewards() {
    try {
      setCompleting(true)
      
      // Mark activity as completed
      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          score: Math.round((score / total) * 100),
          timeSpent: startTime && endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : undefined
        }),
        cache: "no-store",
      })
      
      if (res.status === 401) {
        toast({
          title: "Login required",
          description: "You must log in to claim your rewards.",
        })
        return
      }
      
      const data = await res.json().catch(() => null)
      
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Activity could not be completed (HTTP ${res.status})`)
      }
      
      // Refresh session immediately with updated user snapshot
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
          console.warn("Session update after quiz completion failed:", e)
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
        console.log("Showing already claimed dialog:", showAlreadyClaimedDialog)
      } else {
        setShowRewardDialog(true)
        setCompleted(true)
        console.log("Showing reward dialog:", showRewardDialog)
      }
      
      // Directly redirect if modals don't work
      setTimeout(() => {
        console.log("Forcing redirect to /activities")
        window.location.href = backHref
      }, 3000)
      
    } catch (error) {
      console.error("Activity completion error:", error)
      toast({
        title: "Error",
        description: "An error occurred while completing the activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCompleting(false)
    }
  }

  function handleRetry() {
    setPhase("start")
    setCurrent(0)
    setSelected(null)
    const qs = shuffleArray(cfg.questions)
    setQuestions(qs)
    setAnswers(new Array(qs.length).fill(null))
    setScore(0)
    setTimeLeft(cfg.timeLimitSec ?? 10 * 60)
    setStartTime(null)
    setEndTime(null)
  }

  // Reward modals - must be declared before any early return to keep hooks order stable
  useEffect(() => {
    // Auto-redirect when modal is shown after a delay
    if (showRewardDialog || showAlreadyClaimedDialog) {
      const timer = setTimeout(() => {
        router.push(backHref);
      }, 3000); // 3 seconds delay
      return () => clearTimeout(timer);
    }
  }, [showRewardDialog, showAlreadyClaimedDialog, router, backHref]);

  // Define modals before any conditional returns so they can be rendered in any phase
  const rewardModal = (
    <Dialog open={showRewardDialog} onOpenChange={(open) => {
      setShowRewardDialog(open);
      if (!open) router.push(backHref);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Congratulations! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            You have successfully completed the activity and earned your rewards.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center gap-6 py-4">
          <div className="flex items-center gap-6">
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
          <p className="text-center text-muted-foreground mt-2">
            Redirecting to activities page in 3 seconds...
          </p>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button onClick={() => {
            setShowRewardDialog(false);
            router.push(backHref);
          }}>
            Back to Activities
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const alreadyClaimedModal = (
    <Dialog open={showAlreadyClaimedDialog} onOpenChange={(open) => {
      setShowAlreadyClaimedDialog(open);
      if (!open) router.push(backHref);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Already Completed</DialogTitle>
          <DialogDescription className="text-center">
            You have already completed this activity and claimed your rewards.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-center text-muted-foreground">
            No additional rewards will be given for completing the same activity multiple times.
          </p>
          <p className="text-center text-muted-foreground mt-2">
            Redirecting to activities page in 3 seconds...
          </p>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button onClick={() => {
            setShowAlreadyClaimedDialog(false);
            router.push(backHref);
          }}>
            Back to Activities
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (phase === "start") {
    return (
      <div className="mt-4">
        {/* Render reward modals globally */}
        {rewardModal}
        {alreadyClaimedModal}
        <Card className="w-full">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-primary" />
              </div>
              {/* Title/description removed: handled by page-level header */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{total} Questions</div>
                <div className="text-sm text-muted-foreground">Multiple Choice</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Timer className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{Math.floor(totalSeconds / 60)} Minutes</div>
                <div className="text-sm text-muted-foreground">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">Earn XP</div>
                <div className="text-sm text-muted-foreground">Improve your skills</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Quiz Rules:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• You have {Math.floor(totalSeconds / 60)} minutes to complete all questions</li>
                <li>• You can navigate between questions freely</li>
                <li>• Each question has one correct answer</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href={backHref}>
                <Button variant="outline">Back to Activities</Button>
              </Link>
              <Button onClick={startQuiz} className="px-8">Start Quiz</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }


  if (phase === "completed") {
    const finalPct = Math.round((score / total) * 100)
    const tTaken =
      startTime && endTime ? Math.max(0, Math.round((endTime.getTime() - startTime.getTime()) / 1000)) : totalSeconds - timeLeft
    const avgPerQ = total > 0 ? Math.round(tTaken / total) : 0

    const topicStats = questions.reduce((acc, q, i) => {
      const topic = q.topic || "General"
      if (!acc[topic]) acc[topic] = { correct: 0, total: 0 }
      acc[topic].total++
      if (answers[i] === q.correctIndex) acc[topic].correct++
      return acc
    }, {} as Record<string, { correct: number; total: number }>)

    return (
      <div className="mt-4 space-y-6">
        {/* Render reward modals globally */}
        {rewardModal}
        {alreadyClaimedModal}
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Quiz Completed!</h2>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-primary">{finalPct}%</p>
              <p className="text-muted-foreground">
                {score} out of {total} questions correct
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                +{finalPct >= 80 ? 100 : finalPct >= 60 ? 75 : 50} XP
              </Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                +{finalPct >= 80 ? 25 : finalPct >= 60 ? 15 : 10} Diamonds
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{formatTime(tTaken)}</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Timer className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{avgPerQ}s</div>
              <div className="text-sm text-muted-foreground">Avg per Question</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{finalPct}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance by Topic</h3>
            <div className="space-y-3">
              {Object.entries(topicStats).map(([topic, stats]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="font-medium">{topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stats.correct}/{stats.total}
                    </span>
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(stats.correct / Math.max(1, stats.total)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12">
                      {Math.round((stats.correct / Math.max(1, stats.total)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center pb-2">
          <Link href={backHref}>
            <Button variant="outline">Back to Activities</Button>
          </Link>
          <Button variant="outline" onClick={handleRetry}>Try Again</Button>
          {isAuthenticated ? (
            <Button onClick={handleClaimRewards} disabled={completing || completed}>
              {completing ? "Processing..." : completed ? "Completed" : "Claim Rewards"}
            </Button>
          ) : (
            <Button onClick={() => router.push(backHref)}>
              Finish and Go to List
            </Button>
          )}
        </div>
      </div>
    )
  }

  // In-progress
  const q = questions[current]
  return (
    <div className="mt-4">
      {/* Render reward modals */}
      {rewardModal}
      {alreadyClaimedModal}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {current + 1} of {total}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <Clock className="w-4 h-4" />
          <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
        </div>
      </div>
      <Progress value={progress} className="h-2 mb-4" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{q.question}</CardTitle>
          {q.question.includes("\n") && (
            <div className="bg-muted p-3 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {q.question.split("\n").slice(1).join("\n")}
            </div>
          )}
          {q.topic ? (
            <CardDescription>
              <span className="text-xs uppercase tracking-wide">Topic:</span> {q.topic}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx
            const isAnswered = answers[current] !== null
            const isCorrect = idx === q.correctIndex
            const showColors = isAnswered && isSelected
            const variantClass = !isAnswered
              ? isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
              : showColors
              ? isCorrect
                ? "border-green-600 bg-green-50 dark:bg-green-950/30"
                : "border-red-600 bg-red-50 dark:bg-red-950/30"
              : "border-border"

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${variantClass}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-mono">{opt}</span>
                </div>
              </button>
            )
          })}

          {answers[current] !== null && q.explanation && (
            <div className="mt-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">💡</span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Explanation</p>
                  <p className="text-sm text-muted-foreground">{q.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={handlePrev} disabled={current === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {answers[current] === null ? (
              <Button onClick={() => selected !== null && handleAnswerSelect(selected)} disabled={selected === null}>
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {current === total - 1 ? "Finish Quiz" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
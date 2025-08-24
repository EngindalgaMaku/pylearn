"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import GameSEOSection from "@/components/games/GameSEOSection"

const PY_KEYWORDS = new Set([
  "False","None","True","and","as","assert","async","await","break","class","continue","def","del","elif","else","except","finally",
  "for","from","global","if","import","in","is","lambda","nonlocal","not","or","pass","raise","return","try","while","with","yield"
])

function isValidIdentifier(name: string): boolean {
  // Must start with letter or underscore, then letters, digits or underscore
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return false
  // Cannot be a keyword
  if (PY_KEYWORDS.has(name)) return false
  return true
}

type Round = {
  id: number
  candidate: string
  isValid: boolean
}

function buildRounds(): Round[] {
  // Pool of candidate names (some valid, some invalid)
  const candidates = [
    "name","_counter","age2","2cool","first-name","total_sum","None","class","__init__","_","is_valid",
    "π","price€","snake_case","camelCase","PascalCase","var!","with","yieldValue","_private","MAX_VALUE","min-value",
    "a","__", "value_1","1_value","_1", "for","while_","sum_2","data_set","index","list","dict","set","val__id","__version__",
    "HelloWorld","hello_world","hello world","email_address","_temp","return","_async","async_mode","awaiting","await","break_point",
    "HTTPResponse","http_response","user__id","Üser","naïve","résumé","valid_name","invalid-name","valid_name_2"
  ]
  // Create rounds with computed validity
  const rounds: Round[] = candidates.map((c, idx) => ({
    id: idx + 1,
    candidate: c,
    isValid: isValidIdentifier(c),
  }))

  // Shuffle and take 12
  for (let i = rounds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rounds[i], rounds[j]] = [rounds[j], rounds[i]]
  }
  return rounds.slice(0, 12)
}

export default function VariableNamingGame() {
  const rounds = useMemo(buildRounds, [])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState<null | boolean>(null) // null until answered; true if correct, false if wrong
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [started, setStarted] = useState(false)
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const { toast } = useToast()
  const { data: session, update } = useSession()
  const [reward, setReward] = useState<{ xp: number; diamonds: number } | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [prevXP, setPrevXP] = useState<number | null>(null)
  const [prevDiamonds, setPrevDiamonds] = useState<number | null>(null)

  useEffect(() => {
    if (!started || gameOver) return
    if (timeLeft <= 0 && answered === null) {
      // Auto mark wrong due to timeout
      setAnswered(false)
      return
    }
    if (answered === null) {
      const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [timeLeft, started, gameOver, answered])

  const round = rounds[current]
  const progressPct = Math.round(((current + 1) / rounds.length) * 100)

  const onStart = () => {
    setStarted(true)
    setTimeLeft(20)
    runStartRef.current = Date.now()
    postedRef.current = false
  }

  const submitAnswer = (guessValid: boolean) => {
    if (answered !== null) return
    const correct = guessValid === round.isValid
    setAnswered(correct)
    if (correct) setScore((s) => s + 1)
  }

  const next = () => {
    if (current < rounds.length - 1) {
      setCurrent((c) => c + 1)
      setAnswered(null)
      setTimeLeft(20)
    } else {
      setGameOver(true)
    }
  }

  const restart = () => {
    // Fresh game
    const fresh = buildRounds()
    // Hack: replace array by mutating reference via indices (simple reset)
    rounds.splice(0, rounds.length, ...fresh)
    setCurrent(0)
    setScore(0)
    setAnswered(null)
    setGameOver(false)
    setTimeLeft(20)
    setStarted(false)
    runStartRef.current = null
    postedRef.current = false
  }

  // Post session when game over
  useEffect(() => {
    const postSession = async () => {
      if (!gameOver || !started || postedRef.current) return
      postedRef.current = true
      // Open modal immediately with best-known current totals; server values will replace shortly
      setPrevXP((session?.user as any)?.experience ?? 0)
      setPrevDiamonds((session?.user as any)?.currentDiamonds ?? 0)
      setShowReward(true)
      const startedAt = runStartRef.current ?? Date.now()
      const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      try {
        const res = await fetch("/api/games/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameKey: "variable-naming",
            score,
            correctCount: score,
            durationSec,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json().catch(() => ({}))
        const xp = data?.rewards?.xp ?? 0
        const diamonds = data?.rewards?.diamonds ?? 0
        const beforeXP = data?.totals?.before?.xp
        const beforeDiamonds = data?.totals?.before?.diamonds
        const afterXP = data?.totals?.after?.xp
        const afterDiamonds = data?.totals?.after?.diamonds
        setReward({ xp, diamonds })
        if (typeof beforeXP === "number") setPrevXP(beforeXP); else setPrevXP((session?.user as any)?.experience ?? 0)
        if (typeof beforeDiamonds === "number") setPrevDiamonds(beforeDiamonds); else setPrevDiamonds((session?.user as any)?.currentDiamonds ?? 0)
        try {
          if (typeof afterXP === "number" || typeof afterDiamonds === "number") {
            await update?.({
              experience: typeof afterXP === "number" ? afterXP : ((session?.user as any)?.experience ?? 0) + xp,
              currentDiamonds: typeof afterDiamonds === "number" ? afterDiamonds : ((session?.user as any)?.currentDiamonds ?? 0) + diamonds,
            })
          } else {
            const curXP = (session?.user as any)?.experience ?? 0
            const curDiamonds = (session?.user as any)?.currentDiamonds ?? 0
            await update?.({ experience: curXP + xp, currentDiamonds: curDiamonds + diamonds })
          }
        } catch {
          // keep modal open even if update fails
        }
      } catch (e) {
        console.error("Failed to post game session (variable-naming)", e)
        toast({
          title: "Session save failed",
          description: "We couldn't record your game session. Your progress may not update.",
          variant: "destructive",
        })
      }
    }
    postSession()
  }, [gameOver, started, score, session, update, toast])

  if (!started) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Variable Detective</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🕵️</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Find Valid Python Names</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-left">
                <h3 className="font-medium">Rules:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Start with a letter or underscore</li>
                  <li>• Then use letters, digits or underscore</li>
                  <li>• No spaces or hyphens</li>
                  <li>• Don't use Python keywords (like class, return, None)</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">12 Rounds</Badge>
                <Badge variant="outline">Up to +10 XP + 💎</Badge>
              </div>

              <GameSEOSection
                title="Variable Naming Game"
                description="Learn Python variable name rules through quick yes/no rounds. Optimized for mobile with clear guidance and instant feedback."
                keywords={["python variable names", "python identifiers", "learn python mobile", "beginner python quiz", "python rules"]}
                features={["Mobile-first layout for one-handed play", "12 quick rounds to build habits", "Earn XP and diamonds per correct answer", "Short explanations after each question"]}
                faq={[
                  { q: "What makes a name valid?", a: "Start with a letter or underscore, then letters/digits/underscore; avoid keywords." },
                  { q: "How are rewards given?", a: "1 XP and 1 diamond per correct answer, synced with your profile." },
                ]}
              />

              <Button onClick={onStart} className="w-full">
                Start Game
              </Button>
            </CardContent>
          </Card>
          {/* Rewards Popup */}
          <Dialog open={showReward} onOpenChange={setShowReward}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center text-xl">Rewards Unlocked! 🎉</DialogTitle>
                <DialogDescription className="text-center">Keep playing to earn more XP and diamonds.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border p-3 bg-primary/5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-2xl">⭐</span><span className="font-medium">XP</span></div>
                      <div className="text-right"><div className="text-sm text-muted-foreground">Before</div><div className="font-semibold">{prevXP ?? (session?.user as any)?.experience ?? 0}</div></div>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-primary"><span className="text-xs uppercase tracking-wide">+ Gained</span><span className="font-bold">{reward?.xp ?? 0}</span></div>
                    <div className="mt-2 text-center text-sm text-muted-foreground">=<span className="ml-2 font-semibold text-foreground">{(prevXP ?? (session?.user as any)?.experience ?? 0) + (reward?.xp ?? 0)}</span></div>
                  </div>
                  <div className="rounded-lg border p-3 bg-secondary/10 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-2xl">💎</span><span className="font-medium">Diamonds</span></div>
                      <div className="text-right"><div className="text-sm text-muted-foreground">Before</div><div className="font-semibold">{prevDiamonds ?? (session?.user as any)?.currentDiamonds ?? 0}</div></div>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-primary"><span className="text-xs uppercase tracking-wide">+ Gained</span><span className="font-bold">{reward?.diamonds ?? 0}</span></div>
                    <div className="mt-2 text-center text-sm text-muted-foreground">=<span className="ml-2 font-semibold text-foreground">{(prevDiamonds ?? (session?.user as any)?.currentDiamonds ?? 0) + (reward?.diamonds ?? 0)}</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setShowReward(false)}>Keep Playing ▶️</Button>
                  <Link href="/games" className="flex-1"><Button variant="outline" className="w-full">More Games</Button></Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    )
  }

  if (gameOver) {
    const pct = Math.round((score / rounds.length) * 100)
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Case Closed!</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">{pct >= 80 ? "🏆" : pct >= 60 ? "🎉" : "📚"}</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">
                {pct >= 80 ? "Master Sleuth!" : pct >= 60 ? "Great Detective!" : "Training Continues!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">
                  {score}/{rounds.length}
                </div>
                <div className="text-sm text-muted-foreground">Correct Identifiers Found</div>
              </div>

              <Badge variant="secondary" className="text-sm px-3 py-1">
                +{score * 5} XP Earned
              </Badge>

              <div className="flex gap-3">
                <Button onClick={restart} variant="outline" className="flex-1 bg-transparent">
                  Play Again
                </Button>
                <Link href="/games" className="flex-1">
                  <Button className="w-full">More Games</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Round {current + 1} of {rounds.length}
              </Badge>
              <Badge variant={timeLeft <= 5 ? "destructive" : "secondary"} className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeLeft}s
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center font-[family-name:var(--font-work-sans)]">
              Is this a valid Python variable name?
            </CardTitle>
            <div className="bg-muted p-4 rounded-lg font-mono text-center text-lg">
              {round.candidate}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={answered === null ? "outline" : (round.isValid ? "default" : "secondary")}
                className="h-12"
                onClick={() => submitAnswer(true)}
                disabled={answered !== null}
              >
                Valid
              </Button>
              <Button
                variant={answered === null ? "outline" : (!round.isValid ? "default" : "secondary")}
                className="h-12"
                onClick={() => submitAnswer(false)}
                disabled={answered !== null}
              >
                Invalid
              </Button>
            </div>

            {answered !== null && (
              <div className="text-center space-y-3">
                {answered ? (
                  <p className="text-primary font-medium inline-flex items-center gap-2 justify-center">
                    <CheckCircle className="w-4 h-4" /> Correct!
                  </p>
                ) : (
                  <p className="text-destructive font-medium inline-flex items-center gap-2 justify-center">
                    <XCircle className="w-4 h-4" /> Not quite.
                  </p>
                )}

                {/* Quick explanation */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-left">
                  <div className="font-semibold mb-1">Why?</div>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Must start with a letter or underscore</li>
                    <li>Can contain letters, digits, and underscores</li>
                    <li>No spaces or hyphens; avoid Python keywords</li>
                  </ul>
                </div>

                <Button onClick={next} className="w-full">
                  {current === rounds.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
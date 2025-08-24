"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useSpeedTimer } from "@/hooks/useSpeedTimer"
import GameSEOSection from "@/components/games/GameSEOSection"

// Loop Runner: predict the output/iterations of small for/while loops

type LQ = { id: number; prompt: string; answer: string; options: string[] }

function generatePool(): LQ[] {
  const items: LQ[] = []
  let id = 1
  const add = (prompt: string, answer: string, options: string[]) => items.push({ id: id++, prompt, answer, options })

  // Simple range prints
  for (const n of [3, 4, 5, 6, 7, 8, 9, 10]) {
    const seq = Array.from({ length: n }, (_, i) => i).join("")
    add(`for i in range(${n}):\n    print(i, end='')`, seq, [seq, `${n}`, `0..${n - 1}`, "[" + Array.from({ length: n }, (_, i) => i).join(",") + "]"])
  }

  // Range with start
  for (const [s, e] of [[1, 4], [2, 6], [3, 7], [5, 9]] as const) {
    const seq = Array.from({ length: e - s }, (_, i) => s + i).join("")
    add(`for i in range(${s},${e}):\n    print(i, end='')`, seq, [seq, `${s}${e}`, `${s}-${e - 1}`, "[]"])
  }

  // Sum of first n numbers
  for (const n of [3, 4, 5, 6, 7, 10, 12, 15]) {
    const sum = (n * (n - 1)) / 2
    add(`s = 0\nfor i in range(${n}):\n    s += i\nprint(s)`, String(sum), [String(sum), String(sum + n), String(n), String(sum - 1)])
  }

  // While loop counters
  for (const n of [2, 3, 4, 5, 6, 7, 8]) {
    add(`i = 0\nwhile i < ${n}:\n    i += 1\nprint(i)`, String(n), [String(n), String(n - 1), String(n + 1), "0"])
  }

  // Nested loop count
  for (const [a, b] of [[2, 2], [2, 3], [3, 3], [3, 4], [4, 2]] as const) {
    const cnt = a * b
    add(`c = 0\nfor i in range(${a}):\n    for j in range(${b}):\n        c += 1\nprint(c)`, String(cnt), [String(cnt), String(cnt - a), String(a + b), String(a * (b - 1))])
  }

  // Iterate over list
  const lists = [
    [1, 2, 3],
    [2, 4, 6, 8],
    [3, 1, 4, 1, 5],
  ]
  for (const arr of lists) {
    const seq = arr.join("")
    add(`for x in ${JSON.stringify(arr)}:\n    print(x, end='')`, seq, [seq, String(arr.length), "[...]", seq + "0"])
  }

  // Break condition
  for (const n of [3, 5, 7]) {
    const seq = Array.from({ length: n }, (_, i) => i).join("")
    add(`for i in range(10):\n    if i == ${n}:\n        break\n    print(i, end='')`, seq, [seq, "0123456789", String(n), ""])
  }

  // Continue skipping odds
  const seqEven = (limit: number) => Array.from({ length: limit }, (_, i) => i).filter((x) => x % 2 === 0).join("")
  for (const n of [6, 8, 10, 12]) {
    add(`for i in range(${n}):\n    if i % 2 == 1:\n        continue\n    print(i, end='')`, seqEven(n), [seqEven(n), String(n), "024", "135"])
  }

  // Length of list
  for (const arr of [[1], [1, 2], [1, 2, 3, 4], [9, 9, 9, 9, 9]]) {
    add(`nums = ${JSON.stringify(arr)}\nprint(len(nums))`, String(arr.length), [String(arr.length), String(arr.length - 1), JSON.stringify(arr), "len"])
  }

  // Ensure at least 50
  while (items.length < 50) {
    const n = items.length % 9 + 3
    const seq = Array.from({ length: n }, (_, i) => i).join("")
    add(`for i in range(${n}):\n    print(i, end='')`, seq, [seq, `${n}`, "[...]"])
  }

  return items
}

function shuffle<T>(a: T[]): T[] { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random()* (i+1)); [c[i], c[j]] = [c[j], c[i]] } return c }

export default function LoopRunnerGame() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const pool = useMemo(() => generatePool(), [])
  const questions = useMemo(() => shuffle(pool).slice(0, 6).map(q => ({ ...q, options: shuffle(q.options) })), [pool])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [started, setStarted] = useState(false)
  const QUESTION_TIME = 20
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const [reward, setReward] = useState<{ xp: number; diamonds: number } | null>(null)
  const [showReward, setShowReward] = useState(false)
  const [prevXP, setPrevXP] = useState<number | null>(null)
  const [prevDiamonds, setPrevDiamonds] = useState<number | null>(null)
  const { timeLeft, bonusXP, lastBonus, markQuestionStart, registerAnswerCorrect, resetBonuses } = useSpeedTimer(
    QUESTION_TIME,
    started,
    completed,
    showResult,
    () => { setSelected("__timeout__"); setShowResult(true) }
  )

  const q = questions[idx]
  const progress = questions.length ? ((idx + 1) / questions.length) * 100 : 0

  // countdown handled by useSpeedTimer

  const start = () => { setStarted(true); setIdx(0); setScore(0); setSelected(null); setShowResult(false); setCompleted(false); runStartRef.current = Date.now(); postedRef.current = false; resetBonuses(); markQuestionStart() }
  const choose = (opt: string) => {
    if (showResult) return
    setSelected(opt)
    setShowResult(true)
    if (opt === q.answer) { setScore(s => s + 1); registerAnswerCorrect() }
  }
  const next = () => { if (idx < questions.length - 1) { setIdx(i => i + 1); setSelected(null); setShowResult(false); markQuestionStart() } else { setCompleted(true) } }
  const restart = () => { setStarted(false); setIdx(0); setScore(0); setSelected(null); setShowResult(false); setCompleted(false); runStartRef.current = null; postedRef.current = false; resetBonuses() }

  useEffect(() => {
    const post = async () => {
      if (!completed || postedRef.current) return
      postedRef.current = true
      // Open modal immediately with best-known current totals; server values will replace shortly
      setPrevXP((session?.user as any)?.experience ?? 0)
      setPrevDiamonds((session?.user as any)?.currentDiamonds ?? 0)
      setShowReward(true)
      const startedAt = runStartRef.current ?? Date.now()
      const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      try {
        const res = await fetch("/api/games/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameKey: "loop-runner", score, correctCount: score, durationSec, bonusXP }) })
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
        toast({ title: "Session save failed", description: "Could not record your Loop Runner session.", variant: "destructive" })
      }
    }
    post()
  }, [completed, score, bonusXP, session, update, toast])

  if (!started) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Loop Runner</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">🔁</span></div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Predict Loop Outputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 justify-center"><Badge variant="secondary">6 Questions</Badge><Badge variant="outline">Up to +10 XP + 💎</Badge></div>

              <GameSEOSection
                title="Loop Runner Game"
                description="Train your Python loop intuition by predicting outputs. Designed mobile-first for quick practice sessions."
                keywords={["python loops", "for loop quiz", "while loop practice", "python beginner game", "mobile coding game"]}
                features={["One-question-at-a-time mobile layout", "Speed bonus encourages focus", "Earn XP and diamonds per correct", "Short runs perfect for commuting"]}
                faq={[
                  { q: "What do I practice?", a: "Reading loop behavior, ranges, break/continue, and list iteration." },
                  { q: "How are rewards calculated?", a: "1 XP and 1 diamond per correct answer. Bonuses may add XP." },
                ]}
              />

              <Button onClick={start} className="w-full">Start</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (completed) {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Run Complete</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">{pct >= 80 ? "🏆" : "🎉"}</span></div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Your Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1"><div className="text-3xl font-bold text-primary">{score}/{questions.length}</div><div className="text-sm text-muted-foreground">Correct Answers</div></div>
              {reward ? (
                <Badge variant="secondary" className="text-sm px-3 py-1">+{reward.xp} XP, +{reward.diamonds} 💎</Badge>
              ) : (
                <Badge variant="secondary" className="text-sm px-3 py-1">Rewards applied</Badge>
              )}
              <div className="flex gap-3"><Button onClick={restart} variant="outline" className="flex-1 bg-transparent">Play Again</Button><Link href="/games" className="flex-1"><Button className="w-full">More Games</Button></Link></div>
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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/games"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div className="flex items-center gap-4"><Badge variant="outline">Q {idx + 1} of {questions.length}</Badge><Badge variant={timeLeft <= 5 ? "destructive" : "secondary"} className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeLeft}s</Badge></div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center font-[family-name:var(--font-work-sans)]">What is the output?</CardTitle>
            <div className="bg-muted p-4 rounded-lg font-mono text-left text-sm whitespace-pre-line">{q?.prompt}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {q?.options.map((opt) => (
                <Button key={opt} variant={selected === null ? "outline" : (opt === q.answer ? "default" : "secondary")} className="h-12" onClick={() => choose(opt)} disabled={showResult}>{opt}</Button>
              ))}
            </div>
            {showResult && (
              <div className="mt-2 text-center">
                {selected === q.answer ? (
                  <p className="text-primary font-medium inline-flex items-center gap-2 justify-center"><CheckCircle className="w-4 h-4" /> Correct!</p>
                ) : (
                  <p className="text-destructive font-medium inline-flex items-center gap-2 justify-center"><XCircle className="w-4 h-4" /> {selected === "__timeout__" ? "Time's up!" : "Incorrect"}</p>
                )}
                <Button onClick={next} className="mt-4 w-full">{idx === questions.length - 1 ? "Finish" : "Next"}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

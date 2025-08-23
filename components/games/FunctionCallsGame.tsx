"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSpeedTimer } from "@/hooks/useSpeedTimer"

// Function Calls: given a small function and call, choose the correct output

type FQ = { id: number; prompt: string; answer: string; options: string[] }

function generatePool(): FQ[] {
  const items: FQ[] = []
  let id = 1
  const add = (prompt: string, answer: string, opts: string[]) => items.push({ id: id++, prompt, answer, options: opts })

  // Simple arithmetic
  for (const [a, b] of [[1, 2], [2, 3], [5, 7], [10, -3], [4, 4], [6, 9]]) {
    const ans = String(a + b)
    add(`def add(a,b):\n    return a+b\nprint(add(${a},${b}))`, ans, [ans, String(a * b), String(a - b), String(b - a)])
  }

  // Squares and default
  for (const x of [2, 3, 4, 5, 7, 9]) {
    const ans = String(x * x)
    add(`def f(x=2):\n    return x*x\nprint(f(${x}))`, ans, [ans, String(x + x), String(x), String(x ** 3)])
  }

  // Subtraction with default param
  for (const a of [3, 5, 7, 9, 12]) {
    const ans = String(a - 1)
    add(`def g(a, b=1):\n    return a-b\nprint(g(${a}))`, ans, [ans, String(a + 1), String(a), "Error"])
  }

  // String methods
  for (const s of ["'hi'", "'Py'", "'abc'"]) {
    add(`def h(s):\n    return s.upper()\nprint(h(${s}))`, s.replace(/'/g, "").toUpperCase(), [s.replace(/'/g, "").toUpperCase(), s.replace(/'/g, ""), s.replace(/'/g, "").toLowerCase(), "Error"])
  }

  // Join and length
  for (const arr of [[1, 2, 3], [2, 4], [3, 1, 4, 1]]) {
    add(`def f(a):\n    return len(a)\nprint(f(${JSON.stringify(arr)}))`, String(arr.length), [String(arr.length), String(arr.length + 1), String(arr[0] ?? 0), "Error"])
    const joined = arr.join("-")
    add(`def g(a):\n    return '-'.join([str(x) for x in a])\nprint(g(${JSON.stringify(arr)}))`, joined, [joined, String(arr.length), "[...]", joined + "-"])
  }

  // Keyword args
  for (const [a, b] of [[3, 4], [5, 2]]) {
    const ans = String(a * b)
    add(`def area(w,h):\n    return w*h\nprint(area(h=${b}, w=${a}))`, ans, [ans, String(a + b), String(a - b), String(a ** b)])
  }

  // Multiple returns
  for (const [a, b] of [[2, 3], [4, 5]]) {
    const ans = String(a + b)
    add(`def calc(a,b):\n    return a+b, a-b\nx, y = calc(${a},${b})\nprint(x)`, ans, [ans, String(a - b), String(a * b), String(a ** b)])
  }

  // Ensure at least 50
  while (items.length < 50) {
    const n = items.length % 7 + 2
    const ans = String(n * (n + 1))
    add(`def h(n):\n    return n*(n+1)\nprint(h(${n}))`, ans, [ans, String(n + (n + 1)), String(n ** 2), "Error"])
  }

  return items
}

function shuffle<T>(a: T[]): T[] { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random()* (i+1)); [c[i], c[j]] = [c[j], c[i]] } return c }

export default function FunctionCallsGame() {
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
  const QUESTION_TIME = 18
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const [reward, setReward] = useState<{ xp: number; diamonds: number } | null>(null)
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
      const startedAt = runStartRef.current ?? Date.now()
      const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      try {
        const res = await fetch("/api/games/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameKey: "function-calls", score, correctCount: score, durationSec, bonusXP }) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json().catch(() => ({}))
        const xp = data?.rewards?.xp ?? 0
        const diamonds = data?.rewards?.diamonds ?? 0
        setReward({ xp, diamonds })
        try {
          const curXP = (session?.user as any)?.experience ?? 0
          const curDiamonds = (session?.user as any)?.currentDiamonds ?? 0
          await update?.({ experience: curXP + xp, currentDiamonds: curDiamonds + diamonds })
        } catch {}
      } catch (e) {
        toast({ title: "Session save failed", description: "Could not record your Function Calls session.", variant: "destructive" })
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
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Function Calls</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">📞</span></div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Predict Function Outputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 justify-center"><Badge variant="secondary">6 Questions</Badge><Badge variant="outline">Up to +10 XP + 💎</Badge></div>
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
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Challenge Complete</h1>
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

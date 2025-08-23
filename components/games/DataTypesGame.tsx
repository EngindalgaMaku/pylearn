"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSpeedTimer } from "@/hooks/useSpeedTimer"

// Simple data types recognition quiz

type DTQ = { id: number; value: string; type: string; options: string[] }

function generatePool(): DTQ[] {
  const types = ["int", "float", "str", "bool", "list", "tuple", "set", "dict"] as const
  const opts = (correct: string) => {
    const o = types.filter((t) => t !== correct)
    return [correct, o[0], o[1], o[2]]
  }

  const items: DTQ[] = []
  let id = 1
  // ints
  for (const n of [0, 1, 2, 7, 10, 42, -1, 1000]) items.push({ id: id++, value: String(n), type: "int", options: opts("int") })
  // floats
  for (const f of [0.5, 3.14, -2.0, 1e3, 2.718, 10.0, 5.5]) items.push({ id: id++, value: String(f), type: "float", options: opts("float") })
  // strings
  for (const s of ["'hello'", '"world"', "'42'", "'True'", "'3.14'", "'a'", "'list'"]) items.push({ id: id++, value: s, type: "str", options: opts("str") })
  // bools
  for (const b of ["True", "False"]) items.push({ id: id++, value: b, type: "bool", options: opts("bool") })
  // lists
  for (const l of ["[]", "[1]", "[1,2,3]", "['a','b']", "[True, False]", "[3.14, 2.71]"]) items.push({ id: id++, value: l, type: "list", options: opts("list") })
  // tuples
  for (const t of ["()", "(1,)", "(1,2)", "('a','b')", "(True, False)"]) items.push({ id: id++, value: t, type: "tuple", options: opts("tuple") })
  // sets
  for (const s of ["set()", "{1,2}", "{'a','b'}", "{True, False}"]) items.push({ id: id++, value: s, type: "set", options: opts("set") })
  // dicts
  for (const d of ["{}", "{'a':1}", "{1:'a'}", "{'x':True}", "{'k':[1,2]}", "{'pi':3.14}"]) items.push({ id: id++, value: d, type: "dict", options: opts("dict") })

  // Pad to at least 50 by adding mixed examples
  const extras: Array<[string, string]> = [
    ["'python'", "str"],
    ["[('a',1), ('b',2)]", "list"],
    ["({'a', 'b'})", "set"],
    ["((1,2),(3,4))", "tuple"],
    ["{'nums': [1,2,3]}", "dict"],
    ["-3", "int"],
    ["0.0", "float"],
    ["True", "bool"],
    ["'False'", "str"],
  ]
  for (const [v, t] of extras) items.push({ id: id++, value: v, type: t, options: opts(t) })
  while (items.length < 50) {
    // cycle simple variants
    const v = String(items.length)
    items.push({ id: id++, value: v, type: "int", options: opts("int") })
  }
  return items
}

function shuffle<T>(a: T[]): T[] { const c = a.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random()* (i+1)); [c[i], c[j]] = [c[j], c[i]] } return c }

export default function DataTypesGame() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const pool = useMemo(() => generatePool(), [])
  const questions = useMemo(() => shuffle(pool).slice(0, 6).map(q => ({...q, options: shuffle(q.options)})), [pool])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [started, setStarted] = useState(false)
  const QUESTION_TIME = 12
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

  const start = () => {
    setStarted(true)
    setIdx(0)
    setScore(0)
    setSelected(null)
    setShowResult(false)
    setCompleted(false)
    runStartRef.current = Date.now()
    postedRef.current = false
    resetBonuses()
    markQuestionStart()
  }

  const choose = (opt: string) => {
    if (showResult) return
    setSelected(opt)
    setShowResult(true)
    if (opt === q.type) { setScore(s => s + 1); registerAnswerCorrect() }
  }

  const next = () => {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1)
      setSelected(null)
      setShowResult(false)
      markQuestionStart()
    } else {
      setCompleted(true)
    }
  }

  const restart = () => {
    setStarted(false)
    setIdx(0)
    setScore(0)
    setSelected(null)
    setShowResult(false)
    setCompleted(false)
    runStartRef.current = null
    postedRef.current = false
    resetBonuses()
  }

  // Post session when complete
  useEffect(() => {
    const post = async () => {
      if (!completed || postedRef.current) return
      postedRef.current = true
      const startedAt = runStartRef.current ?? Date.now()
      const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      try {
        const res = await fetch("/api/games/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameKey: "data-types", score, correctCount: score, durationSec, bonusXP }),
        })
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
        toast({ title: "Session save failed", description: "Could not record your Data Types session.", variant: "destructive" })
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
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Data Types</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">📦</span></div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Identify Python Data Types</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">6 Questions</Badge>
                <Badge variant="outline">Up to +10 XP + 💎</Badge>
              </div>
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
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Quiz Complete</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4"><span className="text-4xl">{pct >= 80 ? "🏆" : "🎉"}</span></div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Your Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">{score}/{questions.length}</div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </div>
              {reward ? (
                <Badge variant="secondary" className="text-sm px-3 py-1">+{reward.xp} XP, +{reward.diamonds} 💎</Badge>
              ) : (
                <Badge variant="secondary" className="text-sm px-3 py-1">Rewards applied</Badge>
              )}
              <div className="flex gap-3">
                <Button onClick={restart} variant="outline" className="flex-1 bg-transparent">Play Again</Button>
                <Link href="/games" className="flex-1"><Button className="w-full">More Games</Button></Link>
              </div>
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
            <div className="flex items-center gap-4">
              <Badge variant="outline">Q {idx + 1} of {questions.length}</Badge>
              <Badge variant={timeLeft <= 5 ? "destructive" : "secondary"} className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeLeft}s</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center font-[family-name:var(--font-work-sans)]">What is the type of this value?</CardTitle>
            <div className="bg-muted p-4 rounded-lg font-mono text-center text-lg">{q?.value}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {q?.options.map((opt) => (
                <Button key={opt} variant={selected === null ? "outline" : (opt === q.type ? "default" : "secondary")} className="h-12" onClick={() => choose(opt)} disabled={showResult}>
                  {opt}
                </Button>
              ))}
            </div>
            {showResult && (
              <div className="mt-2 text-center">
                {selected === q.type ? (
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

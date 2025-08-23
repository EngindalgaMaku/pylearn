"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getMatchingConfig, type MatchingConfig, type MatchingPair } from "@/components/activities/matching/matching-banks"
import { Clock, Play, RotateCcw, Trophy } from "lucide-react"

export type MemoryMatchProps = {
  // When provided, use this slug to fetch a matching bank and generate cards
  slug?: string
  // Optional override for title shown in the UI
  title?: string
  // Optional time limit in seconds (defaults to config timeLimitSec or 180)
  timeLimitSec?: number
  // Limit number of pairs from the config (e.g., 8 => 16 tiles)
  pairCount?: number
}

// Internal card model produced from MatchingPair
interface CardFace {
  pairIndex: number
  face: "left" | "right"
  text: string
  gameId: string // unique id for this card instance
  isFlipped: boolean
  isMatched: boolean
}

function buildCardsFromPairs(pairs: MatchingPair[], limit?: number): CardFace[] {
  const used = typeof limit === "number" && limit > 0 ? pairs.slice(0, Math.min(limit, pairs.length)) : pairs
  const cards: CardFace[] = []
  used.forEach((p, idx) => {
    cards.push({ pairIndex: idx, face: "left", text: p.left, gameId: `${idx}-L`, isFlipped: false, isMatched: false })
    cards.push({ pairIndex: idx, face: "right", text: p.right, gameId: `${idx}-R`, isFlipped: false, isMatched: false })
  })
  // Shuffle
  const a = [...cards]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MemoryMatchGame({ slug = "python-basics-matching", title, timeLimitSec, pairCount = 8 }: MemoryMatchProps) {
  const { data: session, update } = useSession()
  const cfg: MatchingConfig | null = useMemo(() => getMatchingConfig(slug), [slug])
  const effectiveTitle = title || cfg?.title || "Memory Match"
  const limit = typeof timeLimitSec === "number" && !Number.isNaN(timeLimitSec) ? timeLimitSec : cfg?.timeLimitSec ?? 180

  const [cards, setCards] = useState<CardFace[]>(() => buildCardsFromPairs(cfg?.pairs || [], pairCount))
  const [flipped, setFlipped] = useState<CardFace[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [moves, setMoves] = useState(0)
  const [timeLeft, setTimeLeft] = useState(limit)
  const [phase, setPhase] = useState<"start" | "playing" | "completed">("start")
  const [startAt, setStartAt] = useState<Date | null>(null)
  const [endAt, setEndAt] = useState<Date | null>(null)
  const [reward, setReward] = useState<{ xp: number; diamonds: number } | null>(null)

  // Rebuild when config changes
  useEffect(() => {
    setCards(buildCardsFromPairs(cfg?.pairs || [], pairCount))
    setFlipped([])
    setMatchedPairs(0)
    setMoves(0)
    setTimeLeft(limit)
    setPhase("start")
    setStartAt(null)
    setEndAt(null)
  }, [cfg, pairCount, limit])

  // Timer
  useEffect(() => {
    if (phase !== "playing") return
    if (timeLeft <= 0) {
      completeRun(false)
      return
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  // Evaluate when 2 flipped
  useEffect(() => {
    if (flipped.length !== 2) return

    setMoves((m) => m + 1)
    const [a, b] = flipped
    const isMatch = a.pairIndex === b.pairIndex && a.face !== b.face

    if (isMatch) {
      setTimeout(() => {
        setCards((prev) => prev.map((c) => (c.pairIndex === a.pairIndex ? { ...c, isMatched: true } : c)))
        setMatchedPairs((p) => p + 1)
        setFlipped([])
      }, 550)
    } else {
      setTimeout(() => {
        setCards((prev) => prev.map((c) => (c.gameId === a.gameId || c.gameId === b.gameId ? { ...c, isFlipped: false } : c)))
        setFlipped([])
      }, 900)
    }
  }, [flipped])

  // Auto complete if all matched
  useEffect(() => {
    const totalPairs = Math.floor(cards.length / 2)
    if (phase === "playing" && totalPairs > 0 && matchedPairs === totalPairs) {
      completeRun(true)
    }
  }, [matchedPairs, cards.length, phase])

  function startRun() {
    setPhase("playing")
    setTimeLeft(limit)
    setStartAt(new Date())
  }

  async function completeRun(won: boolean) {
    setPhase("completed")
    const ended = new Date()
    setEndAt(ended)
    const durationSec = startAt ? Math.max(0, Math.round((ended.getTime() - startAt.getTime()) / 1000)) : limit - timeLeft

    // Post session like other games
    try {
      const payload = {
        gameKey: "memory-match",
        score: matchedPairs, // simple scoring: number of matched pairs
        correctCount: matchedPairs,
        durationSec,
      }
      const res = await fetch("/api/games/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    } catch {}
  }

  function onCardClick(c: CardFace) {
    if (phase !== "playing") return
    if (c.isMatched || c.isFlipped) return
    if (flipped.length === 2) return

    setCards((prev) => prev.map((x) => (x.gameId === c.gameId ? { ...x, isFlipped: true } : x)))
    setFlipped((arr) => [...arr, { ...c, isFlipped: true }])
  }

  function resetRun() {
    setCards(buildCardsFromPairs(cfg?.pairs || [], pairCount))
    setFlipped([])
    setMatchedPairs(0)
    setMoves(0)
    setTimeLeft(limit)
    setPhase("start")
    setStartAt(null)
    setEndAt(null)
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const totalPairs = Math.floor(cards.length / 2)
  const pct = totalPairs ? Math.round((matchedPairs / totalPairs) * 100) : 0

  if (!cfg || (cfg.pairs || []).length === 0) {
    return <div className="text-center text-muted-foreground">No memory config found.</div>
  }

  if (phase === "start") {
    return (
      <div className="mt-4">
        <Card className="w-full">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-3 md:space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">{effectiveTitle}</h2>
              <p className="text-muted-foreground">Find all {totalPairs} matching pairs before time runs out</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="font-semibold">{totalPairs} Pairs</div>
                <div className="text-sm text-muted-foreground">Cards</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{Math.floor(limit / 60)} Minutes</div>
                <div className="text-sm text-muted-foreground">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">Up to +10 XP + 💎</div>
                <div className="text-sm text-muted-foreground">Sharpen your memory</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">How it works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Click two cards to flip them</li>
                <li>• If they match, they stay revealed</li>
                <li>• Match all pairs before the timer hits zero</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={resetRun}>Reset</Button>
              <Button onClick={startRun} className="px-8"><Play className="w-4 h-4 mr-2"/>Start</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === "completed") {
    const durationSec = startAt && endAt ? Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 1000)) : limit - timeLeft
    return (
      <div className="mt-4 space-y-6">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Run Completed</h2>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-primary">{pct}%</p>
              <p className="text-muted-foreground">{matchedPairs} of {totalPairs} pairs matched</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{formatTime(durationSec)}</div><div className="text-sm text-muted-foreground">Total Time</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><Badge variant="outline">Moves</Badge><div className="text-2xl font-bold">{moves}</div><div className="text-sm text-muted-foreground">Total Moves</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><Badge variant="outline">Pairs</Badge><div className="text-2xl font-bold">{totalPairs}</div><div className="text-sm text-muted-foreground">Total Pairs</div></CardContent></Card>
        </div>

        {reward ? (
          <div className="flex justify-center"><Badge variant="secondary" className="text-sm px-3 py-1">+{reward.xp} XP, +{reward.diamonds} 💎</Badge></div>
        ) : null}

        <div className="flex gap-3 justify-center pb-2">
          <Button variant="outline" onClick={resetRun}><RotateCcw className="w-4 h-4 mr-2"/>Try Again</Button>
        </div>
      </div>
    )
  }

  // Playing UI
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Badge variant="outline">{matchedPairs} / {totalPairs} matched</Badge></div>
        <div className="flex items-center gap-2 text-primary"><Clock className="w-4 h-4" /><span className="font-mono font-medium">{formatTime(timeLeft)}</span></div>
      </div>
      <Progress value={pct} className="h-2 mb-4" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{effectiveTitle}</CardTitle>
          <CardDescription>Find the matching pairs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 md:gap-4 ${cards.length <= 8 ? "grid-cols-4" : cards.length <= 12 ? "grid-cols-4 md:grid-cols-6" : "grid-cols-4 md:grid-cols-6 lg:grid-cols-8"}`}>
            {cards.map((c) => (
              <button
                key={c.gameId}
                onClick={() => onCardClick(c)}
                className={`relative h-24 transition-all duration-300 rounded-lg border-2 ${
                  c.isMatched ? "opacity-50 cursor-default border-border" : c.isFlipped ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                {(c.isFlipped || c.isMatched) ? (
                  <div className="flex h-full w-full items-center justify-center p-2">
                    <span className="text-center text-sm font-semibold leading-tight">{c.text}</span>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-primary/30"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

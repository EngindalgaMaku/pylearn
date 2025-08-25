"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import RewardDialog from "@/components/games/RewardDialog"
import CardRevealDialog from "@/components/games/CardRevealDialog"
import { useGameRewards } from "@/hooks/useGameRewards"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type IndentationLine = {
  text: string
  targetIndent: number // in levels (4 spaces per level)
}

function difficultyForIndex(idx: number, total: number): { label: string; variant: "secondary" | "outline" | "destructive" | undefined } {
  if (total <= 1) return { label: "Medium", variant: "outline" }
  const ratio = idx / Math.max(1, total - 1)
  if (ratio <= 0.34) return { label: "Easy", variant: "secondary" }
  if (ratio <= 0.67) return { label: "Medium", variant: "outline" }
  return { label: "Hard", variant: "destructive" }
}

type Level = {
  title: string
  description?: string
  lines: IndentationLine[]
  scrambled: number[] // starting indents per line
}

// Build a pool of at least 50 indentation puzzles
function buildLevelPool(): Level[] {
  const pool: Level[] = []

  // 1) If + For combos (15)
  for (let n = 1; n <= 15; n++) {
    pool.push({
      title: `If + For Combo ${n}`,
      description: "Nest the for-loop inside the if block and print values.",
      lines: [
        { text: `n = ${n + 2}`, targetIndent: 0 },
        { text: "if n > 0:", targetIndent: 0 },
        { text: "for i in range(n):", targetIndent: 1 },
        { text: "print(i)", targetIndent: 2 },
        { text: "print('done')", targetIndent: 0 },
      ],
      scrambled: [0, 0, 0, 1, 0],
    })
  }

  // 2) Function with condition (15)
  for (let i = 1; i <= 15; i++) {
    pool.push({
      title: `Function sign v${i}`,
      description: "Return should be inside condition.",
      lines: [
        { text: "def sign(x):", targetIndent: 0 },
        { text: "if x > 0:", targetIndent: 1 },
        { text: "return 'positive'", targetIndent: 2 },
        { text: "return 'non-positive'", targetIndent: 1 },
      ],
      scrambled: [0, 0, 1, 0],
    })
  }

  // 3) While loop with condition (10)
  for (let i = 1; i <= 10; i++) {
    pool.push({
      title: `While Loop ${i}`,
      description: "Ensure loop body is indented.",
      lines: [
        { text: "x = 0", targetIndent: 0 },
        { text: `while x < ${i + 2}:`, targetIndent: 0 },
        { text: "print(x)", targetIndent: 1 },
        { text: "x += 1", targetIndent: 1 },
        { text: "print('end')", targetIndent: 0 },
      ],
      scrambled: [0, 0, 0, 1, 0],
    })
  }

  // 4) Function with loop (10)
  for (let i = 1; i <= 10; i++) {
    pool.push({
      title: `Func + Loop ${i}`,
      description: "Indent loop inside function.",
      lines: [
        { text: "def show(n):", targetIndent: 0 },
        { text: "for i in range(n):", targetIndent: 1 },
        { text: "print(i)", targetIndent: 2 },
        { text: "print('done')", targetIndent: 1 },
      ],
      scrambled: [0, 0, 1, 1],
    })
  }

  return pool
}

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

// Estimate complexity: lower is easier
function levelComplexity(l: Level): number {
  const sumIndent = l.lines.reduce((s, ln) => s + (ln.targetIndent || 0), 0)
  const maxIndent = l.lines.reduce((m, ln) => Math.max(m, ln.targetIndent || 0), 0)
  const lines = l.lines.length
  // Weight: prioritize fewer lines and shallower indents
  return sumIndent * 2 + maxIndent * 3 + lines
}

const MAX_INDENT = 6 // levels
const INDENT_WIDTH = 4 // spaces per level

export default function PythonugGame() {
  const pool = useMemo(buildLevelPool, [])
  const [sessionLevels, setSessionLevels] = useState<Level[]>([])
  const [levelIndex, setLevelIndex] = useState(0)
  const [indents, setIndents] = useState<number[]>([])
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const autoFinishedRef = useRef(false)

  const { postSession, reward, showReward, setShowReward, prevXP, prevDiamonds, grantedCard, showCardReveal, setShowCardReveal, grantCardReward } = useGameRewards()

  const level = started ? sessionLevels[levelIndex] : undefined as unknown as Level

  useEffect(() => {
    if (!started) return
    const cur = sessionLevels[levelIndex]
    if (cur) setIndents(cur.scrambled.slice())
  }, [levelIndex, started, sessionLevels])

  // Featured random anime cards for start screen
  type FeaturedCard = { id: string; name: string; img: string }
  const [featured, setFeatured] = useState<FeaturedCard[]>([])
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/api/cards?category=anime-collection&limit=18`)
        if (!res.ok) return
        const data = await res.json().catch(() => ({} as any))
        const items: any[] = data?.items || data?.cards || []
        // randomly pick up to 3
        const shuffled = items.sort(() => 0.5 - Math.random())
        const take = shuffled.slice(0, 3).map((c) => ({
          id: c.id,
          name: c.name || c.cardTitle || "Card",
          img: c.secureThumbnailUrl || c.securePreviewUrl || c.image || "",
        }))
        if (mounted) setFeatured(take.filter((t) => !!t.img))
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const correctCount = useMemo(() => {
    if (!started) return 0
    return level.lines.reduce((acc, line, i) => acc + (indents[i] === line.targetIndent ? 1 : 0), 0)
  }, [indents, level, started])

  const allCorrect = started && correctCount === level.lines.length

  useEffect(() => {
    if (allCorrect && !autoFinishedRef.current && started) {
      autoFinishedRef.current = true
      setTimeout(() => {
        if (levelIndex + 1 < sessionLevels.length) {
          setScore((s) => s + level.lines.length)
          setLevelIndex((i) => i + 1)
          autoFinishedRef.current = false
        } else {
          onFinish()
        }
      }, 600)
    }
  }, [allCorrect, started, levelIndex, level, sessionLevels.length])

  const changeIndent = (i: number, delta: number) => {
    setIndents((arr) => {
      const next = arr.slice()
      next[i] = Math.max(0, Math.min(MAX_INDENT, next[i] + delta))
      return next
    })
  }

  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      if (!started) return
      if (!level) return
      if (selectedLine == null) return
      if (e.key === "]") {
        e.preventDefault()
        changeIndent(selectedLine, +1)
      } else if (e.key === "[") {
        e.preventDefault()
        changeIndent(selectedLine, -1)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedLine((s) => (s == null ? 0 : Math.max(0, s - 1)))
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        const maxIdx = Math.max(0, (level?.lines.length ?? 1) - 1)
        setSelectedLine((s) => (s == null ? 0 : Math.min(maxIdx, s + 1)))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedLine, level, started])

  const onStart = () => {
    const selected = shuffle(pool).slice(0, 5).sort((a, b) => levelComplexity(a) - levelComplexity(b))
    setSessionLevels(selected)
    setLevelIndex(0)
    setIndents(selected[0].scrambled.slice())
    setSelectedLine(null)
    setScore(0)
    setFinished(false)
    setStarted(true)
  }

  const onFinish = async () => {
    if (finished) return
    setFinished(true)
    const totalScore = score + level.lines.length // count last level
    await postSession({ gameKey: "pythonug", score: totalScore, correctCount: totalScore, durationSec: sessionLevels.length * 30 })
    grantCardReward({ category: "anime-collection", sourceGame: "pythonug" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Back header consistent with other games */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/games">
            <Button variant="ghost" size="sm" aria-label="Back to games">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Pythonüg</h1>
        </div>
      </header>
      {!started ? (
        <div className="max-w-3xl mx-auto p-6 pt-14 text-center space-y-6">
          <div className="text-6xl select-none">🐍✨</div>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold">Pythonüg — Indentation Fixer</h1>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs bg-amber-500/15 text-amber-700 border border-amber-500/30">Win Anime Cards</span>
            <span className="px-3 py-1 rounded-full text-xs bg-violet-500/15 text-violet-700 border border-violet-500/30">No Quiz • Hands-on</span>
            <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">Fast • Fun • 5 Rounds</span>
          </div>
          <div className="text-xs text-muted-foreground">Difficulty: Easy → Hard</div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Adjust code indentation using buttons or keyboard.
            Tips: select a line, use [ and ] to change indent, ↑/↓ to move selection.
            Play to win surprise anime card rewards!
          </p>

          {/* Featured anime cards */}
          {featured.length > 0 && (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Possible Rewards Preview</div>
              <div className="flex items-center justify-center gap-3">
                {featured.map((c) => (
                  <div key={c.id} className="relative rounded-lg border bg-white/70 backdrop-blur shadow-sm p-2 hover:shadow-md transition shadow-violet-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt={c.name} className="w-24 h-28 object-contain" />
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)] opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Collect them by playing — cards are granted on completion.</div>
            </div>
          )}

          <div>
            <Button size="lg" onClick={onStart}>Start</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto p-6 pt-10">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Level {levelIndex + 1} / {sessionLevels.length}</span>
                  {(() => {
                    const d = difficultyForIndex(levelIndex, sessionLevels.length)
                    return <Badge variant={d.variant}>{d.label}</Badge>
                  })()}
                </div>
                <div>Correct lines: {correctCount} / {level.lines.length}</div>
              </div>
              {level.description && (
                <div className="mb-4 text-sm text-muted-foreground">{level.description}</div>
              )}
              <div className="rounded-md border bg-card">
                {level.lines.map((line, i) => {
                  const active = selectedLine === i
                  const ok = indents[i] === line.targetIndent
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1.5 border-b last:border-b-0 ${active ? "bg-muted/40" : ""}`}
                      onClick={() => setSelectedLine(i)}
                      role="button"
                    >
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => changeIndent(i, -1)}>-</Button>
                        <Button size="sm" onClick={() => changeIndent(i, +1)}>+</Button>
                      </div>
                      <div className="text-xs w-10 text-muted-foreground tabular-nums">{indents[i]}</div>
                      <pre className="flex-1 overflow-x-auto"><code>{" ".repeat(indents[i] * INDENT_WIDTH) + line.text}</code></pre>
                      <div className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-gray-300"}`} aria-label={ok ? "correct" : "incorrect"} />
                    </div>
                  )
                })}
              </div>
              {levelIndex + 1 === sessionLevels.length && (
                <div className="mt-4 text-right">
                  <Button disabled={!allCorrect} onClick={onFinish}>Finish</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards modal (XP/diamonds) */}
      <RewardDialog
        open={showReward}
        onOpenChange={setShowReward}
        prevXP={prevXP}
        prevDiamonds={prevDiamonds}
        reward={reward}
        primaryLabel="Reveal Card"
        onPrimary={() => {
          setShowReward(false)
          setShowCardReveal(true)
        }}
        secondaryLabel="More Games"
        secondaryHref="/games"
      />

      {/* Card reveal */}
      <CardRevealDialog
        open={showCardReveal}
        onOpenChange={setShowCardReveal}
        card={grantedCard}
        primaryLabel="Awesome!"
        onPrimary={() => setShowCardReveal(false)}
        secondaryLabel="View Collection"
        onSecondary={() => (window.location.href = "/shop")}
      />
    </div>
  )
}

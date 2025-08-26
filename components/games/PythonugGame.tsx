"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import RewardDialog from "@/components/games/RewardDialog"
import CardRevealDialog from "@/components/games/CardRevealDialog"
import { useGameRewards } from "@/hooks/useGameRewards"
import Link from "next/link"
import { ArrowLeft, Volume2, VolumeX } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

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

  // Sound effects
  const [muted, setMuted] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastPlayRef = useRef<number>(0)
  const ensureCtx = () => {
    if (!audioCtxRef.current && typeof window !== "undefined") {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (Ctx) audioCtxRef.current = new Ctx()
    }
    return audioCtxRef.current
  }
  const playTone = (freq: number, durationMs = 120, type: OscillatorType = "sine", gain = 0.04) => {
    if (muted) return
    const now = Date.now()
    if (now - lastPlayRef.current < 25) return // throttle
    lastPlayRef.current = now
    const ctx = ensureCtx()
    if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.value = gain
    o.connect(g)
    g.connect(ctx.destination)
    const t = ctx.currentTime
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000)
    o.start(t)
    o.stop(t + durationMs / 1000)
  }
  const sfx = {
    tick: () => playTone(420, 70, "triangle", 0.03),
    tock: () => playTone(320, 70, "triangle", 0.03),
    ok: () => { playTone(660, 90, "sine", 0.04); setTimeout(() => playTone(880, 120, "sine", 0.035), 80) },
    finish: () => { playTone(523.25, 120, "sine", 0.05); setTimeout(() => playTone(659.25, 140, "sine", 0.05), 120); setTimeout(() => playTone(783.99, 180, "sine", 0.05), 260) },
  }

  const { postSession, reward, showReward, setShowReward, prevXP, prevDiamonds, grantedCard, showCardReveal, setShowCardReveal, grantCardReward } = useGameRewards()
  const { toast } = useToast()

  const level = started ? sessionLevels[levelIndex] : undefined as unknown as Level

  // Per-level color themes: card gradient + row palette
  const levelTheme = useMemo(() => {
    const themes = [
      {
        card: "bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 dark:from-slate-900 dark:via-slate-950 dark:to-violet-950",
        rows: [
          "bg-rose-50/70 dark:bg-rose-950/30",
          "bg-amber-50/70 dark:bg-amber-950/30",
          "bg-emerald-50/70 dark:bg-emerald-950/30",
          "bg-sky-50/70 dark:bg-sky-950/30",
          "bg-violet-50/70 dark:bg-violet-950/30",
        ],
      },
      {
        card: "bg-gradient-to-br from-sky-50 via-indigo-50 to-fuchsia-50 dark:from-slate-900 dark:via-indigo-950 dark:to-fuchsia-950",
        rows: [
          "bg-sky-50/70 dark:bg-sky-950/30",
          "bg-indigo-50/70 dark:bg-indigo-950/30",
          "bg-fuchsia-50/70 dark:bg-fuchsia-950/30",
          "bg-cyan-50/70 dark:bg-cyan-950/30",
          "bg-purple-50/70 dark:bg-purple-950/30",
        ],
      },
      {
        card: "bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-50 dark:from-emerald-950 dark:via-teal-950 dark:to-lime-950",
        rows: [
          "bg-emerald-50/70 dark:bg-emerald-950/30",
          "bg-teal-50/70 dark:bg-teal-950/30",
          "bg-lime-50/70 dark:bg-lime-950/30",
          "bg-green-50/70 dark:bg-green-950/30",
          "bg-rose-50/70 dark:bg-rose-950/30",
        ],
      },
      {
        card: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950",
        rows: [
          "bg-amber-50/70 dark:bg-amber-950/30",
          "bg-orange-50/70 dark:bg-orange-950/30",
          "bg-yellow-50/70 dark:bg-yellow-950/30",
          "bg-stone-50/70 dark:bg-stone-950/30",
          "bg-emerald-50/70 dark:bg-emerald-950/30",
        ],
      },
    ] as const
    const t = themes[levelIndex % themes.length]
    return { cardGradient: t.card, rowPalette: t.rows }
  }, [levelIndex])

  useEffect(() => {
    if (!started) return
    const cur = sessionLevels[levelIndex]
    if (cur) setIndents(cur.scrambled.slice())
  }, [levelIndex, started, sessionLevels])

  // Persist mute in localStorage
  useEffect(() => {
    try {
      const v = localStorage.getItem("pythonugMuted")
      if (v != null) setMuted(v === "1")
    } catch {}
    // resume audio context on first user gesture (handled by playTone)
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem("pythonugMuted", muted ? "1" : "0")
    } catch {}
  }, [muted])

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
          toast({ title: "Level complete!", description: `Great job. Moving to level ${levelIndex + 2}/${sessionLevels.length}.` })
          setLevelIndex((i) => i + 1)
          autoFinishedRef.current = false
          sfx.ok()
        } else {
          sfx.finish()
          onFinish()
        }
      }, 600)
    }
  }, [allCorrect, started, levelIndex, level, sessionLevels.length])

  const changeIndent = (i: number, delta: number) => {
    setIndents((arr) => {
      const next = arr.slice()
      const before = next[i]
      next[i] = Math.max(0, Math.min(MAX_INDENT, next[i] + delta))
      if (next[i] !== before) (delta > 0 ? sfx.tick : sfx.tock)()
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
    sfx.tick()
  }

  const onFinish = async () => {
    if (finished) return
    setFinished(true)
    const totalScore = score + level.lines.length // count last level
    await postSession({ gameKey: "pythonug", score: totalScore, correctCount: totalScore, durationSec: sessionLevels.length * 30 })
    grantCardReward({ category: "anime-collection", sourceGame: "pythonug" })
    // Refresh leaderboard after post
    fetchLeaderboard()
    toast({ title: "Pythonüg complete!", description: `Score: ${totalScore}. Rewards applied.` })
  }

  // Leaderboard
  type LBItem = { id: string; score: number; createdAt: string; user?: { username?: string | null; avatar?: string | null } }
  const [leaderboard, setLeaderboard] = useState<LBItem[]>([])
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/games/session?gameKey=pythonug&limit=10`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json().catch(() => ({} as any))
      setLeaderboard(Array.isArray(data?.items) ? data.items : [])
    } catch {}
  }
  useEffect(() => { fetchLeaderboard() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-rose-50 dark:from-slate-950 dark:via-slate-950 dark:to-violet-950">
      {/* Back header consistent with other games */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link href="/games">
            <Button variant="ghost" size="sm" aria-label="Back to games">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Pythonüg</h1>
          <Button variant="ghost" size="sm" aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
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

          <div className="space-y-6">
            {leaderboard.length > 0 && (
              <div className="mx-auto max-w-md text-left">
                <div className="text-sm font-medium mb-2">Top Pythonüg Scores</div>
                <div className="rounded-md border divide-y">
                  {leaderboard.map((r, idx) => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 text-muted-foreground tabular-nums">{idx + 1}.</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.user?.avatar || "/brand-snake.svg"} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                        <div className="truncate">{r.user?.username || "Anonymous"}</div>
                      </div>
                      <div className="font-mono">{r.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button size="lg" onClick={onStart}>Start</Button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto p-6 pt-10">
          <Card className={`border-0 shadow-lg ${levelTheme.cardGradient}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-600 text-white shadow-md ring-1 ring-indigo-700/40">
                    Question {levelIndex + 1} / {sessionLevels.length}
                  </div>
                  {(() => {
                    const d = difficultyForIndex(levelIndex, sessionLevels.length)
                    return <Badge variant={d.variant}>{d.label}</Badge>
                  })()}
                </div>
                <div className="text-sm text-muted-foreground">Correct lines: {correctCount} / {level.lines.length}</div>
              </div>
              {level.description && (
                <div className="mb-4 text-sm text-muted-foreground">{level.description}</div>
              )}
              <div className="rounded-md border bg-white/70 dark:bg-slate-900/50">
                {level.lines.map((line, i) => {
                  const active = selectedLine === i
                  const ok = indents[i] === line.targetIndent
                  const rowBg = active ? "bg-muted/40" : levelTheme.rowPalette[i % levelTheme.rowPalette.length]
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1.5 border-b last:border-b-0 ${rowBg}`}
                      onClick={() => setSelectedLine(i)}
                      role="button"
                    >
                      <div className="w-6 shrink-0 text-center text-[11px] text-muted-foreground tabular-nums select-none">{i + 1}</div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => changeIndent(i, -1)}>-</Button>
                        <Button size="sm" onClick={() => changeIndent(i, +1)}>+</Button>
                        <Select value={String(indents[i])} onValueChange={(v) => {
                          const n = Number(v) || 0
                          setIndents((arr) => {
                            const next = arr.slice()
                            const before = next[i]
                            next[i] = Math.max(0, Math.min(MAX_INDENT, n))
                            if (next[i] !== before) {
                              sfx.tick()
                              if (next[i] === (level?.lines[i]?.targetIndent ?? -1)) sfx.ok()
                            }
                            return next
                          })
                        }}>
                          <SelectTrigger size="sm" className="h-8">
                            <SelectValue placeholder="Indent" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(MAX_INDENT + 1)].map((_, val) => (
                              <SelectItem key={val} value={String(val)}>{val} indent{val === 1 ? "" : "s"}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs w-10 text-muted-foreground tabular-nums">{indents[i]}</div>
                      <pre className="flex-1 overflow-x-auto"><code>{" ".repeat(indents[i] * INDENT_WIDTH) + line.text}</code></pre>
                      <div className={`w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-gray-300"}`} aria-label={ok ? "correct" : "incorrect"} />
                      <div className={`text-[11px] ml-2 ${ok ? "text-emerald-600" : "text-muted-foreground"}`}>{ok ? "Correct" : "Fix"}</div>
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

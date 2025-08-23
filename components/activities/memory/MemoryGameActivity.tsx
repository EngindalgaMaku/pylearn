"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Clock, Gift, Play, RotateCcw, Star, Trophy } from "lucide-react"

// Types aligned with the old component's expectations
interface Card {
  id: number
  front: string
  back: string
}

interface MemoryContent {
  cards: Card[]
  rules: string
  timeLimit: number
  // allow back-compat fields
  pairs?: Array<{ id?: number; card1?: string; card2?: string }>
  instructions?: string
  timeLimitSec?: number
}

interface LearningActivity {
  id: string
  title: string
  description: string
  activityType: string
  difficulty: number
  category: string
  diamondReward: number
  experienceReward: number
  estimatedMinutes: number
  content: MemoryContent
  settings?: any
  tags: string[]
}

interface MemoryGameActivityProps {
  activity: LearningActivity
  onComplete?: (score: number, maxScore: number, success: boolean) => void
}

interface GameCard extends Card {
  isFlipped: boolean
  isMatched: boolean
  gameId: string
  type: "front" | "back"
}

export default function MemoryGameActivity({ activity, onComplete }: MemoryGameActivityProps) {
  const rawContent = (activity?.content ?? {}) as any
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

  // Normalize content: support cards or pairs
  const cards: Card[] = Array.isArray(rawContent.cards)
    ? rawContent.cards
    : Array.isArray(rawContent.pairs)
    ? (rawContent.pairs as any[])
        .map((p: any, i) => {
          const id = typeof p?.id === "number" ? p.id : i + 1
          const card1 = typeof p?.card1 === "string" ? p.card1 : String(p?.card1 ?? "")
          const card2 = typeof p?.card2 === "string" ? p.card2 : String(p?.card2 ?? "")
          if (!card1 || !card2) return null
          return { id, front: card1, back: card2 }
        })
        .filter(Boolean) as Card[]
    : []

  const timeLimit: number =
    typeof rawContent.timeLimit === "number" && !Number.isNaN(rawContent.timeLimit)
      ? rawContent.timeLimit
      : typeof rawContent.timeLimitSec === "number" && !Number.isNaN(rawContent.timeLimitSec)
      ? rawContent.timeLimitSec
      : Math.max(60, Number(activity.estimatedMinutes || 5) * 60)

  const rules: string =
    typeof rawContent.rules === "string" && rawContent.rules.trim() !== ""
      ? rawContent.rules
      : typeof rawContent.instructions === "string" && rawContent.instructions.trim() !== ""
      ? rawContent.instructions
      : "Flip two cards at a time to find matching pairs. Match all pairs before time runs out!"

  const [gameCards, setGameCards] = useState<GameCard[]>([])
  const [flippedCards, setFlippedCards] = useState<GameCard[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [moves, setMoves] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [expandedText, setExpandedText] = useState<string | null>(null)
  const [modalActive, setModalActive] = useState(false)

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const session = await response.json()
        setIsAuthenticated(!!session?.user)
      } catch {
        const userSession =
          typeof window !== "undefined"
            ? localStorage.getItem("user") ||
              sessionStorage.getItem("user") ||
              localStorage.getItem("next-auth.session-token") ||
              (typeof document !== "undefined" && document.cookie.includes("next-auth.session-token"))
            : null
        setIsAuthenticated(!!userSession)
      }
    }
    checkAuth()
  }, [])

  // Initialize game
  useEffect(() => {
    initializeGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && expandedText !== null) {
        e.preventDefault()
        setModalActive(false)
        setTimeout(() => setExpandedText(null), 180)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expandedText])

  // Timer effect
  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !gameCompleted) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !gameCompleted) {
      endGame(false)
    }
  }, [timeLeft, gameStarted, gameCompleted])

  // Check for matches after 2 flips
  useEffect(() => {
    if (flippedCards.length !== 2) return

    setMoves((prev) => prev + 1)
    const [card1, card2] = flippedCards

    const isMatch =
      ((card1.type === "front" && card2.type === "back") || (card1.type === "back" && card2.type === "front")) &&
      card1.id === card2.id

    if (isMatch) {
      setTimeout(() => {
        setGameCards((prev) =>
          prev.map((card) =>
            card.gameId === card1.gameId || card.gameId === card2.gameId ? { ...card, isMatched: true } : card
          )
        )
        setMatchedPairs((prev) => Math.min(prev + 1, cards.length))
        setFlippedCards([])
      }, 500)
    } else {
      setTimeout(() => {
        setGameCards((prev) =>
          prev.map((card) =>
            card.gameId === card1.gameId || card.gameId === card2.gameId ? { ...card, isFlipped: false } : card
          )
        )
        setFlippedCards([])
      }, 900)
    }
  }, [flippedCards, cards.length])

  // Complete when all matched
  useEffect(() => {
    if (matchedPairs === cards.length && gameStarted) {
      endGame(true)
    }
  }, [matchedPairs, cards.length, gameStarted])

  function initializeGame() {
    const gameCardPairs: GameCard[] = []
    cards.forEach((card) => {
      gameCardPairs.push({ ...card, gameId: `${card.id}-front`, type: "front", isFlipped: false, isMatched: false })
      gameCardPairs.push({ ...card, gameId: `${card.id}-back`, type: "back", isFlipped: false, isMatched: false })
    })
    const shuffled = [...gameCardPairs]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setGameCards(shuffled)
  }

  function handleCardClick(clicked: GameCard) {
    if (!gameStarted || clicked.isFlipped || clicked.isMatched || flippedCards.length === 2) return
    setGameCards((prev) => prev.map((c) => (c.gameId === clicked.gameId ? { ...c, isFlipped: true } : c)))
    setFlippedCards((prev) => [...prev, clicked])
  }

  function startGame() {
    setGameStarted(true)
  }

  async function endGame(won: boolean) {
    setGameCompleted(true)
    setGameWon(won)

    // score based on performance
    let score = 0
    if (won) {
      const timeBonus = Math.max(0, (timeLeft / timeLimit) * 30)
      const movesPenalty = Math.max(0, (moves - cards.length * 1.5) * 2)
      score = Math.min(100, Math.max(50, 70 + timeBonus - movesPenalty))
    } else {
      score = Math.min(49, (matchedPairs / cards.length) * 40)
    }

    // When finished and authenticated, attempt to complete via activities API
    if (won && isAuthenticated) {
      try {
        const res = await fetch("/api/activities/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: activity.id || activity.title, // prefer id if present
            score: Math.round(score),
            timeSpent: Math.max(1, (activity.estimatedMinutes || 5) * 60),
          }),
        })
        // ignore response errors; UI continues regardless
        await res.json().catch(() => null)
      } catch {}
    }
  }

  function handleManualComplete() {
    let score = 0
    if (gameWon) {
      const timeBonus = Math.max(0, (timeLeft / timeLimit) * 30)
      const movesPenalty = Math.max(0, (moves - cards.length * 1.5) * 2)
      score = Math.min(100, Math.max(50, 70 + timeBonus - movesPenalty))
    } else {
      score = Math.min(49, (matchedPairs / cards.length) * 40)
    }
    onComplete?.(Math.round(score), 100, gameWon)
  }

  function restartGame() {
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setTimeLeft(timeLimit)
    setGameStarted(false)
    setGameCompleted(false)
    setGameWon(false)
    initializeGame()
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, "0")}`
  }

  function fontSizeFor(text: string): string {
    const t = (text || "").trim()
    const len = t.length
    const lines = t.split(/\n/).length
    // Base sizes tuned for readability in card
    if (len <= 24 && lines <= 2) return "clamp(12px, 1.15vw, 14px)"
    if (len <= 48 && lines <= 4) return "clamp(10.5px, 1.05vw, 13px)"
    if (len <= 90) return "clamp(9.5px, 0.95vw, 11.5px)"
    return "clamp(8px, 0.9vw, 10.5px)"
  }

  function displayText(text: string): { shown: string; title: string } {
    const title = text || ""
    // Preserve newlines, but collapse repeated spaces/tabs
    const normalized = title
      .replace(/[\t ]+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .trim()
    // Soft truncate if extremely long (keep for tooltip)
    if (normalized.length > 200) {
      return { shown: normalized.slice(0, 200) + "…", title }
    }
    return { shown: normalized, title }
  }

  if (!cards.length) {
    return <div className="text-center text-muted-foreground">No cards available for this memory activity.</div>
  }

  if (!gameStarted) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <div className="mb-8 rounded-lg bg-primary/5 p-6">
            <h3 className="mb-4 text-xl font-semibold text-primary">Game Rules</h3>
            <p className="mb-4 text-foreground">{rules}</p>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Star className="h-5 w-5" />
                <span>{cards.length} Pairs to Match</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span>{formatTime(timeLimit)} Time Limit</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Trophy className="h-5 w-5" />
                <span>Score: Speed + Accuracy</span>
              </div>
            </div>
          </div>

          <button onClick={startGame} className="mt-2 inline-flex items-center gap-3 rounded-xl bg-primary px-10 py-4 text-xl font-bold text-primary-foreground shadow-md transition-all hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
              <Play className="h-5 w-5" />
            </div>
            <span>Start Game</span>
          </button>
        </div>
      </div>
    )
  }

  if (gameCompleted) {
    const score = gameWon
      ? Math.min(100, Math.max(50, 70 + (timeLeft / timeLimit) * 30 - Math.max(0, (moves - cards.length * 1.5) * 2)))
      : Math.min(49, (matchedPairs / cards.length) * 40)

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <div className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${gameWon ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
            <Trophy className="h-10 w-10" />
          </div>

          <h2 className="mb-2 text-3xl font-bold text-foreground">{gameWon ? "Excellent Memory!" : "Good Effort!"}</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            You matched {matchedPairs} out of {cards.length} pairs in {moves} moves
          </p>

          <div className="mb-8 rounded-lg bg-muted p-6">
            <div className="mb-2 text-4xl font-bold text-foreground">{Math.round(score)}%</div>
            <div className={`text-lg font-semibold ${gameWon ? "text-green-600" : "text-orange-600"}`}>
              {gameWon ? "Memory Master!" : "Keep Practicing!"}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold text-foreground">{matchedPairs}</div>
                <div className="text-muted-foreground">Pairs Matched</div>
              </div>
              <div>
                <div className="font-semibold text-foreground">{moves}</div>
                <div className="text-muted-foreground">Total Moves</div>
              </div>
              <div>
                <div className="font-semibold text-foreground">{formatTime(timeLimit - timeLeft)}</div>
                <div className="text-muted-foreground">Time Used</div>
              </div>
            </div>
          </div>

          <div className="space-x-3">
            <button onClick={restartGame} className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-semibold text-secondary-foreground">
              <RotateCcw className="h-5 w-5" />
              <span>Play Again</span>
            </button>
            {isAuthenticated ? (
              <button onClick={handleManualComplete} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white">
                🎉 Complete & Claim Rewards
              </button>
            ) : (
              <button onClick={() => router.push(backHref)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground">
                Finish and Go to List
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // In-game board
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-end">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Moves: <span className="font-semibold text-foreground">{moves}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Matched: <span className="font-semibold text-foreground">{matchedPairs}/{cards.length}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm text-muted-foreground">
            {Math.round((matchedPairs / cards.length) * 100)}% Complete
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(matchedPairs / cards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className={`grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]`}>
        {gameCards.map((card) => (
          <div
            key={card.gameId}
            onClick={() => handleCardClick(card)}
            className={`relative h-36 md:h-40 lg:h-44 cursor-pointer rounded-lg border-2 transition-all duration-300 ${card.isMatched ? "opacity-50" : "hover:scale-105"}`}
          >
            <div className={`h-full w-full rounded-lg border-2 transition-all duration-500 ${card.isFlipped || card.isMatched ? "border-primary bg-background" : "border-primary/60 bg-primary text-primary-foreground"}`}>
              {card.isFlipped || card.isMatched ? (
                <div className="group relative flex h-full w-full items-center justify-center p-2 md:p-3">
                  {(() => {
                    const raw = card.type === "front" ? card.front : card.back
                    const disp = displayText(raw)
                    return (
                      <pre
                        title={disp.title}
                        className={`max-h-full w-full overflow-hidden text-center font-mono ${card.type === "front" ? "font-semibold" : "font-medium"} text-foreground whitespace-pre-line break-words leading-snug`}
                        style={{ fontSize: fontSizeFor(raw) }}
                      >
                        {disp.shown}
                      </pre>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const full = card.type === "front" ? card.front : card.back
                      setExpandedText(full)
                      setTimeout(() => setModalActive(true), 0)
                    }}
                    className="absolute right-1 top-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-opacity hover:bg-muted/80 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Expand"
                    title="Expand"
                  >
                    ⤢
                  </button>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-8 w-8 rounded-full bg-primary-foreground/30"></div>
                </div>
              )}
            </div>

            {card.isMatched && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-green-500 p-1 text-white">
                  <Trophy className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {expandedText !== null && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-200 ${modalActive ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => {
            setModalActive(false)
            setTimeout(() => setExpandedText(null), 180)
          }}
        >
          <div
            className={`max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-background p-4 shadow-xl transform transition-all duration-200 ease-out ${modalActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Card Text</h3>
              <button
                className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-muted/80"
                onClick={() => {
                  setModalActive(false)
                  setTimeout(() => setExpandedText(null), 180)
                }}
              >
                Close
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-foreground leading-relaxed" style={{ fontSize: "clamp(12px, 1.2vw, 16px)" }}>
              {expandedText}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-sm text-muted-foreground">
        💡 Tip: Remember the positions of cards you've seen to make matches faster!
      </div>
    </div>
  )
}

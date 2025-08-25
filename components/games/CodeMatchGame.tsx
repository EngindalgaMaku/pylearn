"use client"

import { useState, useEffect, useRef } from "react"
// import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
// import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
// import { useSortable } from "@dnd-kit/sortable"
// import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ChevronsUpDown, ArrowUp, ArrowDown, Clock } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import RewardDialog from "@/components/games/RewardDialog"
import { useGameRewards } from "@/hooks/useGameRewards"
import GameSEOSection from "@/components/games/GameSEOSection"

type CodeLine = {
  id: string
  code: string
}

type SortingPuzzle = {
  id: number
  shuffledLines: CodeLine[]
  correctOrder: string[]
}


export default function CodeMatchGame() {
  const [puzzles, setPuzzles] = useState<SortingPuzzle[]>([])
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [lines, setLines] = useState<CodeLine[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [difficulty, setDifficulty] = useState<"beginner" | "advanced">("beginner")
  const { data: session } = useSession()
  const { toast } = useToast()
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const { reward, showReward, setShowReward, prevXP, prevDiamonds, postSession } = useGameRewards()
  const QUESTION_TIME = 20
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME)

  // helper to move an item in array without external libs
  function move<T>(arr: T[], from: number, to: number): T[] {
    const a = arr.slice()
    const item = a.splice(from, 1)[0]
    a.splice(to, 0, item)
    return a
  }

  const moveLineUp = (idx: number) => {
    if (idx <= 0) return
    setLines((prev) => move(prev, idx, idx - 1))
  }

  const moveLineDown = (idx: number) => {
    if (idx >= lines.length - 1) return
    setLines((prev) => move(prev, idx, idx + 1))
  }


  useEffect(() => {
    if (gameStarted && puzzles.length > 0) {
      setLines(puzzles[currentPuzzleIndex].shuffledLines)
      setTimeLeft(QUESTION_TIME)
    }
  }, [gameStarted, currentPuzzleIndex, puzzles])

  // countdown timer similar to LoopRunner
  useEffect(() => {
    if (!gameStarted || gameCompleted) return
    const id = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [gameStarted, gameCompleted, currentPuzzleIndex])

  useEffect(() => {
    if (!gameStarted || gameCompleted) return
    if (timeLeft === 0) {
      toast({ title: "Time's up! ⏰", description: "Moving to the next puzzle.", variant: "destructive" })
      if (currentPuzzleIndex < puzzles.length - 1) {
        setCurrentPuzzleIndex((idx) => idx + 1)
      } else {
        setGameCompleted(true)
      }
    }
  }, [timeLeft, gameStarted, gameCompleted, currentPuzzleIndex, puzzles.length, toast])

  const startGame = async () => {
    try {
      const response = await fetch(`/api/games/code-match/questions?difficulty=${difficulty}`)
      const data = await response.json()
      setPuzzles(data)
      setCurrentPuzzleIndex(0)
      setScore(0)
      setGameStarted(true)
      setGameCompleted(false)
      runStartRef.current = Date.now()
      postedRef.current = false
    } catch (error) {
      console.error("Failed to start game", error)
    }
  }


  const checkAnswer = () => {
    const currentOrder = lines.map((line) => line.id)
    const correctOrder = puzzles[currentPuzzleIndex].correctOrder
    const isCorrect = JSON.stringify(currentOrder) === JSON.stringify(correctOrder)
    if (isCorrect) {
      setScore(score + 1)
      toast({ title: "Correct ✅", description: "Nice! Moving to the next puzzle." })
    } else {
      toast({ title: "Wrong ❌", description: "That order isn't correct.", variant: "destructive" })
    }
    if (currentPuzzleIndex < puzzles.length - 1) {
      setCurrentPuzzleIndex(currentPuzzleIndex + 1)
    } else {
      setGameCompleted(true)
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!gameCompleted || postedRef.current) return
      postedRef.current = true
      const durationSec = runStartRef.current ? Math.max(0, Math.round((Date.now() - runStartRef.current) / 1000)) : 0
      await postSession({ gameKey: "code-match", score, correctCount: score, durationSec, extra: { difficulty } })
    }
    run()
  }, [gameCompleted, score, difficulty, postSession])

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Code Match</h1>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
          <CardHeader>
            <CardTitle>Code Match – Arrange the Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center mb-4">
              <Badge variant="secondary">10 Puzzles</Badge>
              <Badge variant="outline">
                {difficulty === "advanced" ? "Up to +20 XP + 💎" : "Up to +10 XP + 💎"}
              </Badge>
            </div>

            <div className="mb-4">
              <div className="text-left mb-2">
                <h3 className="font-medium">Select difficulty</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={difficulty === "beginner" ? "default" : "outline"}
                  onClick={() => setDifficulty("beginner")}
                >
                  Beginner
                </Button>
                <Button
                  variant={difficulty === "advanced" ? "default" : "outline"}
                  onClick={() => setDifficulty("advanced")}
                >
                  Advanced ×2 rewards
                </Button>
              </div>
            </div>

            <div className="text-left space-y-2 mb-4">
              <h3 className="font-medium">How to play</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Reorder the code lines into the correct sequence</li>
                <li>Submit to check and move to the next puzzle</li>
                <li>Each correct order gives you 1 point</li>
                <li>XP and diamonds are awarded at the end</li>
              </ul>
            </div>

            <GameSEOSection
              title="Code Match Game"
              description="Practice Python logic by arranging shuffled code lines into the correct order. Mobile-first, fast, and fun way to learn code flow."
              keywords={["python puzzle", "code arrange game", "learn python mobile", "coding game for beginners", "python practice"]}
              features={["Mobile-first UI for quick sessions", "Instant feedback per puzzle", "Earn XP and diamonds as you learn", "Bite-size challenges that build intuition"]}
              faq={[
                { q: "Who is this for?", a: "Beginners learning Python syntax and code structure." },
                { q: "How are rewards calculated?", a: "You earn 1 XP and 1 diamond per correct puzzle." },
              ]}
            />

              <Button onClick={startGame} className="w-full">
                Start Game
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (gameCompleted) {
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
              <CardTitle>Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {score} / {puzzles.length}
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>
              {reward && (
                <Badge variant={score / puzzles.length >= 0.8 ? "default" : "secondary"} className="text-sm px-3 py-1">
                  +{reward.xp} XP, +{reward.diamonds} 💎
                </Badge>
              )}
              <div className="flex gap-3">
                <Button onClick={startGame} variant="outline" className="flex-1 bg-transparent">
                  Play Again
                </Button>
                <Link href="/games" className="flex-1">
                  <Button className="w-full">More Games</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <RewardDialog
            open={showReward}
            onOpenChange={setShowReward}
            prevXP={prevXP}
            prevDiamonds={prevDiamonds}
            reward={reward}
            primaryLabel="Keep Playing ▶️"
            onPrimary={() => setShowReward(false)}
          />
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
              <Badge variant="outline">Q {currentPuzzleIndex + 1} of {puzzles.length}</Badge>
              <Badge variant={timeLeft <= 5 ? "destructive" : "secondary"} className="flex items-center gap-1">
                <Clock className="w-3 h-3" />{timeLeft}s
              </Badge>
            </div>
          </div>
          <Progress value={((currentPuzzleIndex + 1) / puzzles.length) * 100} className="h-2" />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Sort the code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {lines.map((line, idx) => (
                <div key={line.id} className="p-3 bg-gray-100 rounded-md flex items-center justify-between">
                  <code className="whitespace-pre">{line.code}</code>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" aria-label="Move up" disabled={idx === 0} onClick={() => moveLineUp(idx)}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Move down" disabled={idx === lines.length - 1} onClick={() => moveLineDown(idx)}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={checkAnswer} className="mt-4 w-full">
              {currentPuzzleIndex === puzzles.length - 1 ? "Finish Game" : "Submit & Next"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
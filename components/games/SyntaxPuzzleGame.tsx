"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GripVertical } from "lucide-react"
import Link from "next/link"

const puzzles = [
  {
    id: 1,
    title: "Print Statement",
    description: "Arrange the code to print 'Hello Python'",
    blocks: ["print(", "'Hello Python'", ")"],
    correctOrder: [0, 1, 2],
  },
  {
    id: 2,
    title: "Variable Assignment",
    description: "Create a variable named 'age' with value 25",
    blocks: ["age", "=", "25"],
    correctOrder: [0, 1, 2],
  },
  {
    id: 3,
    title: "If Statement",
    description: "Complete the if statement structure",
    blocks: ["if", "x > 5", ":", "print('Greater')"],
    correctOrder: [0, 1, 2, 3],
  },
]

export default function SyntaxPuzzleGame() {
  const { data: session, update } = useSession()
  const [currentPuzzle, setCurrentPuzzle] = useState(0)
  const [userOrder, setUserOrder] = useState<number[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const { toast } = useToast()
  const [reward, setReward] = useState<{ xp: number; diamonds: number } | null>(null)

  const puzzle = puzzles[currentPuzzle]

  const startGame = () => {
    setGameStarted(true)
    // Shuffle the blocks for the first puzzle
    const shuffled = [...Array(puzzle.blocks.length).keys()].sort(() => Math.random() - 0.5)
    setUserOrder(shuffled)
    runStartRef.current = Date.now()
    postedRef.current = false
  }

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (showResult) return

    const newOrder = [...userOrder]
    const [movedItem] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, movedItem)
    setUserOrder(newOrder)
  }

  const checkAnswer = () => {
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(puzzle.correctOrder)
    setShowResult(true)

    if (isCorrect) {
      setScore(score + 1)
    }
  }

  const nextPuzzle = () => {
    if (currentPuzzle < puzzles.length - 1) {
      setCurrentPuzzle(currentPuzzle + 1)
      const nextPuzzle = puzzles[currentPuzzle + 1]
      const shuffled = [...Array(nextPuzzle.blocks.length).keys()].sort(() => Math.random() - 0.5)
      setUserOrder(shuffled)
      setShowResult(false)
    } else {
      setGameCompleted(true)
    }
  }

  const restartGame = () => {
    setCurrentPuzzle(0)
    setUserOrder([])
    setGameStarted(false)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
    runStartRef.current = null
    postedRef.current = false
  }

  // Post a session when game completed
  useEffect(() => {
    const postSession = async () => {
      if (!gameCompleted || postedRef.current) return
      postedRef.current = true
      const startedAt = runStartRef.current ?? Date.now()
      const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      try {
        const res = await fetch("/api/games/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameKey: "syntax-puzzle",
            score,
            correctCount: score,
            durationSec,
          }),
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
        console.error("Failed to post game session (syntax-puzzle)", e)
        toast({
          title: "Session save failed",
          description: "We couldn't record your puzzle session. Your progress may not update.",
          variant: "destructive",
        })
      }
    }
    postSession()
  }, [gameCompleted, score, session, update, toast])

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Syntax Puzzle</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🔧</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Syntax Puzzle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 text-left">
                <h3 className="font-medium">How to Play:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Drag and drop code blocks to arrange them correctly</li>
                  <li>• Complete the Python syntax puzzles</li>
                  <li>• Solve all puzzles to earn maximum points</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">{puzzles.length} Puzzles</Badge>
                <Badge variant="outline">Up to +10 XP + 💎</Badge>
              </div>

              <Button onClick={startGame} className="w-full">
                Start Puzzle
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (gameCompleted) {
    const percentage = Math.round((score / puzzles.length) * 100)
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Puzzle Complete!</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">{percentage >= 80 ? "🏆" : "🎉"}</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">
                {percentage >= 80 ? "Perfect!" : "Well Done!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {score}/{puzzles.length}
                </div>
                <div className="text-sm text-muted-foreground">Puzzles Solved</div>
              </div>

              {reward ? (
                <Badge variant="default" className="text-sm px-3 py-1">+{reward.xp} XP, +{reward.diamonds} 💎</Badge>
              ) : (
                <Badge variant="default" className="text-sm px-3 py-1">Rewards applied</Badge>
              )}

              <div className="flex gap-3">
                <Button onClick={restartGame} variant="outline" className="flex-1 bg-transparent">
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

  const isCorrect = showResult && JSON.stringify(userOrder) === JSON.stringify(puzzle.correctOrder)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Badge variant="outline">
              Puzzle {currentPuzzle + 1} of {puzzles.length}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">{puzzle.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{puzzle.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Drag blocks to arrange them:</h3>
              <div className="space-y-2">
                {userOrder.map((blockIndex, position) => (
                  <div
                    key={`${blockIndex}-${position}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-move ${
                      showResult
                        ? isCorrect
                          ? "bg-primary/10 border-primary/20"
                          : "bg-destructive/10 border-destructive/20"
                        : "bg-muted/50 border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      if (position > 0) moveBlock(position, position - 1)
                    }}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <code className="font-mono flex-1">{puzzle.blocks[blockIndex]}</code>
                    <div className="flex gap-1">
                      {position > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            moveBlock(position, position - 1)
                          }}
                          disabled={showResult}
                        >
                          ↑
                        </Button>
                      )}
                      {position < userOrder.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            moveBlock(position, position + 1)
                          }}
                          disabled={showResult}
                        >
                          ↓
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showResult && (
              <div className="text-center space-y-3">
                <p className={`font-medium ${isCorrect ? "text-primary" : "text-destructive"}`}>
                  {isCorrect ? "Correct! Well done!" : "Not quite right. Try again!"}
                </p>

                {isCorrect && (
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <code className="font-mono text-sm">
                      {puzzle.correctOrder.map((i) => puzzle.blocks[i]).join(" ")}
                    </code>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {!showResult ? (
                <Button onClick={checkAnswer} className="flex-1">
                  Check Answer
                </Button>
              ) : (
                <Button onClick={nextPuzzle} className="flex-1">
                  {currentPuzzle === puzzles.length - 1 ? "Finish" : "Next Puzzle"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
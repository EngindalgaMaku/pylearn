"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import RewardDialog from "@/components/games/RewardDialog"
import { useGameRewards } from "@/hooks/useGameRewards"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, GripVertical } from "lucide-react"
import Link from "next/link"
import GameSEOSection from "@/components/games/GameSEOSection"

type Puzzle = {
  id: number
  title: string
  description: string
  blocks: string[]
  correctOrder: number[]
}

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

const generatePuzzlePool = (): Puzzle[] => {
  const pool: Puzzle[] = []
  let id = 1

  // 1) Print statements (20)
  for (let i = 1; i <= 20; i++) {
    pool.push({
      id: id++,
      title: `Print Message ${i}`,
      description: `Print a simple message ${i}`,
      blocks: ["print(", `'Message ${i}'`, ")"],
      correctOrder: [0, 1, 2],
    })
  }

  // 2) Variable assignments (10)
  for (let i = 1; i <= 10; i++) {
    pool.push({
      id: id++,
      title: `Assign Variable v${i}`,
      description: `Assign value ${i} to variable v${i}`,
      blocks: [
        `v${i}`,
        "=",
        `${i}`,
      ],
      correctOrder: [0, 1, 2],
    })
  }

  // 3) If statements (5)
  for (let i = 1; i <= 5; i++) {
    pool.push({
      id: id++,
      title: `If Greater Than ${i * 2}`,
      description: `Check if x is greater than ${i * 2}`,
      blocks: ["if", `x > ${i * 2}`, ":", `print('Greater than ${i * 2}')`],
      correctOrder: [0, 1, 2, 3],
    })
  }

  // 4) For loops (5)
  for (let i = 2; i <= 6; i++) {
    pool.push({
      id: id++,
      title: `For Loop ${i}`,
      description: `Loop ${i} times and print i`,
      blocks: ["for i in range(", `${i}`, "):", "print(i)"],
      correctOrder: [0, 1, 2, 3],
    })
  }

  // 5) Function defs (5)
  const fnNames = ["greet", "add", "hello", "square", "welcome"]
  for (const name of fnNames) {
    pool.push({
      id: id++,
      title: `Function ${name}`,
      description: `Define ${name} function with a simple body`,
      blocks: [`def ${name}():`, name === "add" ? "return 1 + 1" : "print('Hi')"],
      correctOrder: [0, 1],
    })
  }

  // 6) List/Dict creations (5)
  pool.push(
    { id: id++, title: "Create List", description: "Create a list with three numbers", blocks: ["nums", "=", "[1, 2, 3]"], correctOrder: [0,1,2] },
    { id: id++, title: "Create Dict", description: "Create a dict with a key", blocks: ["user", "=", "{ 'name': 'Ada' }"], correctOrder: [0,1,2] },
    { id: id++, title: "Append to List", description: "Append item to list", blocks: ["nums", ".append(", "4", ")"], correctOrder: [0,1,2,3] },
    { id: id++, title: "String Format", description: "Use f-string to greet", blocks: ["name", "=", "'Bob'"], correctOrder: [0,1,2] },
    { id: id++, title: "While Loop", description: "Basic while loop skeleton", blocks: ["while", "x < 5", ":", "x += 1"], correctOrder: [0,1,2,3] },
  )

  // Ensure at least 50
  while (pool.length < 50) {
    const n = pool.length + 1
    pool.push({
      id: id++,
      title: `Extra Print ${n}`,
      description: `Another simple print ${n}`,
      blocks: ["print(", `'Extra ${n}'`, ")"],
      correctOrder: [0,1,2],
    })
  }

  return pool
}

export default function SyntaxPuzzleGame() {
  const { update } = useSession()
  const [currentPuzzle, setCurrentPuzzle] = useState(0)
  const [userOrder, setUserOrder] = useState<number[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const { reward, showReward, setShowReward, prevXP, prevDiamonds, postSession } = useGameRewards()
  const pool = useMemo(generatePuzzlePool, [])
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])

  const puzzle = puzzles[currentPuzzle]!

  const startGame = () => {
    // Select 5 random puzzles for this session
    const selected = shuffle(pool).slice(0, 5)
    setPuzzles(selected)
    setGameStarted(true)
    // Prepare first puzzle ordering
    const first = selected[0]
    const shuffled = [...Array(first.blocks.length).keys()].sort(() => Math.random() - 0.5)
    setUserOrder(shuffled)
    setCurrentPuzzle(0)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
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
      const nextIndex = currentPuzzle + 1
      setCurrentPuzzle(nextIndex)
      const nextPuzzle = puzzles[nextIndex]
      const shuffled = [...Array(nextPuzzle.blocks.length).keys()].sort(() => Math.random() - 0.5)
      setUserOrder(shuffled)
      setShowResult(false)
    } else {
      setGameCompleted(true)
    }
  }

  const restartGame = () => {
    // New session with new random 5
    const selected = shuffle(pool).slice(0, 5)
    setPuzzles(selected)
    setCurrentPuzzle(0)
    const first = selected[0]
    const shuffled = [...Array(first.blocks.length).keys()].sort(() => Math.random() - 0.5)
    setUserOrder(shuffled)
    setGameStarted(true)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
    runStartRef.current = Date.now()
    postedRef.current = false
  }

  // Post a session when game completed
  useEffect(() => {
    const doPost = async () => {
      if (!gameCompleted || postedRef.current) return
      postedRef.current = true
      const startedAt = runStartRef.current ?? Date.now()
      const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000))
      await postSession({ gameKey: "syntax-puzzle", score, correctCount: score, durationSec })
      try {
        await update?.({})
      } catch {}
    }
    doPost()
  }, [gameCompleted, score, postSession, update])

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
                <Badge variant="secondary">{5} Puzzles</Badge>
                <Badge variant="outline">Up to +5 XP + 💎</Badge>
              </div>

              <GameSEOSection
                title="Syntax Puzzle Game"
                description="Arrange Python syntax blocks into valid code. Mobile-first UI with quick feedback to help you learn faster."
                keywords={["python syntax", "drag and drop coding", "mobile python game", "learn python blocks", "coding puzzle"]}
                features={["Tap-friendly drag alternatives (buttons)", "Clear visual feedback after each attempt", "XP and diamonds for correct solutions", "Short, focused challenges"]}
                faq={[
                  { q: "Do I need to drag?", a: "You can tap the up/down buttons to reorder on mobile." },
                  { q: "How are rewards handled?", a: "1 XP and 1 diamond per correct puzzle; server totals are authoritative." },
                ]}
              />

              <Button onClick={startGame} className="w-full">
                Start Puzzle
              </Button>
            </CardContent>
          </Card>
          {/* Rewards Popup */}
          <RewardDialog
            open={showReward}
            onOpenChange={setShowReward}
            prevXP={prevXP}
            prevDiamonds={prevDiamonds}
            reward={reward}
            primaryLabel="Keep Playing ▶️"
          />
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
          {/* Rewards Popup (also rendered on completion screen) */}
          <RewardDialog
            open={showReward}
            onOpenChange={setShowReward}
            prevXP={prevXP}
            prevDiamonds={prevDiamonds}
            reward={reward}
            primaryLabel="Close"
          />
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
                      {puzzle.correctOrder.map((i: number) => puzzle.blocks[i]).join(" ")}
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
"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

type Question = {
  id: number
  code: string
  options: string[]
  correct: number
}

export default function CodeMatchGame() {
  const { data: session, update } = useSession()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentRound, setCurrentRound] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameStarted, setGameStarted] = useState(false)
  const runStartRef = useRef<number | null>(null)
  const postedRef = useRef(false)
  const { toast } = useToast()
  const [reward, setReward] = useState<{ xp: number; diamonds: number } | null>(null)

  const currentMatch = questions[currentRound]
  const progress = questions.length > 0 ? ((currentRound + 1) / questions.length) * 100 : 0

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !showResult && !gameCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp()
    }
  }, [timeLeft, gameStarted, showResult, gameCompleted])

  const startGame = async () => {
    try {
      const response = await fetch("/api/games/code-match/questions")
      if (!response.ok) {
        throw new Error("Failed to fetch questions")
      }
      const questionsData = await response.json()
      setQuestions(questionsData)
      setCurrentRound(0)
      setSelectedAnswer(null)
      setShowResult(false)
      setScore(0)
      setGameCompleted(false)
      setTimeLeft(30)
      setGameStarted(true)
      runStartRef.current = Date.now()
      postedRef.current = false
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not start the game. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleTimeUp = () => {
    setShowResult(true)
    setSelectedAnswer(-1) // Indicates time up
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult || timeLeft === 0) return
    setSelectedAnswer(answerIndex)
    setShowResult(true)

    const isCorrect = answerIndex === currentMatch.correct
    if (isCorrect) {
      setScore(score + 1)
    }
  }

  const handleNextRound = () => {
    if (currentRound < questions.length - 1) {
      setCurrentRound(currentRound + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30)
    } else {
      setGameCompleted(true)
    }
  }

  const restartGame = () => {
    setQuestions([])
    setCurrentRound(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
    setTimeLeft(30)
    setGameStarted(false)
    runStartRef.current = null
    postedRef.current = false
  }

  // Post session on completion (once)
  useEffect(() => {
    const run = async () => {
      if (!gameCompleted || postedRef.current) return
      postedRef.current = true
      const durationSec = runStartRef.current ? Math.max(0, Math.round((Date.now() - runStartRef.current) / 1000)) : 0
      const payload = { gameKey: "code-match", score, correctCount: score, durationSec }
      try {
        const res = await fetch("/api/games/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json().catch(() => ({}))
        const xp = data?.rewards?.xp ?? 0
        const diamonds = data?.rewards?.diamonds ?? 0
        setReward({ xp, diamonds })
        // Update session immediately so UI reflects changes
        try {
          const curXP = (session?.user as any)?.experience ?? 0
          const curDiamonds = (session?.user as any)?.currentDiamonds ?? 0
          await update?.({ experience: curXP + xp, currentDiamonds: curDiamonds + diamonds })
        } catch {}
      } catch (e) {
        toast({ title: "Session save failed", description: "We couldn't record your game session. Your progress may not update.", variant: "destructive" })
      }
    }
    run()
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
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Code Match</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🧩</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Code Match Game</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 text-left">
                <h3 className="font-medium">How to Play:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Match Python code with its correct output</li>
                  <li>• You have 30 seconds per question</li>
                  <li>• Earn 1 point per correct round</li>
                  <li>• Complete all 10 rounds to win!</li>
              </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">10 Questions</Badge>
                <Badge variant="outline">Up to +10 XP + 💎</Badge>
              </div>

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
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">{score === questions.length ? "Perfect Run!" : "Game Over!"}</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">{score === questions.length ? "🏆" : "🏁"}</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">
                {score === questions.length ? "Flawless victory!" : "Good effort!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {score} / {questions.length}
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
              </div>

              {reward ? (
                <Badge variant={percentage >= 80 ? "default" : "secondary"} className="text-sm px-3 py-1">
                  +{reward.xp} XP, +{reward.diamonds} 💎
                </Badge>
              ) : (
                <Badge variant={percentage >= 80 ? "default" : "secondary"} className="text-sm px-3 py-1">Rewards applied</Badge>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Round {currentRound + 1} of {questions.length}
              </Badge>
              <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"}>{timeLeft}s</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center font-[family-name:var(--font-work-sans)]">
              What does this code output?
            </CardTitle>
            <div className="bg-muted p-4 rounded-lg font-mono text-center">
              <code className="text-lg">{currentMatch?.code}</code>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentMatch?.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === index
                    ? showResult
                      ? index === currentMatch.correct
                        ? "default"
                        : "destructive"
                      : "secondary"
                    : "outline"
                }
                className="w-full justify-center text-center h-12"
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
              >
                <div className="flex items-center gap-3">
                  {showResult && index === currentMatch.correct ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : showResult && selectedAnswer === index && index !== currentMatch.correct ? (
                    <XCircle className="w-4 h-4" />
                  ) : null}
                  <span className="font-mono">{option}</span>
                </div>
              </Button>
            ))}

            {showResult && (
              <div className="mt-6 text-center">
                {selectedAnswer === -1 ? (
                  <p className="text-destructive font-medium">Time's up!</p>
                ) : selectedAnswer === currentMatch.correct ? (
                  <p className="text-primary font-medium">Correct!</p>
                ) : (
                  <p className="text-destructive font-medium">Incorrect. Try again next time!</p>
                )}

                <Button onClick={handleNextRound} className="mt-4 w-full">
                  {currentRound === questions.length - 1 ? "Finish Game" : "Next Round"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

const codeMatches = [
  {
    id: 1,
    code: "print('Hello World')",
    options: ["Hello World", "print('Hello World')", "Hello", "World"],
    correct: 0,
  },
  {
    id: 2,
    code: "len('Python')",
    options: ["5", "6", "7", "Python"],
    correct: 1,
  },
  {
    id: 3,
    code: "3 + 4 * 2",
    options: ["14", "11", "10", "24"],
    correct: 1,
  },
  {
    id: 4,
    code: "type(42)",
    options: ["<class 'str'>", "<class 'int'>", "<class 'float'>", "42"],
    correct: 1,
  },
  {
    id: 5,
    code: "'Python'.upper()",
    options: ["python", "PYTHON", "Python", "PyThOn"],
    correct: 1,
  },
]

export default function CodeMatchGame() {
  const [currentRound, setCurrentRound] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameStarted, setGameStarted] = useState(false)

  const currentMatch = codeMatches[currentRound]
  const progress = ((currentRound + 1) / codeMatches.length) * 100

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !showResult && !gameCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleTimeUp()
    }
  }, [timeLeft, gameStarted, showResult, gameCompleted])

  const startGame = () => {
    setGameStarted(true)
    setTimeLeft(30)
  }

  const handleTimeUp = () => {
    setShowResult(true)
    setSelectedAnswer(-1) // Indicates time up
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult || timeLeft === 0) return
    setSelectedAnswer(answerIndex)
    setShowResult(true)

    if (answerIndex === currentMatch.correct) {
      setScore(score + 1)
    }
  }

  const handleNextRound = () => {
    if (currentRound < codeMatches.length - 1) {
      setCurrentRound(currentRound + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setTimeLeft(30)
    } else {
      setGameCompleted(true)
    }
  }

  const restartGame = () => {
    setCurrentRound(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
    setTimeLeft(30)
    setGameStarted(false)
  }

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
                  <li>• Earn points for correct answers</li>
                  <li>• Complete all 5 rounds to win!</li>
                </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">5 Questions</Badge>
                <Badge variant="outline">+50 XP</Badge>
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
    const percentage = Math.round((score / codeMatches.length) * 100)
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Link href="/games">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Game Complete!</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">{percentage >= 80 ? "🏆" : percentage >= 60 ? "🎉" : "💪"}</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">
                {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Great Job!" : "Keep Learning!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {score}/{codeMatches.length}
                </div>
                <div className="text-sm text-muted-foreground">Correct Matches</div>
              </div>

              <Badge variant={percentage >= 80 ? "default" : "secondary"} className="text-sm px-3 py-1">
                +{score * 10} XP Earned
              </Badge>

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
                Round {currentRound + 1} of {codeMatches.length}
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
              <code className="text-lg">{currentMatch.code}</code>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentMatch.options.map((option, index) => (
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
                  <p className="text-primary font-medium">Correct! +10 XP</p>
                ) : (
                  <p className="text-destructive font-medium">Incorrect. Try again next time!</p>
                )}

                <Button onClick={handleNextRound} className="mt-4 w-full">
                  {currentRound === codeMatches.length - 1 ? "Finish Game" : "Next Round"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

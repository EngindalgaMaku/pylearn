"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Zap } from "lucide-react"
import Link from "next/link"

const codingChallenges = [
  {
    title: "Fix the Syntax Error",
    description: "Find and fix the syntax error in this Python code",
    code: `def greet_user(name)
    print(f"Hello, {name}!")
    return name.upper()`,
    solution: `def greet_user(name):
    print(f"Hello, {name}!")
    return name.upper()`,
    hint: "Missing colon after function definition",
    timeLimit: 30,
  },
  {
    title: "Complete the Function",
    description: "Complete this function to return the sum of all numbers in a list",
    code: `def sum_numbers(numbers):
    # Your code here
    pass`,
    solution: `def sum_numbers(numbers):
    total = 0
    for num in numbers:
        total += num
    return total`,
    hint: "Use a loop to iterate through the list",
    timeLimit: 45,
  },
  {
    title: "Debug the Logic",
    description: "Fix the logic error in this function that should return even numbers",
    code: `def get_even_numbers(numbers):
    result = []
    for num in numbers:
        if num % 2 == 1:
            result.append(num)
    return result`,
    solution: `def get_even_numbers(numbers):
    result = []
    for num in numbers:
        if num % 2 == 0:
            result.append(num)
    return result`,
    hint: "Check the condition for even numbers",
    timeLimit: 40,
  },
]

export default function SpeedCoding() {
  const [currentChallenge, setCurrentChallenge] = useState(0)
  const [userCode, setUserCode] = useState("")
  const [timeLeft, setTimeLeft] = useState(codingChallenges[0].timeLimit)
  const [showHint, setShowHint] = useState(false)
  const [challengeCompleted, setChallengeCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    setUserCode(codingChallenges[currentChallenge].code)
    setTimeLeft(codingChallenges[currentChallenge].timeLimit)
    setShowHint(false)
    setStartTime(Date.now())
  }, [currentChallenge])

  useEffect(() => {
    if (timeLeft > 0 && !challengeCompleted && startTime) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, challengeCompleted, startTime])

  const checkSolution = () => {
    const normalizedUser = userCode.trim().replace(/\s+/g, " ")
    const normalizedSolution = codingChallenges[currentChallenge].solution.trim().replace(/\s+/g, " ")

    if (normalizedUser === normalizedSolution) {
      const timeBonus = Math.max(0, timeLeft * 2)
      setScore(score + 100 + timeBonus)

      if (currentChallenge < codingChallenges.length - 1) {
        setCurrentChallenge(currentChallenge + 1)
      } else {
        setChallengeCompleted(true)
      }
    }
  }

  if (challengeCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold">Speed Challenge Complete!</h1>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-secondary">{score}</p>
              <p className="text-muted-foreground">Total Points Earned</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Badge className="bg-secondary/10 text-secondary border-secondary/20">+{Math.floor(score / 10)} XP</Badge>
              <Badge className="bg-primary/10 text-primary border-primary/20">+{Math.floor(score / 20)} Diamonds</Badge>
            </div>
            <div className="flex gap-3 justify-center">
              <Link href="/challenges">
                <Button>Back to Challenges</Button>
              </Link>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/challenges">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Speed Coding Challenge</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-secondary">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-medium">{timeLeft}s</span>
            </div>
            <Badge variant="outline">Challenge {currentChallenge + 1}/3</Badge>
          </div>
        </div>
      </header>

      {/* Challenge */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-secondary" />
              {codingChallenges[currentChallenge].title}
            </CardTitle>
            <p className="text-muted-foreground">{codingChallenges[currentChallenge].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Code:</label>
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full h-40 p-3 font-mono text-sm bg-muted rounded-lg border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your code here..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={checkSolution} className="flex-1">
                Submit Solution
              </Button>
              <Button variant="outline" onClick={() => setShowHint(!showHint)}>
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
            </div>

            {showHint && (
              <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                <p className="text-sm">
                  <strong>Hint:</strong> {codingChallenges[currentChallenge].hint}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                Current Score: <strong>{score}</strong>
              </span>
              <span>
                Time Bonus: <strong>+{timeLeft * 2} points</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

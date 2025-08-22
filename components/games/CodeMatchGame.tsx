"use client"

import { useState, useEffect, useRef } from "react"
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

/**
 * 50 Python code-to-output questions.
 * Note: options are shuffled per game start, while preserving the correct answer mapping.
 */
const QUESTIONS_POOL: Question[] = [
  { id: 1, code: "print('Hello World')", options: ["Hello World", "print('Hello World')", "Hello", "World"], correct: 0 },
  { id: 2, code: "len('Python')", options: ["5", "6", "7", "Python"], correct: 1 },
  { id: 3, code: "3 + 4 * 2", options: ["14", "11", "10", "24"], correct: 1 },
  { id: 4, code: "type(42)", options: ["<class 'str'>", "<class 'int'>", "<class 'float'>", "42"], correct: 1 },
  { id: 5, code: "'Python'.upper()", options: ["python", "PYTHON", "Python", "PyThOn"], correct: 1 },
  { id: 6, code: "'abc' * 3", options: ["abcabc", "abcabcabc", "abc", "abc abc abc"], correct: 1 },
  { id: 7, code: "10 // 3", options: ["3", "3.3333", "3.0", "4"], correct: 0 },
  { id: 8, code: "10 / 4", options: ["2", "2.5", "2.0", "2.25"], correct: 1 },
  { id: 9, code: "10 % 4", options: ["1", "2", "3", "4"], correct: 1 },
  { id: 10, code: "2 ** 3", options: ["6", "8", "9", "16"], correct: 1 },
  { id: 11, code: "bool([])", options: ["True", "False", "[]", "0"], correct: 1 },
  { id: 12, code: "bool([0])", options: ["False", "True", "0", "None"], correct: 1 },
  { id: 13, code: "[1, 2, 3][0]", options: ["1", "0", "2", "[1]"], correct: 0 },
  { id: 14, code: "[1, 2, 3][-1]", options: ["-1", "3", "2", "Error"], correct: 1 },
  { id: 15, code: "'hello'[1:4]", options: ["ell", "hel", "llo", "heo"], correct: 0 },
  { id: 16, code: "'hello'[::-1]", options: ["olleh", "hello", "ehllo", "holle"], correct: 0 },
  { id: 17, code: "','.join(['a','b','c'])", options: ["a,b,c", "['a','b','c']", "a b c", "abc"], correct: 0 },
  { id: 18, code: "'a,b,c'.split(',')", options: ["['a','b','c']", "['a', 'b', 'c']", "( 'a','b','c' )", "['a, b, c']"], correct: 1 },
  { id: 19, code: "{'x': 1}.get('y', 2)", options: ["1", "2", "None", "'y'"], correct: 1 },
  { id: 20, code: "len(set([1,2,2,3]))", options: ["2", "3", "4", "1"], correct: 1 },
  { id: 21, code: "sum([1,2,3])", options: ["5", "6", "3", "'6'"], correct: 1 },
  { id: 22, code: "min([3,1,2])", options: ["1", "2", "3", "0"], correct: 0 },
  { id: 23, code: "max('bca')", options: ["b", "c", "a", "'c'"], correct: 1 },
  { id: 24, code: "sorted([3,1,2])", options: ["[3,2,1]", "[1, 2, 3]", "(1,2,3)", "{1,2,3}"], correct: 1 },
  { id: 25, code: "sorted('bca')", options: ["'abc'", "['a', 'b', 'c']", "('a','b','c')", "['b','c','a']"], correct: 1 },
  { id: 26, code: "tuple([1, 2])", options: ["[1, 2]", "(1, 2)", "{1, 2}", "1, 2"], correct: 1 },
  { id: 27, code: "list((1, 2))", options: ["(1, 2)", "[1, 2]", "{1, 2}", "1,2"], correct: 1 },
  { id: 28, code: "a, b = 1, 2; print(a + b)", options: ["12", "3", "(1, 2)", "Error"], correct: 1 },
  { id: 29, code: "'5' + '6'", options: ["11", "56", "'56'", "5 6"], correct: 1 },
  { id: 30, code: "int('5') + int('6')", options: ["56", "'11'", "11", "Error"], correct: 2 },
  { id: 31, code: "float('3.14')", options: ["3.14", "3,14", "'3.14'", "3"], correct: 0 },
  { id: 32, code: "type(3.0)", options: ["<class 'int'>", "<class 'float'>", "float", "3.0"], correct: 1 },
  { id: 33, code: "isinstance(True, int)", options: ["True", "False", "Error", "0"], correct: 0 },
  { id: 34, code: "0 and 5", options: ["0", "5", "True", "False"], correct: 0 },
  { id: 35, code: "0 or 5", options: ["0", "5", "True", "False"], correct: 1 },
  { id: 36, code: "5 and 0", options: ["0", "5", "True", "False"], correct: 0 },
  { id: 37, code: "5 or 0", options: ["0", "5", "True", "False"], correct: 1 },
  { id: 38, code: "None == 0", options: ["True", "False", "None", "0"], correct: 1 },
  { id: 39, code: "None is None", options: ["True", "False", "None", "Error"], correct: 0 },
  { id: 40, code: "'Py' in 'Python'", options: ["True", "False", "'Py'", "'Python'"], correct: 0 },
  { id: 41, code: "'x' not in 'abc'", options: ["True", "False", "'x'", "'abc'"], correct: 0 },
  { id: 42, code: "[i*i for i in range(3)]", options: ["[1, 4, 9]", "[0, 1, 4]", "[0, 1, 2]", "[1, 2, 3]"], correct: 1 },
  { id: 43, code: "sum(i for i in range(4))", options: ["4", "6", "10", "3"], correct: 1 },
  { id: 44, code: "{x: x*x for x in range(3)}[2]", options: ["2", "4", "[2]", "Error"], correct: 1 },
  { id: 45, code: "len({1,2,3} & {2,3,4})", options: ["1", "2", "3", "4"], correct: 1 },
  { id: 46, code: "'-'.join('abc')", options: ["a-b-c", "abc-", "-a-b-c-", "a,b,c"], correct: 0 },
  { id: 47, code: "list('hi')", options: ["['hi']", "['h', 'i']", "('h','i')", "['h',' i']"], correct: 1 },
  { id: 48, code: "[1,2,3].pop()", options: ["[1,2]", "3", "None", "Error"], correct: 1 },
  { id: 49, code: "[][0:1]", options: ["[]", "[0]", "[1]", "Error"], correct: 0 },
  { id: 50, code: "(1,)*3", options: ["(3)", "[1,1,1]", "(1, 1, 1)", "1,1,1"], correct: 2 },
]

// Fisher–Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle options of a single question and adjust the correct index
function shuffleQuestionOptions(q: Question): Question {
  const indices = q.options.map((_, i) => i)
  const shuffledIdx = shuffleArray(indices)
  const shuffledOptions = shuffledIdx.map(i => q.options[i])
  const newCorrect = shuffledIdx.indexOf(q.correct)
  return { ...q, options: shuffledOptions, correct: newCorrect }
}

export default function CodeMatchGame() {
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
  const TOTAL_ROUNDS = 10

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

  const startGame = () => {
    // Prepare a new randomized set of questions and options each time
    const shuffledQuestions = shuffleArray(QUESTIONS_POOL)
      .slice(0, TOTAL_ROUNDS)
      .map(shuffleQuestionOptions)
    setQuestions(shuffledQuestions)
    setCurrentRound(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setGameCompleted(false)
    setTimeLeft(30)
    setGameStarted(true)
    runStartRef.current = Date.now()
    postedRef.current = false
  }

  const handleTimeUp = () => {
    setShowResult(true)
    setSelectedAnswer(-1) // Indicates time up
    setGameCompleted(true)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult || timeLeft === 0) return
    setSelectedAnswer(answerIndex)
    setShowResult(true)

    const isCorrect = answerIndex === currentMatch.correct
    if (isCorrect) {
      setScore(score + 1)
    } else {
      setGameCompleted(true)
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
    // Restart by returning to the intro screen; user can Start Game to get a fresh random set
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
    if (!gameCompleted || postedRef.current) return
    postedRef.current = true
    const durationSec = runStartRef.current ? Math.max(0, Math.round((Date.now() - runStartRef.current) / 1000)) : 0
    const payload = {
      gameKey: "code-match",
      score,
      correctCount: score,
      durationSec,
    }
    fetch("/api/games/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      toast({
        title: "Session save failed",
        description: "We couldn't record your game session. Your progress may not update.",
        variant: "destructive",
      })
    })
  }, [gameCompleted, score])

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
                  <li>• One wrong answer ends the game</li>
                  <li>• Complete all 10 rounds to win!</li>
              </ul>
              </div>

              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">10 Questions</Badge>
                <Badge variant="outline">+100 XP</Badge>
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
    const endedEarly = score < questions.length
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
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">{endedEarly ? "Game Over!" : "Perfect Run!"}</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">{endedEarly ? "🏁" : "🏆"}</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">
                {endedEarly ? "One mistake ends the run" : "Flawless victory!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {score}
                </div>
                <div className="text-sm text-muted-foreground">Score</div>
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
                  <p className="text-primary font-medium">Correct! +10 XP</p>
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
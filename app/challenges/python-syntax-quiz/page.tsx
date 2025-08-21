"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, X, Play, Trophy, Target, Timer, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

const quizQuestions = [
  {
    question: "What is the correct way to create a comment in Python?",
    options: ["# This is a comment", "// This is a comment", "<!-- This is a comment -->", "/* This is a comment */"],
    correct: 0,
    explanation: "In Python, single-line comments start with the # symbol.",
    topic: "Syntax",
  },
  {
    question: "Which of the following is the correct way to create a list in Python?",
    options: ["list = {1, 2, 3}", "list = [1, 2, 3]", "list = (1, 2, 3)", "list = <1, 2, 3>"],
    correct: 1,
    explanation: "Lists in Python are created using square brackets [].",
    topic: "Data Types",
  },
  {
    question: "What is the output of: print(type(5.0))?",
    options: ["<class 'int'>", "<class 'float'>", "<class 'double'>", "<class 'number'>"],
    correct: 1,
    explanation: "5.0 is a floating-point number, so its type is 'float'.",
    topic: "Data Types",
  },
  {
    question: "Which keyword is used to define a function in Python?",
    options: ["function", "def", "func", "define"],
    correct: 1,
    explanation: "The 'def' keyword is used to define functions in Python.",
    topic: "Functions",
  },
  {
    question: "What does the len() function return for an empty string?",
    options: ["None", "null", "0", "1"],
    correct: 2,
    explanation: "len() returns the number of characters in a string. An empty string has 0 characters.",
    topic: "Built-in Functions",
  },
]

export default function PythonSyntaxQuiz() {
  const [quizPhase, setQuizPhase] = useState<"start" | "in-progress" | "completed">("start")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quizQuestions.length).fill(null))
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)

  useEffect(() => {
    if (timeLeft > 0 && quizPhase === "in-progress") {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && quizPhase === "in-progress") {
      handleQuizComplete()
    }
  }, [timeLeft, quizPhase])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const startQuiz = () => {
    setQuizPhase("in-progress")
    setStartTime(new Date())
  }

  const handleQuizComplete = () => {
    setEndTime(new Date())
    setQuizPhase("completed")

    // Calculate final score
    let finalScore = 0
    userAnswers.forEach((answer, index) => {
      if (answer === quizQuestions[index].correct) {
        finalScore++
      }
    })
    setScore(finalScore)
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestion] = answerIndex
    setUserAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(userAnswers[currentQuestion + 1])
    } else {
      handleQuizComplete()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(userAnswers[currentQuestion - 1])
    }
  }

  const progressPercentage = ((currentQuestion + 1) / quizQuestions.length) * 100

  if (quizPhase === "start") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Python Basics Syntax Quiz</h1>
              <p className="text-muted-foreground">Test your knowledge of Python syntax fundamentals</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">{quizQuestions.length} Questions</div>
                <div className="text-sm text-muted-foreground">Multiple Choice</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Timer className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">10 Minutes</div>
                <div className="text-sm text-muted-foreground">Time Limit</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-primary" />
                <div className="font-semibold">Up to 100 XP</div>
                <div className="text-sm text-muted-foreground">Rewards</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Quiz Rules:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• You have 10 minutes to complete all questions</li>
                <li>• You can navigate between questions freely</li>
                <li>• Each question has only one correct answer</li>
                <li>• Your progress is automatically saved</li>
              </ul>
            </div>

            <div className="flex gap-3 justify-center">
              <Link href="/challenges">
                <Button variant="outline">Back to Challenges</Button>
              </Link>
              <Button onClick={startQuiz} className="px-8">
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizPhase === "completed") {
    const finalScore = (score / quizQuestions.length) * 100
    const timeTaken = startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : 0
    const averageTimePerQuestion = timeTaken / quizQuestions.length

    // Calculate topic performance
    const topicStats = quizQuestions.reduce(
      (acc, question, index) => {
        const topic = question.topic
        if (!acc[topic]) {
          acc[topic] = { correct: 0, total: 0 }
        }
        acc[topic].total++
        if (userAnswers[index] === question.correct) {
          acc[topic].correct++
        }
        return acc
      },
      {} as Record<string, { correct: number; total: number }>,
    )

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Quiz Completed!</h1>
              <div className="space-y-2">
                <p className="text-5xl font-bold text-primary">{finalScore.toFixed(0)}%</p>
                <p className="text-muted-foreground">
                  {score} out of {quizQuestions.length} questions correct
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                  +{finalScore >= 80 ? 100 : finalScore >= 60 ? 75 : 50} XP
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  +{finalScore >= 80 ? 25 : finalScore >= 60 ? 15 : 10} Diamonds
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{formatTime(timeTaken)}</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Timer className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{averageTimePerQuestion.toFixed(0)}s</div>
                <div className="text-sm text-muted-foreground">Avg per Question</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{((score / quizQuestions.length) * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </CardContent>
            </Card>
          </div>

          {/* Topic Performance */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance by Topic</h3>
              <div className="space-y-3">
                {Object.entries(topicStats).map(([topic, stats]) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="font-medium">{topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {stats.correct}/{stats.total}
                      </span>
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(stats.correct / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">
                        {Math.round((stats.correct / stats.total) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question Review */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Question Review</h3>
              <div className="space-y-4">
                {quizQuestions.map((question, index) => {
                  const userAnswer = userAnswers[index]
                  const isCorrect = userAnswer === question.correct
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">
                            Q{index + 1}: {question.question}
                          </p>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="text-muted-foreground">Your answer:</span>{" "}
                              <span
                                className={
                                  userAnswer !== null
                                    ? isCorrect
                                      ? "text-green-600"
                                      : "text-red-600"
                                    : "text-muted-foreground"
                                }
                              >
                                {userAnswer !== null ? question.options[userAnswer] : "Not answered"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p>
                                <span className="text-muted-foreground">Correct answer:</span>{" "}
                                <span className="text-green-600">{question.options[question.correct]}</span>
                              </p>
                            )}
                            <p className="text-muted-foreground">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-center pb-8">
            <Link href="/challenges">
              <Button>Back to Challenges</Button>
            </Link>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry Quiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz in progress (existing code with timer)
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/challenges">
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Python Basics Syntax Quiz</h1>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Question {currentQuestion + 1} of {quizQuestions.length}
            </span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 space-y-6">
            <h2 className="text-xl font-medium leading-relaxed">{quizQuestions[currentQuestion].question}</h2>

            <div className="space-y-3">
              {quizQuestions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        selectedAnswer === index
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-mono">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">Select one option to continue</p>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                Previous
              </Button>
              <Button onClick={handleNextQuestion} disabled={selectedAnswer === null}>
                {currentQuestion === quizQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

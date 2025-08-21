"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react"

const quizQuestions = [
  {
    id: 1,
    question: "What is the correct way to create a variable in Python?",
    type: "multiple-choice",
    options: ["var name = 'John'", "name = 'John'", "string name = 'John'", "let name = 'John'"],
    correctAnswer: 1,
    explanation: "In Python, you simply assign a value to a variable name without declaring its type.",
  },
  {
    id: 2,
    question: "Which of these is a Python data type?",
    type: "multiple-choice",
    options: ["list", "array", "vector", "collection"],
    correctAnswer: 0,
    explanation: "List is a built-in data type in Python used to store multiple items.",
  },
  {
    id: 3,
    question: "Python is case-sensitive.",
    type: "true-false",
    options: ["True", "False"],
    correctAnswer: 0,
    explanation: "Python is case-sensitive, meaning 'Name' and 'name' are different variables.",
  },
  {
    id: 4,
    question: "What will this code output?\n\nprint(len('Hello'))",
    type: "multiple-choice",
    options: ["4", "5", "6", "Error"],
    correctAnswer: 1,
    explanation: "The len() function returns the number of characters in a string. 'Hello' has 5 characters.",
  },
  {
    id: 5,
    question: "Which symbol is used for comments in Python?",
    type: "multiple-choice",
    options: ["//", "/*", "#", "<!--"],
    correctAnswer: 2,
    explanation: "The # symbol is used for single-line comments in Python.",
  },
]

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)

  const question = quizQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    setShowResult(true)
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (selectedAnswer === question.correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(answers[currentQuestion - 1])
      setShowResult(true)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setQuizCompleted(false)
  }

  if (quizCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100)
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border px-4 py-6">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Quiz Complete!</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">Great Job!</CardTitle>
              <CardDescription>You completed the Python Basics quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">{percentage}%</div>
                <div className="text-sm text-muted-foreground">
                  {score} out of {quizQuestions.length} correct
                </div>
              </div>

              <div className="space-y-2">
                <Badge
                  variant={percentage >= 80 ? "default" : percentage >= 60 ? "secondary" : "outline"}
                  className="text-sm px-3 py-1"
                >
                  {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good Job!" : "Keep Learning!"}
                </Badge>
                <div className="text-xs text-muted-foreground">+{score * 10} XP earned</div>
              </div>

              <div className="flex gap-3">
                <Button onClick={restartQuiz} variant="outline" className="flex-1 bg-transparent">
                  Try Again
                </Button>
                <Button onClick={() => window.history.back()} className="flex-1">
                  Continue Learning
                </Button>
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
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Badge variant="outline">
              {currentQuestion + 1} of {quizQuestions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-[family-name:var(--font-work-sans)] leading-relaxed">
              {question.question}
            </CardTitle>
            {question.type === "multiple-choice" && question.question.includes("print(") && (
              <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                <code>{question.question.split("\n\n")[1]}</code>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === index
                    ? showResult
                      ? index === question.correctAnswer
                        ? "default"
                        : "destructive"
                      : "secondary"
                    : "outline"
                }
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                    {showResult && index === question.correctAnswer ? (
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    ) : showResult && selectedAnswer === index && index !== question.correctAnswer ? (
                      <XCircle className="w-4 h-4 text-destructive-foreground" />
                    ) : (
                      <span className="text-sm font-medium">{String.fromCharCode(65 + index)}</span>
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </Button>
            ))}

            {showResult && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">💡</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Explanation</p>
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestion === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {!showResult ? (
            <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestion === quizQuestions.length - 1 ? "Finish Quiz" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

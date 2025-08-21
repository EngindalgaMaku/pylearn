"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Diamond, Trophy } from "lucide-react"

// Sample lesson data - in real app this would come from API/database
const lessonData = {
  1: {
    id: 1,
    title: "Variables and Data Types",
    description: "Learn about Python variables, strings, numbers, and booleans",
    category: "Python Basics",
    difficulty: "Beginner",
    duration: "15 min",
    xpReward: 50,
    diamondReward: 10,
    content: {
      sections: [
        {
          title: "What are Variables?",
          content:
            "Variables in Python are containers that store data values. Unlike other programming languages, Python has no command for declaring a variable - it is created the moment you first assign a value to it.",
          codeExample: `# Creating variables
name = "Alice"
age = 25
height = 5.6
is_student = True

print(name)    # Output: Alice
print(age)     # Output: 25`,
        },
        {
          title: "Data Types",
          content:
            "Python has several built-in data types. The most common ones are strings (text), integers (whole numbers), floats (decimal numbers), and booleans (True/False).",
          codeExample: `# Different data types
text = "Hello World"        # String
number = 42                 # Integer  
decimal = 3.14             # Float
is_true = True             # Boolean

# Check the type
print(type(text))          # <class 'str'>
print(type(number))        # <class 'int'>`,
        },
        {
          title: "Variable Naming Rules",
          content:
            "Variable names must start with a letter or underscore, can contain letters, numbers, and underscores, and are case-sensitive.",
          codeExample: `# Valid variable names
user_name = "John"
age2 = 30
_private = "secret"

# Invalid variable names (don't do this!)
# 2age = 30        # Can't start with number
# user-name = "John" # Can't use hyphens
# class = "Python"   # Can't use reserved words`,
        },
      ],
      quiz: {
        question: "Which of the following is a valid variable name in Python?",
        options: ["2user_name", "user-name", "user_name", "class"],
        correctAnswer: 2,
        explanation:
          "user_name is valid because it starts with a letter and uses underscores. The others are invalid: 2user_name starts with a number, user-name uses a hyphen, and class is a reserved keyword.",
      },
    },
  },
}

export default function LessonPage({ params }: { params: { id: string } }) {
  const [currentSection, setCurrentSection] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [completed, setCompleted] = useState(false)

  const lesson = lessonData[Number.parseInt(params.id) as keyof typeof lessonData]

  if (!lesson) {
    return <div>Lesson not found</div>
  }

  const totalSections = lesson.content.sections.length
  const progress = ((currentSection + 1) / totalSections) * 100

  const handleNext = () => {
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1)
    } else {
      setShowQuiz(true)
    }
  }

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleQuizSubmit = () => {
    setShowResult(true)
    if (selectedAnswer === lesson.content.quiz.correctAnswer) {
      setCompleted(true)
    }
  }

  const currentSectionData = lesson.content.sections[currentSection]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/learn">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lessons
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">{lesson.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {lesson.difficulty}
              </Badge>
              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!showQuiz ? (
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Section {currentSection + 1} of {totalSections}
                  </span>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-work-sans)]">{currentSectionData.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">{currentSectionData.content}</p>

                {currentSectionData.codeExample && (
                  <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-slate-100">
                      <code>{currentSectionData.codeExample}</code>
                    </pre>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handlePrevious} disabled={currentSection === 0}>
                    Previous
                  </Button>
                  <Button onClick={handleNext}>{currentSection === totalSections - 1 ? "Take Quiz" : "Next"}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quiz */}
            <Card>
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-work-sans)] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Knowledge Check
                </CardTitle>
                <CardDescription>Test your understanding of {lesson.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">{lesson.content.quiz.question}</h3>

                  <div className="space-y-2">
                    {lesson.content.quiz.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto p-4"
                        onClick={() => setSelectedAnswer(index)}
                        disabled={showResult}
                      >
                        <span className="mr-3 font-medium">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>

                  {showResult && (
                    <div
                      className={`p-4 rounded-lg ${
                        selectedAnswer === lesson.content.quiz.correctAnswer
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p className="font-medium mb-2">
                        {selectedAnswer === lesson.content.quiz.correctAnswer ? "✅ Correct!" : "❌ Incorrect"}
                      </p>
                      <p className="text-sm text-muted-foreground">{lesson.content.quiz.explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setShowQuiz(false)} disabled={showResult}>
                      Back to Lesson
                    </Button>
                    {!showResult ? (
                      <Button onClick={handleQuizSubmit} disabled={selectedAnswer === null}>
                        Submit Answer
                      </Button>
                    ) : (
                      <div className="flex items-center gap-4">
                        {completed && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500">⭐</span>+{lesson.xpReward} XP
                            </span>
                            <span className="flex items-center gap-1">
                              <Diamond className="w-3 h-3 text-blue-500" />+{lesson.diamondReward}
                            </span>
                          </div>
                        )}
                        <Link href="/learn">
                          <Button>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete Lesson
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Spacer for fixed navigation */}
      <div className="h-24"></div>
    </div>
  )
}

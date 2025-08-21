"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { CheckCircle, Lock, Play, Trophy, Diamond } from "lucide-react"

const lessons = [
  {
    id: 1,
    title: "Variables and Data Types",
    description: "Learn about Python variables, strings, numbers, and booleans",
    category: "Python Basics",
    difficulty: "Beginner",
    duration: "15 min",
    xpReward: 50,
    diamondReward: 10,
    completed: true,
    locked: false,
    icon: "🔤",
  },
  {
    id: 2,
    title: "Working with Strings",
    description: "String manipulation, formatting, and common methods",
    category: "Python Basics",
    difficulty: "Beginner",
    duration: "20 min",
    xpReward: 60,
    diamondReward: 12,
    completed: true,
    locked: false,
    icon: "📝",
  },
  {
    id: 3,
    title: "Lists and Indexing",
    description: "Creating lists, accessing elements, and list methods",
    category: "Data Structures",
    difficulty: "Beginner",
    duration: "25 min",
    xpReward: 70,
    diamondReward: 15,
    completed: false,
    locked: false,
    icon: "📋",
  },
  {
    id: 4,
    title: "Conditional Statements",
    description: "If, elif, else statements and logical operators",
    category: "Control Flow",
    difficulty: "Intermediate",
    duration: "30 min",
    xpReward: 80,
    diamondReward: 18,
    completed: false,
    locked: false,
    icon: "🔀",
  },
  {
    id: 5,
    title: "Loops and Iteration",
    description: "For loops, while loops, and loop control",
    category: "Control Flow",
    difficulty: "Intermediate",
    duration: "35 min",
    xpReward: 90,
    diamondReward: 20,
    completed: false,
    locked: true,
    icon: "🔄",
  },
  {
    id: 6,
    title: "Functions Basics",
    description: "Defining functions, parameters, and return values",
    category: "Functions",
    difficulty: "Intermediate",
    duration: "40 min",
    xpReward: 100,
    diamondReward: 25,
    completed: false,
    locked: true,
    icon: "⚙️",
  },
]

const categories = ["All", "Python Basics", "Data Structures", "Control Flow", "Functions"]

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredLessons =
    selectedCategory === "All" ? lessons : lessons.filter((lesson) => lesson.category === selectedCategory)

  const completedLessons = lessons.filter((lesson) => lesson.completed).length
  const totalLessons = lessons.length
  const progressPercentage = (completedLessons / totalLessons) * 100

  return (
    <div className="min-h-screen bg-background">

      <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-4 py-8 space-y-8">
        {/* Progress Overview */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Learning Progress
            </CardTitle>
            <CardDescription>
              {completedLessons} of {totalLessons} lessons completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm">
                <span>{Math.round(progressPercentage)}% Complete</span>
                <span className="flex items-center gap-1">
                  <Diamond className="w-4 h-4 text-blue-500" />
                  {lessons.filter((l) => l.completed).reduce((sum, l) => sum + l.diamondReward, 0)} Diamonds Earned
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs md:text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">
            {selectedCategory === "All" ? "All Lessons" : selectedCategory}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  lesson.locked ? "opacity-60" : ""
                } ${lesson.completed ? "border-green-200 bg-green-50/50" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{lesson.icon}</span>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium leading-tight">{lesson.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {lesson.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {lesson.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {lesson.locked && <Lock className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-4">{lesson.description}</CardDescription>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        {lesson.xpReward} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Diamond className="w-3 h-3 text-blue-500" />
                        {lesson.diamondReward}
                      </span>
                    </div>

                    <Link href={lesson.locked ? "#" : `/learn/${lesson.id}`}>
                      <Button size="sm" disabled={lesson.locked} className="flex items-center gap-1">
                        {lesson.completed ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Review
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            {lesson.locked ? "Locked" : "Start"}
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">Recommended Learning Path</CardTitle>
            <CardDescription>Follow this path for the best learning experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">1. Master Python Basics (Variables, Strings, Lists)</div>
              <div className="text-sm text-muted-foreground">2. Learn Control Flow (Conditions, Loops)</div>
              <div className="text-sm text-muted-foreground">3. Understand Functions and Scope</div>
              <div className="text-sm text-muted-foreground">4. Explore Advanced Data Structures</div>
            </div>
          </CardContent>
        </Card>
      </main>

    </div>
  )
}

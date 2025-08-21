"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Lock, CheckCircle, Diamond, Zap, Clock, Trophy, Target, BookOpen } from "lucide-react"
import Link from "next/link"
import { MobilePageHeader } from "@/components/mobile-page-header"

const topics = [
  {
    id: "basics",
    title: "Python Basics",
    description: "Master the fundamentals of Python programming",
    progress: 75,
    totalActivities: 8,
    completedActivities: 6,
    color: "bg-blue-500",
  },
  {
    id: "data-structures",
    title: "Data Structures",
    description: "Learn lists, dictionaries, and advanced collections",
    progress: 40,
    totalActivities: 6,
    completedActivities: 2,
    color: "bg-green-500",
  },
  {
    id: "algorithms",
    title: "Algorithms",
    description: "Explore sorting, searching, and graph algorithms",
    progress: 20,
    totalActivities: 4,
    completedActivities: 1,
    color: "bg-purple-500",
  },
  {
    id: "functions-oop",
    title: "Functions & OOP",
    description: "Advanced programming concepts and patterns",
    progress: 0,
    totalActivities: 2,
    completedActivities: 0,
    color: "bg-orange-500",
  },
]

const activities = [
  {
    id: "variables-intro",
    title: "Python Variables & Data Types",
    description: "Interactive demo of Python variables and basic data types",
    activityType: "Interactive Demo",
    category: "basics",
    difficulty: 1,
    diamondReward: 25,
    experienceReward: 50,
    estimatedMinutes: 12,
    isLocked: false,
    isCompleted: true,
    tags: ["variables", "data-types", "basics"],
  },
  {
    id: "builtin-functions",
    title: "Built-in Functions Explorer",
    description: "Hands-on practice with Python's essential built-in functions",
    activityType: "Coding Lab",
    category: "basics",
    difficulty: 2,
    diamondReward: 35,
    experienceReward: 70,
    estimatedMinutes: 18,
    isLocked: false,
    isCompleted: true,
    tags: ["functions", "built-ins", "practice"],
  },
  {
    id: "string-methods",
    title: "String Methods Matching",
    description: "Match string methods with their correct outputs and use cases",
    activityType: "Matching Game",
    category: "basics",
    difficulty: 2,
    diamondReward: 30,
    experienceReward: 60,
    estimatedMinutes: 15,
    isLocked: false,
    isCompleted: true,
    tags: ["strings", "methods", "matching"],
  },
  {
    id: "control-structures",
    title: "Control Flow Code Builder",
    description: "Build complete programs using loops and conditional statements",
    activityType: "Code Builder",
    category: "basics",
    difficulty: 3,
    diamondReward: 45,
    experienceReward: 90,
    estimatedMinutes: 25,
    isLocked: false,
    isCompleted: true,
    tags: ["loops", "conditionals", "control-flow"],
  },
  {
    id: "list-operations",
    title: "List Operations Lab",
    description: "Master list creation, modification, and advanced operations",
    activityType: "Coding Lab",
    category: "data-structures",
    difficulty: 2,
    diamondReward: 40,
    experienceReward: 80,
    estimatedMinutes: 20,
    isLocked: false,
    isCompleted: true,
    tags: ["lists", "operations", "data-structures"],
  },
  {
    id: "dict-exploration",
    title: "Dictionary Data Explorer",
    description: "Explore and manipulate real-world data using Python dictionaries",
    activityType: "Data Exploration",
    category: "data-structures",
    difficulty: 3,
    diamondReward: 50,
    experienceReward: 100,
    estimatedMinutes: 30,
    isLocked: false,
    isCompleted: true,
    tags: ["dictionaries", "data", "exploration"],
  },
  {
    id: "binary-search",
    title: "Binary Search Visualizer",
    description: "Interactive visualization of the binary search algorithm",
    activityType: "Algorithm Visualization",
    category: "algorithms",
    difficulty: 4,
    diamondReward: 55,
    experienceReward: 110,
    estimatedMinutes: 28,
    isLocked: false,
    isCompleted: true,
    tags: ["binary-search", "algorithms", "visualization"],
  },
  {
    id: "sorting-comparison",
    title: "Sorting Algorithms Showdown",
    description: "Compare and contrast different sorting algorithms with live demos",
    activityType: "Interactive Demo",
    category: "algorithms",
    difficulty: 4,
    diamondReward: 60,
    experienceReward: 120,
    estimatedMinutes: 35,
    isLocked: true,
    isCompleted: false,
    tags: ["sorting", "algorithms", "comparison"],
  },
]

const activityTypeColors = {
  "Interactive Demo": "bg-blue-100 text-blue-800",
  "Coding Lab": "bg-green-100 text-green-800",
  "Matching Game": "bg-purple-100 text-purple-800",
  "Code Builder": "bg-orange-100 text-orange-800",
  "Data Exploration": "bg-teal-100 text-teal-800",
  "Algorithm Visualization": "bg-red-100 text-red-800",
}

const difficultyLabels = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"]
const difficultyColors = ["", "bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"]

export default function ActivitiesPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  const filteredActivities = selectedTopic
    ? activities.filter((activity) => activity.category === selectedTopic)
    : activities

  const totalActivities = activities.length
  const completedActivities = activities.filter((a) => a.isCompleted).length
  const overallProgress = Math.round((completedActivities / totalActivities) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Mobile Header - standardized like Shop page */}
      <MobilePageHeader title="Learning Activities" subtitle="Master Python through interactive challenges" />

      <div className="max-w-4xl mx-auto lg:max-w-6xl xl:max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        <div className="mb-8 md:mb-12">

          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              Learning Activities
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Master Python through interactive experiences and hands-on challenges
            </p>

            {/* Overall Progress Card */}
            <Card className="max-w-md mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Trophy className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{overallProgress}%</div>
                    <div className="text-sm text-muted-foreground">Overall Progress</div>
                  </div>
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <Progress value={overallProgress} className="h-3 mb-2" />
                <div className="text-sm text-muted-foreground">
                  {completedActivities} of {totalActivities} activities completed
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-serif font-bold text-xl md:text-2xl text-foreground">Choose Your Path</h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              variant={selectedTopic === null ? "default" : "outline"}
              onClick={() => setSelectedTopic(null)}
              className="font-medium"
            >
              All Topics
            </Button>
            {topics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopic === topic.id ? "default" : "outline"}
                onClick={() => setSelectedTopic(topic.id)}
                className="font-medium"
              >
                {topic.title}
              </Button>
            ))}
          </div>

          {selectedTopic === null && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-4 h-4 rounded-full ${topic.color} shadow-lg`} />
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {topic.completedActivities}/{topic.totalActivities}
                      </Badge>
                    </div>
                    <CardTitle className="font-serif font-bold text-lg text-foreground">{topic.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{topic.progress}%</span>
                      </div>
                      <Progress value={topic.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="font-serif font-bold text-xl md:text-2xl text-foreground mb-6">
            {selectedTopic ? `${topics.find((t) => t.id === selectedTopic)?.title} Activities` : "All Activities"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => (
            <Card
              key={activity.id}
              className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                activity.isLocked ? "opacity-60" : ""
              } border-border/50 bg-card/80 backdrop-blur-sm`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge
                        className={`${activityTypeColors[activity.activityType as keyof typeof activityTypeColors]} font-medium`}
                      >
                        {activity.activityType}
                      </Badge>
                      <Badge className={`${difficultyColors[activity.difficulty]} text-white font-medium`}>
                        {difficultyLabels[activity.difficulty]}
                      </Badge>
                    </div>
                    <CardTitle className="font-serif font-bold text-lg flex items-center gap-2 text-foreground">
                      {activity.title}
                      {activity.isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {activity.isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground leading-relaxed">
                      {activity.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Diamond className="w-4 h-4" />
                          <span className="font-medium">{activity.diamondReward}</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">{activity.experienceReward} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{activity.estimatedMinutes}m</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {activity.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-border/50">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    className="w-full font-medium shadow-sm"
                    disabled={activity.isLocked}
                    asChild={!activity.isLocked}
                    variant={activity.isCompleted ? "outline" : "default"}
                  >
                    {activity.isLocked ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Locked
                      </>
                    ) : (
                      <Link href={`/activities/${activity.id}`}>
                        <Play className="w-4 h-4 mr-2" />
                        {activity.isCompleted ? "Play Again" : "Start Activity"}
                      </Link>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

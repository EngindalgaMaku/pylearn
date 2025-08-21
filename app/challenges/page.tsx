"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Clock, Star, Zap } from "lucide-react"
import Link from "next/link"

const dailyChallenge = {
  title: "Python Syntax Sprint",
  description: "Complete 5 syntax puzzles in under 10 minutes",
  progress: 3,
  total: 5,
  timeLimit: "10 min",
  reward: 100,
  difficulty: "Medium",
  expires: "23h 45m",
}

const weeklyChallenge = {
  title: "Learning Marathon",
  description: "Complete 15 learning activities this week",
  progress: 7,
  total: 15,
  reward: 200,
  difficulty: "Hard",
  expires: "3 days",
}

const specialEvents = [
  {
    id: 1,
    title: "Python Mastery Week",
    description: "Double XP for all Python basics activities",
    type: "Double XP",
    duration: "5 days left",
    active: true,
  },
  {
    id: 2,
    title: "New Year Challenge",
    description: "Learn something new every day in January",
    type: "Monthly",
    duration: "Starts Jan 1",
    active: false,
  },
]

const achievements = [
  {
    title: "First Challenge",
    description: "Complete your first daily challenge",
    icon: "🎯",
    earned: true,
    rarity: "Common",
  },
  {
    title: "Speed Demon",
    description: "Complete a challenge in record time",
    icon: "⚡",
    earned: true,
    rarity: "Rare",
  },
  {
    title: "Consistency King",
    description: "Complete daily challenges for 7 days straight",
    icon: "👑",
    earned: false,
    rarity: "Epic",
  },
  {
    title: "Challenge Master",
    description: "Complete 50 challenges total",
    icon: "🏆",
    earned: false,
    rarity: "Legendary",
  },
]

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState("challenges")

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Challenges</h1>
          </div>
          <p className="text-muted-foreground text-sm">Take on special challenges for bonus rewards</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Daily Challenge */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <CardTitle className="font-[family-name:var(--font-work-sans)]">Daily Challenge</CardTitle>
              </div>
              <Badge variant="secondary">Expires in {dailyChallenge.expires}</Badge>
            </div>
            <CardDescription>{dailyChallenge.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{dailyChallenge.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  {dailyChallenge.progress}/{dailyChallenge.total}
                </span>
              </div>
              <Progress value={(dailyChallenge.progress / dailyChallenge.total) * 100} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">{dailyChallenge.difficulty}</Badge>
                <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                  +{dailyChallenge.reward} XP
                </Badge>
              </div>
              <Button size="sm">Continue</Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Challenge */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-secondary" />
                <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Weekly Challenge</CardTitle>
              </div>
              <Badge variant="outline">Expires in {weeklyChallenge.expires}</Badge>
            </div>
            <CardDescription>{weeklyChallenge.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{weeklyChallenge.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  {weeklyChallenge.progress}/{weeklyChallenge.total}
                </span>
              </div>
              <Progress value={(weeklyChallenge.progress / weeklyChallenge.total) * 100} className="h-2" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="destructive">{weeklyChallenge.difficulty}</Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">+{weeklyChallenge.reward} XP</Badge>
              </div>
              <Button size="sm" variant="secondary">
                View Progress
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sample Challenges */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Featured Challenges</h2>

          <Link href="/challenges/python-syntax-quiz">
            <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Python Syntax Quiz</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20">+100 XP</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Test your Python syntax knowledge with 5 questions</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">10 minutes</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Quiz
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/challenges/speed-coding">
            <Card className="border-secondary/20 bg-secondary/5 hover:bg-secondary/10 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Speed Coding Challenge</h3>
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">+150 XP</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Fix code errors as fast as you can</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Timed</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Coding
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Special Events */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Special Events</h2>

          {specialEvents.map((event) => (
            <Card key={event.id} className={event.active ? "border-secondary/20 bg-secondary/5" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{event.title}</h3>
                  <Badge variant={event.active ? "secondary" : "outline"}>{event.active ? "Active" : "Upcoming"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{event.duration}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Challenge Achievements */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Challenge Achievements</h2>

          {achievements.map((achievement, index) => (
            <Card key={index} className={achievement.earned ? "bg-primary/5 border-primary/20" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.earned ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <span className="text-2xl">{achievement.earned ? achievement.icon : "🔒"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          achievement.rarity === "Legendary"
                            ? "border-yellow-500 text-yellow-600"
                            : achievement.rarity === "Epic"
                              ? "border-purple-500 text-purple-600"
                              : achievement.rarity === "Rare"
                                ? "border-blue-500 text-blue-600"
                                : "border-gray-500 text-gray-600"
                        }`}
                      >
                        {achievement.rarity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Challenge Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-secondary" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
              <p className="text-sm font-medium">Daily Consistency</p>
              <p className="text-xs text-muted-foreground">
                Complete daily challenges to maintain your streak and earn bonus XP
              </p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">Time Management</p>
              <p className="text-xs text-muted-foreground">
                Some challenges are timed - practice regularly to improve your speed
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

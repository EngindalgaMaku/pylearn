"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Trophy, Target, Zap } from "lucide-react"
import Link from "next/link"
import { MobilePageHeader } from "@/components/mobile-page-header"

const learningStats = {
  totalXP: 1250,
  currentLevel: 3,
  xpToNextLevel: 250,
  currentStreak: 7,
  longestStreak: 12,
  quizzesCompleted: 15,
  gamesPlayed: 8,
  totalStudyTime: "4h 32m",
  averageScore: 78,
}

const subjectProgress = [
  { subject: "Variables & Data Types", progress: 85, completed: 12, total: 14 },
  { subject: "Control Flow", progress: 60, completed: 6, total: 10 },
  { subject: "Functions", progress: 25, completed: 2, total: 8 },
  { subject: "Lists & Dictionaries", progress: 0, completed: 0, total: 12 },
]

const recentActivity = [
  { type: "quiz", title: "Python Basics Quiz", score: 80, xp: 50, date: "Today" },
  { type: "game", title: "Code Match", score: 100, xp: 50, date: "Today" },
  { type: "quiz", title: "Variables Quiz", score: 90, xp: 45, date: "Yesterday" },
  { type: "game", title: "Syntax Puzzle", score: 75, xp: 60, date: "2 days ago" },
]

const achievements = [
  { title: "First Steps", description: "Complete your first quiz", earned: true, date: "5 days ago" },
  { title: "Game Master", description: "Play 5 different games", earned: true, date: "3 days ago" },
  { title: "Week Warrior", description: "Study for 7 days in a row", earned: true, date: "Today" },
  { title: "Perfect Score", description: "Get 100% on any quiz", earned: false, date: null },
  { title: "Speed Demon", description: "Complete 10 quizzes in one day", earned: false, date: null },
]

export default function ProfilePage() {
  const levelProgress = ((learningStats.totalXP % 500) / 500) * 100

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile Header - standardized like Shop page */}
      <MobilePageHeader title="Your Progress" subtitle="Track your learning" />

      {/* Desktop Header */}
      <header className="bg-card border-b border-border px-4 py-6 hidden md:block">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Your Progress</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Level & XP Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-[family-name:var(--font-work-sans)]">
                  Level {learningStats.currentLevel}
                </CardTitle>
                <CardDescription>{learningStats.totalXP} XP Total</CardDescription>
              </div>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress to Level {learningStats.currentLevel + 1}</span>
                <span className="font-medium">{learningStats.xpToNextLevel} XP to go</span>
              </div>
              <Progress value={levelProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-primary">{learningStats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{learningStats.averageScore}%</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div className="text-2xl font-bold text-primary">{learningStats.quizzesCompleted}</div>
              <div className="text-xs text-muted-foreground">Quizzes Done</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold text-primary">{learningStats.totalStudyTime}</div>
              <div className="text-xs text-muted-foreground">Study Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Learning Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectProgress.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">{subject.subject}</h3>
                  <Badge variant="outline" className="text-xs">
                    {subject.completed}/{subject.total}
                  </Badge>
                </div>
                <Progress value={subject.progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">{subject.progress}% Complete</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm">{activity.type === "quiz" ? "📝" : "🎮"}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{activity.score}%</div>
                  <div className="text-xs text-secondary">+{activity.xp} XP</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Achievements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  achievement.earned ? "bg-primary/5 border border-primary/20" : "bg-muted/30 opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.earned ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <span className="text-lg">{achievement.earned ? "🏆" : "🔒"}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  {achievement.earned && achievement.date && (
                    <p className="text-xs text-primary mt-1">Earned {achievement.date}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Weekly Goal</CardTitle>
            <CardDescription>Complete 10 learning activities this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">7/10 activities</span>
              </div>
              <Progress value={70} className="h-2" />
              <div className="text-xs text-muted-foreground">3 more activities to reach your goal!</div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

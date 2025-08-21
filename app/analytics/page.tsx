"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Calendar, Clock } from "lucide-react"
import Link from "next/link"

const weeklyData = [
  { day: "Mon", activities: 2, xp: 100 },
  { day: "Tue", activities: 3, xp: 150 },
  { day: "Wed", activities: 1, xp: 50 },
  { day: "Thu", activities: 4, xp: 200 },
  { day: "Fri", activities: 2, xp: 120 },
  { day: "Sat", activities: 3, xp: 180 },
  { day: "Sun", activities: 2, xp: 100 },
]

const monthlyStats = {
  totalActivities: 45,
  totalXP: 2250,
  averageScore: 82,
  bestStreak: 12,
  topicsMastered: 3,
  timeSpent: "18h 45m",
}

export default function AnalyticsPage() {
  const maxXP = Math.max(...weeklyData.map((d) => d.xp))

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Learning Analytics</h1>
          </div>
          <p className="text-muted-foreground text-sm">Detailed insights into your learning journey</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Monthly Overview */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">This Month</CardTitle>
            <CardDescription>Your learning summary for December</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{monthlyStats.totalActivities}</div>
                <div className="text-xs text-muted-foreground">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{monthlyStats.totalXP}</div>
                <div className="text-xs text-muted-foreground">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{monthlyStats.averageScore}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{monthlyStats.topicsMastered}</div>
                <div className="text-xs text-muted-foreground">Topics Mastered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">This Week's Activity</CardTitle>
            <CardDescription>XP earned each day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 text-xs text-muted-foreground">{day.day}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${(day.xp / maxXP) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs font-medium w-12 text-right">{day.xp} XP</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {day.activities} {day.activities === 1 ? "activity" : "activities"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Improving Trend</p>
                <p className="text-xs text-muted-foreground">Your scores have improved by 15% this week</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
              <Calendar className="w-5 h-5 text-secondary" />
              <div>
                <p className="text-sm font-medium">Consistent Learning</p>
                <p className="text-xs text-muted-foreground">You've studied 7 days in a row - great job!</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Peak Learning Time</p>
                <p className="text-xs text-muted-foreground">You perform best between 2-4 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔤</span>
                <div>
                  <p className="text-sm font-medium">Variables & Data Types</p>
                  <p className="text-xs text-muted-foreground">Your strongest topic</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">92% avg</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔄</span>
                <div>
                  <p className="text-sm font-medium">Control Flow</p>
                  <p className="text-xs text-muted-foreground">Room for improvement</p>
                </div>
              </div>
              <Badge variant="outline">68% avg</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">📦</span>
                <div>
                  <p className="text-sm font-medium">Functions</p>
                  <p className="text-xs text-muted-foreground">Just getting started</p>
                </div>
              </div>
              <Badge variant="secondary">45% avg</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Study Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
              <p className="text-sm font-medium">Focus on Control Flow</p>
              <p className="text-xs text-muted-foreground mb-2">
                Practice more loops and conditional statements to improve your score
              </p>
              <Button size="sm" variant="outline">
                Practice Now
              </Button>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">Try Advanced Quizzes</p>
              <p className="text-xs text-muted-foreground mb-2">You're ready for more challenging Python concepts</p>
              <Button size="sm" variant="outline">
                Explore
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

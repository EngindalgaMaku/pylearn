import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, Calendar, Clock } from "lucide-react"
import Link from "next/link"

type WeeklyPoint = { day: string; activities: number; xp: number }

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">Analytics</CardTitle>
            <CardDescription>Sign in to see your learning analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 6)
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch attempts for week and month with related activity for XP
  const [weeklyAttempts, monthlyAttempts, user] = await Promise.all([
    prisma.activityAttempt.findMany({
      where: { userId, startedAt: { gte: startOfWeek } },
      include: { activity: true },
      orderBy: { startedAt: "asc" },
    }),
    prisma.activityAttempt.findMany({
      where: { userId, startedAt: { gte: startOfMonth } },
      include: { activity: true },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ])

  // Weekly aggregation
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weeklyMap = new Map<string, WeeklyPoint>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    const key = d.toDateString()
    weeklyMap.set(key, { day: dayLabels[d.getDay()], activities: 0, xp: 0 })
  }
  let weeklyTimeSpent = 0
  weeklyAttempts.forEach((a) => {
    const key = new Date(a.startedAt).toDateString()
    const current = weeklyMap.get(key)
    if (!current) return
    current.activities += a.completed ? 1 : 0
    current.xp += a.completed ? (a.activity?.experienceReward ?? 0) : 0
    weeklyTimeSpent += a.timeSpent ?? 0
  })
  const weeklyData = Array.from(weeklyMap.values())
  const maxXP = Math.max(1, ...weeklyData.map((d) => d.xp))

  // Monthly stats
  const monthlyCompleted = monthlyAttempts.filter((a) => a.completed)
  const totalActivities = monthlyCompleted.length
  const totalXP = monthlyCompleted.reduce((sum, a) => sum + (a.activity?.experienceReward ?? 0), 0)
  const averageScore = monthlyCompleted.length
    ? Math.round(
        monthlyCompleted.reduce((sum, a) => sum + (a.score ?? 0), 0) / monthlyCompleted.length
      )
    : 0
  const monthlyTimeSpent = monthlyAttempts.reduce((sum, a) => sum + (a.timeSpent ?? 0), 0)

  // Topics mastered: categories with >=3 completed attempts and avg score >= 80
  const categoryStats = new Map<string, { count: number; scoreSum: number }>()
  monthlyCompleted.forEach((a) => {
    const cat = a.activity?.category ?? "general"
    const entry = categoryStats.get(cat) || { count: 0, scoreSum: 0 }
    entry.count += 1
    entry.scoreSum += a.score ?? 0
    categoryStats.set(cat, entry)
  })
  const topicsMastered = Array.from(categoryStats.entries()).filter(([_, v]) => v.count >= 3 && v.scoreSum / v.count >= 80)
    .length

  const bestStreak = Math.max(user?.maxLoginStreak ?? 0, user?.loginStreak ?? 0)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-work-sans)]">Learning Analytics</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">Detailed insights into your learning journey</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Monthly Overview */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">This Month</CardTitle>
            <CardDescription>Your learning summary for {now.toLocaleString(undefined, { month: "long" })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{totalActivities}</div>
                <div className="text-xs text-muted-foreground">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{totalXP}</div>
                <div className="text-xs text-muted-foreground">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{averageScore}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{topicsMastered}</div>
                <div className="text-xs text-muted-foreground">Topics Mastered</div>
              </div>
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground">Time spent: {formatDuration(monthlyTimeSpent)}</div>
          </CardContent>
        </Card>

        {/* Responsive grid for charts/insights on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div className="text-xs font-medium w-14 text-right">{day.xp} XP</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {day.activities} {day.activities === 1 ? "activity" : "activities"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-muted-foreground mt-4">Weekly time spent: {formatDuration(weeklyTimeSpent)}</div>
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
                  <p className="text-xs text-muted-foreground">Your average score this month is {averageScore}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                <Calendar className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-sm font-medium">Consistency</p>
                  <p className="text-xs text-muted-foreground">Best login streak: {bestStreak} days</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Time Investment</p>
                  <p className="text-xs text-muted-foreground">This month: {formatDuration(monthlyTimeSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Breakdown (by category) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Subject Performance</CardTitle>
            <CardDescription>Based on completed activities this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from(categoryStats.entries()).length === 0 && (
              <div className="text-sm text-muted-foreground">No completed activities yet this month.</div>
            )}
            {Array.from(categoryStats.entries()).map(([cat, stat]) => {
              const avg = stat.count ? Math.round(stat.scoreSum / stat.count) : 0
              const badgeVariant = avg >= 80 ? "default" : avg >= 60 ? "outline" : "secondary"
              const icon = cat.toLowerCase().includes("flow") ? "🔄" : cat.toLowerCase().includes("function") ? "📦" : "🔤"
              return (
                <div key={cat} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <div>
                      <p className="text-sm font-medium">{cat}</p>
                      <p className="text-xs text-muted-foreground">{stat.count} completed</p>
                    </div>
                  </div>
                  <Badge variant={badgeVariant as any}>{avg}% avg</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Study Recommendations (simple, static for now) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
              <p className="text-sm font-medium">Focus on lower-average topics</p>
              <p className="text-xs text-muted-foreground mb-2">
                Practice categories where your average score is below 70% to boost your progress.
              </p>
              <Link href="/activities?type=quiz">
                <Button size="sm" variant="outline">Practice Now</Button>
              </Link>
            </div>

            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium">Try Advanced Quizzes</p>
              <p className="text-xs text-muted-foreground mb-2">You're ready for more challenging Python concepts</p>
              <Link href="/challenges">
                <Button size="sm" variant="outline">Explore</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Trophy, Target, Zap } from "lucide-react"
import Link from "next/link"
import { MobilePageHeader } from "@/components/mobile-page-header"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { generateImageToken } from "@/lib/imageToken"
import { getXPProgress } from "@/lib/xp"

// Always render dynamically so latest stats show
export const dynamic = "force-dynamic"
export const revalidate = 0

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}

function relativeDay(date: Date) {
  const now = new Date()
  const d = new Date(date)
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days} days ago`
}

export default async function ProfilePage({
  searchParams,
}: {
  // Next.js may pass searchParams as a Promise in newer versions
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id

  if (!userId) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <MobilePageHeader title="Your Progress" subtitle="Track your learning" />
        <main className="max-w-md mx-auto px-4 py-10 space-y-4">
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <CardTitle>Please sign in</CardTitle>
              <CardDescription>Log in to see your profile and learning stats.</CardDescription>
              <div className="pt-2">
                <Link href="/login">
                  <Button>Go to Login</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Pagination for recent activity
  const PAGE_SIZE = 10
  const resolvedSearchParams =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as Promise<{ [key: string]: string | string[] | undefined }>)
      : ((searchParams as { [key: string]: string | string[] | undefined }) || undefined)
  const pageParam = Array.isArray(resolvedSearchParams?.page)
    ? resolvedSearchParams?.page[0]
    : resolvedSearchParams?.page
  const page = Math.max(1, Number(pageParam ?? 1) || 1)
  const skip = (page - 1) * PAGE_SIZE

  // Fetch base user and attempts/statistics
  const [user, attemptsRecent, activities, totals, completedCats, ownedCards, totalCompleted] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        experience: true,
        loginStreak: true,
        maxLoginStreak: true,
        quizzesCompleted: true,
      },
    }),
    prisma.activityAttempt.findMany({
      where: { userId, completed: true },
      orderBy: { completedAt: "desc" },
      include: { activity: { select: { title: true, category: true, experienceReward: true } } },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.learningActivity.findMany({
      where: { isActive: true },
      select: { id: true, category: true },
    }),
    prisma.activityAttempt.aggregate({
      where: { userId, completed: true },
      _sum: { timeSpent: true },
      _avg: { score: true },
      _count: true,
    }),
    prisma.activityAttempt.findMany({
      where: { userId, completed: true },
      select: { activity: { select: { category: true } } },
    }),
    prisma.userCard.findMany({
      where: { userId },
      include: {
        card: {
          select: {
            id: true,
            cardTitle: true,
            name: true,
            fileName: true,
            rarity: true,
            category: true,
            diamondPrice: true,
            thumbnailUrl: true,
            imagePath: true,
            attackPower: true,
            defense: true,
            speed: true,
            element: true,
          },
        },
      },
      orderBy: { purchaseDate: "desc" },
      take: 60,
    }),
    prisma.activityAttempt.count({ where: { userId, completed: true } }),
  ])

  const totalXP = user?.experience ?? 0
  const xp = getXPProgress(totalXP)
  const currentLevel = xp.level
  const xpToNextLevel = xp.xpToNextLevel
  const currentStreak = user?.loginStreak ?? 0
  const longestStreak = user?.maxLoginStreak ?? 0

  const totalStudySeconds = totals._sum.timeSpent ?? 0
  const totalStudyTime = formatDuration(totalStudySeconds)
  const averageScore = Math.round(totals._avg.score ?? 0)
  const quizzesCompleted = totals._count

  // Subject progress by category
  const totalsByCat = activities.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1
    return acc
  }, {})
  const completedByCat = completedCats.reduce<Record<string, number>>((acc, att) => {
    const cat = att.activity?.category || "general"
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})
  const subjectProgress = Object.entries(totalsByCat)
    .map(([cat, total]) => {
      const completed = completedByCat[cat] || 0
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0
      return { subject: cat, progress, completed, total }
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6)

  const totalPages = Math.max(1, Math.ceil((totalCompleted || 0) / PAGE_SIZE))

  // Recent activity list (from attempts)
  const recentActivity = attemptsRecent.slice(0, 10).map((att) => ({
    type: "quiz" as const,
    title: att.activity?.title || "Activity",
    score: att.score || 0,
    xp: att.activity?.experienceReward || 0,
    date: att.completedAt ? relativeDay(att.completedAt) : "Today",
  }))

  // Simple achievements derived from data
  const achievements = [
    {
      title: "First Steps",
      description: "Complete your first activity",
      earned: quizzesCompleted >= 1,
      date: quizzesCompleted >= 1 ? recentActivity[0]?.date ?? "Today" : null,
    },
    {
      title: "Week Warrior",
      description: "Login 7 days in a row",
      earned: currentStreak >= 7,
      date: currentStreak >= 7 ? "Today" : null,
    },
    {
      title: "Perfect Score",
      description: "Get 100% on any activity",
      earned: attemptsRecent.some((a) => a.score >= 100),
      date: attemptsRecent.find((a) => a.score >= 100)?.completedAt
        ? relativeDay(attemptsRecent.find((a) => a.score >= 100)!.completedAt!)
        : null,
    },
  ]

  const learningStats = {
    totalXP,
    currentLevel,
    xpToNextLevel,
    currentStreak,
    longestStreak,
    quizzesCompleted,
    gamesPlayed: 0,
    totalStudyTime,
    averageScore,
  }

  const levelProgress = xp.progressPercent

  // Map owned cards to display items with secure image URLs
  const ownedCardItems = (ownedCards || []).map((uc) => {
    const c = uc.card as any
    const tokenThumb = generateImageToken(c.id, "thumbnail")
    const tokenFull = generateImageToken(c.id, "full")
    const image = `/api/secure-image?cardId=${c.id}&type=thumbnail&token=${tokenThumb}`
    const fullImage = `/api/secure-image?cardId=${c.id}&type=full&token=${tokenFull}`
    const name = c.cardTitle || c.name || c.fileName || "Unknown"
    return {
      id: c.id,
      name,
      rarity: c.rarity || "Common",
      category: c.category || "anime-collection",
      price: c.diamondPrice ?? 0,
      image,
      fullImage,
      attackPower: c.attackPower ?? null,
      defense: c.defense ?? null,
      speed: c.speed ?? null,
      element: c.element ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile Header - standardized like Shop page */}
      <MobilePageHeader title="Your Progress" subtitle="Track your learning" />

      {/* Desktop Header */}
      <header className="bg-card border-b border-border px-4 py-6 hidden md:block">
        <div className="max-w-5xl mx-auto">
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

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="owned">Owned Cards</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
              <div className="space-y-6">
                {/* Level & XP */}
                <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-[family-name:var(--font-work-sans)]">Level {learningStats.currentLevel}</CardTitle>
                        <CardDescription>XP to next level: {learningStats.xpToNextLevel}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{learningStats.totalXP} XP</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={levelProgress} className="h-2" />
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">XP</div>
                      <div className="text-lg font-semibold">{learningStats.totalXP}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">Level</div>
                      <div className="text-lg font-semibold">{learningStats.currentLevel}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">Streak</div>
                      <div className="text-lg font-semibold">{learningStats.currentStreak} days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-muted-foreground">Study Time</div>
                      <div className="text-lg font-semibold">{learningStats.totalStudyTime}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Subject Progress</CardTitle>
                    <CardDescription>Your progress by category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {subjectProgress.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No progress yet. Try some activities!</div>
                    ) : (
                      subjectProgress.map((s) => (
                        <div key={s.subject} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">{s.subject.replace(/[-_]/g, " ")}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">{s.completed}/{s.total} • {s.progress}%</span>
                          </div>
                          <Progress value={s.progress} className="h-2" />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Recent Activity</CardTitle>
                    <CardDescription>Your latest completed activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No recent activity</div>
                    ) : (
                      recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between">
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
                      ))
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <Link href={`/profile?page=${Math.max(1, page - 1)}`}>
                        <Button variant="outline" size="sm" disabled={page <= 1}>Prev</Button>
                      </Link>
                      <div className="text-xs text-muted-foreground">Page {page} / {totalPages}</div>
                      <Link href={`/profile?page=${Math.min(totalPages, page + 1)}`}>
                        <Button variant="outline" size="sm" disabled={page >= totalPages}>Next</Button>
                      </Link>
                    </div>
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="owned">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Your Cards</CardTitle>
                  <CardDescription>Cards purchased with your diamonds from the Shop.</CardDescription>
                </CardHeader>
                <CardContent>
                  {ownedCardItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">You don't own any cards yet. Visit the Shop to get some!</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {ownedCardItems.map((item) => (
                        <Dialog key={item.id}>
                          <DialogTrigger asChild>
                            <button className="group rounded-lg border bg-card hover:shadow-md transition overflow-hidden text-left">
                              <div className="aspect-[3/4] bg-muted/30">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="p-2">
                                <div className="text-sm font-medium truncate">{item.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center justify-between">
                                  <span>{item.rarity}</span>
                                  <span className="capitalize">{item.category?.toString().replace(/[-_]/g, " ")}</span>
                                </div>
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden" showCloseButton>
                            <DialogHeader className="bg-black/5 p-3 sm:p-4">
                              <DialogTitle className="text-sm font-medium">{item.name}</DialogTitle>
                              <DialogDescription className="text-xs">{item.rarity} • {String(item.category).replace(/[-_]/g, " ")}</DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[80vh] overflow-auto">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.fullImage}
                                alt={item.name}
                                className="w-full h-auto object-contain bg-background"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Account Settings</CardTitle>
                  <CardDescription>Manage your profile and security preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Change Password</div>
                      <div className="text-xs text-muted-foreground">Update your password to keep your account secure.</div>
                    </div>
                    <Link href="/settings">
                      <Button size="sm" variant="secondary">Open Settings</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

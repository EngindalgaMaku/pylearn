"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuizCard } from "@/components/quiz-card"
import Link from "next/link"
import PythonTipWidget from "@/components/python-tip-widget"

// Auth-aware card for "Welcome Back" vs "Join PyLearn"
function AuthAwareCard() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
            Loading...
          </CardTitle>
          <CardDescription className="md:text-base lg:text-lg">
            Preparing your personalized content
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === "authenticated" && session?.user) {
    const user: any = session.user
    const displayName =
      (user?.username as string) ||
      (session.user as any)?.name ||
      (session.user?.email ? session.user.email.split("@")[0] : "Friend")

    const level = user?.level ?? 1
    const experience = user?.experience ?? 0
    const diamonds = user?.currentDiamonds ?? 0
    const streak = user?.loginStreak ?? 1
    const premium = !!user?.isPremium

    // Fixed per-level XP requirement (100 XP per level)
    const perLevel = 100
    const currentInLevel = Math.max(0, experience % perLevel)
    const progress = Math.min(100, Math.round((currentInLevel / perLevel) * 100))
    const xpToNext = Math.max(0, perLevel - currentInLevel)

    return (
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardHeader className="pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold">
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <CardTitle className="font-[family-name:var(--font-work-sans)] text-foreground md:text-xl lg:text-2xl">
                Welcome back, {displayName} 👋
              </CardTitle>
              <CardDescription className="md:text-base lg:text-lg">
                {streak >= 2 ? `🔥 ${streak}-day streak — keep it up!` : "Ready to continue your Python journey?"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link href="/profile">
              <Button size="sm">Profile</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border-t border-primary/20 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs md:text-sm mb-1">
                  <span>🧭 Level {level}</span>
                  <span className="text-muted-foreground">{xpToNext} XP to next</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <Badge variant="outline" className="whitespace-nowrap text-xs md:text-sm py-1 px-2">
                💎 {diamonds}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Guest view: clean card + clear CTAs (primary for Create account, outline for Login)
  return (
    <Card className="bg-card border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
          Join PyLearn
        </CardTitle>
        <CardDescription className="md:text-base lg:text-lg">
          Create a free account to unlock:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm md:text-base lg:text-lg text-muted-foreground">
          <div className="flex flex-col items-end gap-2">
            <span>✅</span>
            <span>Progress tracking and daily streaks</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span>💎</span>
            <span>Earn XP and diamonds from challenges</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span>🔄</span>
            <span>Sync across all your devices</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span>🏆</span>
            <span>Compete on leaderboards</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Link href="/register">
            <Button size="sm" className="lg:px-6">
              Create account
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm" className="lg:px-6">
              Log in
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
export default function HomePage() {
  // Fallback tip used only if API request fails
  const fallbackTip = {
    id: "daily-1",
    title: "List Comprehensions for Cleaner Code",
    content:
      "List comprehensions provide a concise way to create lists. They are more readable and often faster than traditional for loops.",
    codeExample: `# Traditional approach
squares = []
for x in range(10):
    squares.append(x**2)

# List comprehension
squares = [x**2 for x in range(10)]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]`,
    category: "Basics",
    difficulty: "Beginner" as const,
    xpReward: 15,
  }

  const [randomTip, setRandomTip] = useState<any | null>(null)
  const [loadingTip, setLoadingTip] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoadingTip(true)
        const res = await fetch("/api/python-tips/random", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load random tip")
        const data = await res.json()
        const t = data?.tip
        if (t && !cancelled) {
          setRandomTip({
            id: t.id,
            title: t.title,
            content: t.content,
            codeExample: t.codeExample || "",
            category: t.category?.name || t.category?.slug || "General",
            // Convert db difficulty ("beginner" | "intermediate" | "advanced") -> "Beginner" | "Intermediate" | "Advanced"
            difficulty: (t.difficulty || "beginner").charAt(0).toUpperCase() + (t.difficulty || "beginner").slice(1),
            xpReward: t.xpReward ?? 10,
          })
        }
      } catch (_e) {
        if (!cancelled) setRandomTip(null)
      } finally {
        if (!cancelled) setLoadingTip(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <div className="min-h-screen bg-background">

      {/* Mobile Brand Header */}
      <div className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src="/python.svg"
            alt="PyLearn logo"
            className="h-6 w-6"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-primary font-[family-name:var(--font-work-sans)]">PyLearn</span>
            <span className="text-xs text-muted-foreground">Master Python through fun and games</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-4 py-8 space-y-8 md:space-y-10">
        {/* Auth-aware Welcome Section */}
        <AuthAwareCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenge Banner */}
            <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg md:text-xl lg:text-2xl">🎯</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">Daily Challenge</p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">3/5 completed • +100 XP</p>
                    </div>
                  </div>
                  <Link href="/challenges">
                    <Button size="sm" variant="secondary" className="md:size-default lg:px-6">
                      Continue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Featured Lesson */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                  Continue Learning
                </h2>
                <Link href="/learn">
                  <Button variant="ghost" size="sm" className="text-xs md:text-sm lg:text-base">
                    View All Lessons
                  </Button>
                </Link>
              </div>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-5 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-xl md:text-2xl lg:text-3xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-medium md:text-lg lg:text-xl">Lists and Indexing</h3>
                        <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Next lesson • 25 min</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Beginner
                          </Badge>
                          <span className="text-xs text-muted-foreground">+70 XP, +15 💎</span>
                        </div>
                      </div>
                    </div>
                    <Link href="/learn/3">
                      <Button className="md:text-base lg:text-lg">Start Lesson</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Python Tips link/banner */}
            <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 transition-all hover:shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg md:text-xl lg:text-2xl">💡</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">Python Tips</p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        Quick, practical tips to improve your Python daily
                      </p>
                    </div>
                  </div>
                  <Link href="/tips">
                    <Button size="sm" variant="secondary" className="md:size-default lg:px-6">
                      Browse Tips
                      <span className="ml-1" aria-hidden="true">→</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
            </Card>

            {/* Daily Python Tip */}
            <PythonTipWidget tip={randomTip || fallbackTip} />
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <Link href="/learn">
                <Button
                  size="lg"
                  className="h-20 md:h-24 lg:h-28 flex-col gap-2 font-[family-name:var(--font-work-sans)] w-full"
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">📚</span>
                  <span className="md:text-base lg:text-lg">Learn</span>
                </Button>
              </Link>
              <Link href="/quiz">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-20 md:h-24 lg:h-28 flex-col gap-2 font-[family-name:var(--font-work-sans)] w-full"
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">📝</span>
                  <span className="md:text-base lg:text-lg">Take Quiz</span>
                </Button>
              </Link>
            </div>

            {/* Learning Modules */}
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                Learning Modules
              </h2>

              <div className="space-y-3 lg:space-y-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg md:text-xl lg:text-2xl">🔤</span>
                        </div>
                        <div>
                          <h3 className="font-medium md:text-lg lg:text-xl">Python Basics</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                            Variables & Data Types
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 lg:text-base">8/12</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg md:text-xl lg:text-2xl">🔄</span>
                        </div>
                        <div>
                          <h3 className="font-medium md:text-lg lg:text-xl">Control Flow</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Loops & Conditions</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="lg:text-base">
                        3/10
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-60">
                  <CardContent className="p-4 md:p-5 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-lg md:text-xl lg:text-2xl">📦</span>
                        </div>
                        <div>
                          <h3 className="font-medium md:text-lg lg:text-xl">Functions</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Coming Soon</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="lg:text-base">
                        Locked
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Featured Quizzes */}
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                Featured Quizzes
              </h2>

              <QuizCard
                title="Python Basics"
                description="Variables, data types, and basic operations"
                difficulty="Beginner"
                questions={5}
                timeEstimate="5 min"
                icon="🔤"
                href="/quiz"
              />
            </div>

            {/* Recent Achievements */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base md:text-lg lg:text-xl font-[family-name:var(--font-work-sans)]">
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm md:text-base lg:text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="text-sm md:text-base lg:text-lg font-medium">Quiz Master</p>
                    <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                      Completed 5 quizzes in a row
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm md:text-base lg:text-lg">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm md:text-base lg:text-lg font-medium">Speed Learner</p>
                    <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                      Answered 10 questions in under 2 minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg lg:text-xl font-[family-name:var(--font-work-sans)]">
                Weekly Leaderboard
              </CardTitle>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="lg:text-base">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <span className="text-lg md:text-xl lg:text-2xl">👑</span>
                <div>
                  <p className="text-sm md:text-base lg:text-lg font-medium">Alex Chen</p>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground">2,450 XP</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 lg:text-base">#1</Badge>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <span className="text-lg md:text-xl lg:text-2xl">🐍</span>
                <div>
                  <p className="text-sm md:text-base lg:text-lg font-medium">You</p>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground">1,250 XP</p>
                </div>
              </div>
              <Badge variant="secondary" className="lg:text-base">
                #3
              </Badge>
            </div>
          </CardContent>
        </Card>
      </main>



    </div>
  )
}

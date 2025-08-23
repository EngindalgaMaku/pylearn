"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import PythonTipWidget from "@/components/python-tip-widget"
import { UserPlus, LogIn, Trophy } from "lucide-react"
import { getXPProgress } from "@/lib/xp"

type ActivityItem = {
  id: string
  slug: string
  title: string
  description?: string
  category?: string
  activityType?: string
  difficulty?: number | string
  estimatedMinutes?: number
  diamondReward?: number
  experienceReward?: number
  isLocked?: boolean
  completed?: boolean
}

type ModulesSummaryItem = {
  category: string
  total: number
  completed: number
  locked: number
}

type HomeClientProps = {
  dailyChallenge: ActivityItem | null
  nextLesson: ActivityItem | null
  modules: ModulesSummaryItem[]
  tip: any | null
  randomActivity: ActivityItem | null
  leaderboardCurrentUser?: { userId: string; name: string; level: number; streak: number; xp: number; rank: number } | null
}

function difficultyLabel(d: number | string | undefined): string {
  if (typeof d === "string") {
    const s = d.toLowerCase()
    if (s.includes("begin")) return "Beginner"
    if (s.includes("inter")) return "Intermediate"
    if (s.includes("adv")) return "Advanced"
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  const n = Number(d ?? 1)
  if (n <= 1) return "Beginner"
  if (n === 2) return "Intermediate"
  return "Advanced"
}

// Icon and gradient helpers for topic cards
const CATEGORY_ICON: Record<string, string> = {
  "python fundamentals": "📘",
  fundamentals: "📘",
  basics: "📘",
  "control flow": "🔁",
  functions: "🧩",
  "data structures": "🧺",
  "object-oriented programming": "🏗️",
  oop: "🏗️",
  "modules & packages": "📦",
  modules: "📦",
  packages: "📦",
  "file i/o": "📄",
  files: "📄",
  exceptions: "🚨",
  errors: "🚨",
  comprehensions: "🧠",
  "iterators & generators": "♻️",
  iterators: "♻️",
  generators: "♻️",
}
function topicIcon(name: string): string {
  const key = (name || "").toLowerCase().trim()
  if (key.includes("fundament") || key.includes("basic")) return CATEGORY_ICON["python fundamentals"]
  if (key.includes("control")) return CATEGORY_ICON["control flow"]
  if (key.includes("function")) return CATEGORY_ICON["functions"]
  if (key.includes("data")) return CATEGORY_ICON["data structures"]
  if (key.includes("object") || key === "oop") return CATEGORY_ICON["object-oriented programming"]
  if (key.includes("module") || key.includes("package")) return CATEGORY_ICON["modules & packages"]
  if (key.includes("file") || key.includes("i/o") || key.includes("io")) return CATEGORY_ICON["file i/o"]
  if (key.includes("exception") || key.includes("error")) return CATEGORY_ICON["exceptions"]
  if (key.includes("comprehension")) return CATEGORY_ICON["comprehensions"]
  if (key.includes("iter") || key.includes("generator")) return CATEGORY_ICON["iterators & generators"]
  return "📚"
}
function topicGradient(name: string): string {
  const key = (name || "").toLowerCase().trim()
  if (key.includes("fundament") || key.includes("basic")) return "bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-500 text-white"
  if (key.includes("control")) return "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white"
  if (key.includes("function")) return "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white"
  if (key.includes("data")) return "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 text-white"
  if (key.includes("object") || key === "oop") return "bg-gradient-to-br from-fuchsia-600 via-pink-500 to-rose-500 text-white"
  if (key.includes("module") || key.includes("package")) return "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white"
  if (key.includes("file") || key.includes("i/o") || key.includes("io")) return "bg-gradient-to-br from-slate-700 via-slate-600 to-blue-600 text-white"
  if (key.includes("exception") || key.includes("error")) return "bg-gradient-to-br from-red-600 via-rose-600 to-orange-600 text-white"
  if (key.includes("comprehension")) return "bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500 text-white"
  if (key.includes("iter") || key.includes("generator")) return "bg-gradient-to-br from-cyan-600 via-teal-500 to-emerald-500 text-white"
  return "bg-gradient-to-br from-sky-600 to-indigo-600 text-white"
}
// Topic descriptions for common categories like "Python Fundamentals", "Control Flow", "Functions", etc.
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "python fundamentals":
    "Core Python: variables, data types, operators, input/output, and basic syntax to build a solid foundation.",
  fundamentals:
    "Core Python: variables, data types, operators, input/output, and basic syntax to build a solid foundation.",
  basics:
    "Core Python: variables, data types, operators, input/output, and basic syntax to build a solid foundation.",
  "control flow":
    "Master decision making and repetition with if/elif/else, while/for loops, and common control patterns.",
  functions:
    "Define reusable code with parameters, return values, scope, defaults, and docstrings for clarity.",
  "data structures":
    "Work effectively with lists, tuples, sets, and dictionaries. Learn slicing and essential methods.",
  "object-oriented programming":
    "Build robust software with classes, objects, inheritance, and special (dunder) methods.",
  oop:
    "Build robust software with classes, objects, inheritance, and special (dunder) methods.",
  "modules & packages":
    "Organize and reuse code using modules, packages, imports, and the Python standard library.",
  "file i/o":
    "Read and write files safely using contexts, handle encodings, and process text and CSV data.",
  exceptions:
    "Handle errors gracefully with try/except/else/finally, raise custom exceptions, and avoid crashes.",
  comprehensions:
    "Create lists, dictionaries, and sets concisely with comprehensions to improve clarity and performance.",
  "iterators & generators":
    "Build memory‑efficient pipelines using the iterator protocol, yield, and generator expressions.",
}

function describeCategory(name: string): string {
  const key = (name || "").toLowerCase().trim()
  // fuzzy mapping
  if (key.includes("fundament") || key.includes("basic")) return CATEGORY_DESCRIPTIONS["python fundamentals"]
  if (key.includes("control")) return CATEGORY_DESCRIPTIONS["control flow"]
  if (key.includes("function")) return CATEGORY_DESCRIPTIONS["functions"]
  if (key.includes("data")) return CATEGORY_DESCRIPTIONS["data structures"]
  if (key.includes("object") || key === "oop") return CATEGORY_DESCRIPTIONS["object-oriented programming"]
  if (key.includes("module") || key.includes("package")) return CATEGORY_DESCRIPTIONS["modules & packages"]
  if (key.includes("file") || key.includes("i/o") || key.includes("io")) return CATEGORY_DESCRIPTIONS["file i/o"]
  if (key.includes("exception") || key.includes("error")) return CATEGORY_DESCRIPTIONS["exceptions"]
  if (key.includes("comprehension")) return CATEGORY_DESCRIPTIONS["comprehensions"]
  if (key.includes("iter") || key.includes("generator")) return CATEGORY_DESCRIPTIONS["iterators & generators"]
  return CATEGORY_DESCRIPTIONS[key] || `Explore ${name} with structured lessons from fundamentals to advanced practice.`
}

// Auth-aware card for "Welcome Back" vs "Join PyLearn"
function AuthAwareCard() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">Loading...</CardTitle>
          <CardDescription className="md:text-base lg:text-lg">Preparing your personalized content</CardDescription>
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

    const experience = user?.experience ?? 0
    const xp = getXPProgress(experience)
    const level = xp.level
    const diamonds = user?.currentDiamonds ?? 0
    const streak = user?.loginStreak ?? 1

    // Progress using scalable XP curve
    const progress = xp.progressPercent
    const xpToNext = xp.xpToNextLevel

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
                  <span> Level {level}</span>
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

  // Guest view: polished, centered CTA card
  return (
    <Card className="overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-card to-secondary/5">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
          Join PyLearn
        </CardTitle>
        <CardDescription className="md:text-base lg:text-lg">
          Learn faster with a free account
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base text-muted-foreground">
          <li className="flex items-center gap-2">
            <span>✅</span>
            <span>Progress tracking & daily streaks</span>
          </li>
          <li className="flex items-center gap-2">
            <span>💎</span>
            <span>Earn XP and diamonds from challenges</span>
          </li>
          <li className="flex items-center gap-2">
            <span>🔄</span>
            <span>Sync across all your devices</span>
          </li>
          <li className="flex items-center gap-2">
            <span>🏆</span>
            <span>Compete on leaderboards</span>
          </li>
        </ul>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Link href="/register" className="flex-1">
            <Button className="w-full md:text-base lg:text-lg">
              {/* Icon on button */}
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create account
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full md:text-base lg:text-lg">
              {/* Icon on button */}
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Log in
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomeClient(props: HomeClientProps) {
  const { dailyChallenge, nextLesson, modules, tip, randomActivity, leaderboardCurrentUser } = props

  const [rankUser, setRankUser] = useState<typeof leaderboardCurrentUser>(leaderboardCurrentUser)
  const [dailyQuiz, setDailyQuiz] = useState<{
    quiz: { id: string; title: string; description?: string | null; rewardXP: number; rewardDiamonds: number; difficulty: number; expiresInSec: number }
    progress: { attempted: boolean; score?: number; completed?: boolean }
  } | null>(null)

  // Client-side fetch to ensure we have cookies and can resolve current user rank
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch("/api/leaderboard?period=weekly", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!cancelled && data?.currentUser) {
          setRankUser(data.currentUser)
        }
      } catch {}
    }
    // Always fetch to ensure client has fresh auth-bound data
    run()
    return () => { cancelled = true }
  }, [leaderboardCurrentUser])

  // Fetch Daily Quiz (dynamic)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/challenges/daily", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!cancelled && data?.success && data?.quiz) {
          setDailyQuiz({ quiz: data.quiz, progress: data.progress || { attempted: false } })
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  const topTopics = useMemo(() => {
    if (!modules || modules.length === 0) return []
    const pf = (modules ?? []).find(
      (m) => (m.category || "").toLowerCase() === "python fundamentals".toLowerCase()
    )
    return pf ? [pf] : [modules[0]]
  }, [modules])

  const nextLessonHref = nextLesson ? `/learn/${encodeURIComponent(nextLesson.slug)}` : "/learn"
  const nextLessonDifficulty = difficultyLabel(nextLesson?.difficulty)
  const nextLessonMinutes = Math.max(1, Number(nextLesson?.estimatedMinutes ?? 5))

  const dailyHref = dailyQuiz?.quiz && (dailyQuiz.quiz as any).gamePath ? (dailyQuiz.quiz as any).gamePath : "/challenges"
  const dailyXp = dailyQuiz?.quiz?.rewardXP ?? dailyChallenge?.experienceReward ?? 25
  const dailyDiamonds = dailyQuiz?.quiz?.rewardDiamonds ?? dailyChallenge?.diamondReward ?? 10

  const tipData =
    tip && tip.title
      ? tip
      : {
          id: "daily-fallback",
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
          difficulty: "Beginner",
          xpReward: 15,
        }

  // Stable featured games pick to avoid hydration mismatch
  const featuredGames = useMemo(() => [
    { key: "code-match", href: "/games/code-match", title: "Code Match", description: "Match Python code to its output. 50 questions, sudden‑death, 30s per round.", icon: "🧩", badges: [ { label: "50 Q", variant: "secondary" as const }, { label: "Sudden‑Death", variant: "outline" as const }, { label: "30s/round", variant: "outline" as const } ] },
    { key: "data-types", href: "/games/data-types", title: "Data Types", description: "Identify correct Python data types under time pressure.", icon: "🔢", badges: [ { label: "Timed", variant: "secondary" as const }, { label: "Beginner", variant: "outline" as const } ] },
    { key: "function-calls", href: "/games/function-calls", title: "Function Calls", description: "Predict outputs of Python function calls — 5 rounds.", icon: "🧮", badges: [ { label: "+XP", variant: "secondary" as const }, { label: "5 rounds", variant: "outline" as const } ] },
    { key: "loop-runner", href: "/games/loop-runner", title: "Loop Runner", description: "Trace loops and find the final values quickly.", icon: "🔁", badges: [ { label: "Loops", variant: "secondary" as const }, { label: "Fast", variant: "outline" as const } ] },
    { key: "memory-match", href: "/games/memory-match", title: "Memory Match", description: "Flip and match Python terms to strengthen recall.", icon: "🧠", badges: [ { label: "Recall", variant: "secondary" as const }, { label: "Casual", variant: "outline" as const } ] },
    { key: "syntax-puzzle", href: "/games/syntax-puzzle", title: "Syntax Puzzle", description: "Fix broken snippets to valid Python syntax.", icon: "🧩", badges: [ { label: "Fix Code", variant: "secondary" as const }, { label: "Syntax", variant: "outline" as const } ] },
    { key: "variable-naming", href: "/games/variable-naming", title: "Variable Naming", description: "Choose the best variable names for clarity.", icon: "🏷️", badges: [ { label: "Best Practices", variant: "secondary" as const }, { label: "Beginner", variant: "outline" as const } ] },
  ], [])
  const featuredPickRef = useRef<typeof featuredGames[number] | null>(null)
  if (!featuredPickRef.current && featuredGames.length > 0) {
    featuredPickRef.current = featuredGames[Math.floor(Math.random() * featuredGames.length)]
  }
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Brand Header */}
      <div className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/python.svg" alt="PyLearn logo" className="h-6 w-6" />
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
            {/* Daily Challenge Banner (driven by API / DB) */}
            <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg md:text-xl lg:text-2xl">🎯</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">
                        {dailyQuiz?.quiz?.title || "Daily Challenge"}
                      </p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        {dailyQuiz?.quiz?.description || "Complete today’s quick challenge to earn rewards"}
                      </p>
                      <p className="text-xs md:text-sm lg:text-base mt-0.5">
                        +{dailyXp} XP • +{dailyDiamonds} 💎 {dailyQuiz ? `• ${dailyQuiz.quiz.expiresInSec <= 0 ? "Expired" : "Ends today"}` : ""}
                      </p>
                    </div>
                  </div>
                  <Link href={dailyHref}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="md:size-default lg:px-6"
                      disabled={Boolean(dailyQuiz && dailyQuiz.quiz.expiresInSec <= 0)}
                    >
                      {dailyQuiz?.progress?.completed ? "Completed" : dailyQuiz?.progress?.attempted ? "Continue" : "Play Game"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Your Weekly Rank (under Daily Challenge) */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-5 lg:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">Your Weekly Rank</p>
                      {rankUser ? (
                        <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                          #{rankUser.rank} • {rankUser.xp} XP this week
                        </p>
                      ) : (
                        <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                          Complete activities to enter the weekly leaderboard
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href="/leaderboard">
                    <Button size="sm" variant="secondary" className="md:size-default lg:px-6">
                      View Leaderboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Featured / Continue Learning Activities (random) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                  Continue Learning Activities
                </h2>
                <Link href="/activities">
                  <Button variant="ghost" size="sm" className="text-xs md:text-sm lg:text-base">
                    View All Activities
                  </Button>
                </Link>
              </div>
              {(() => {
                const act = randomActivity
                const actHref = act ? `/activities/${encodeURIComponent(act.slug)}` : "/activities"
                const actMinutes = Math.max(1, Number(act?.estimatedMinutes ?? 5))
                const actXP = act?.experienceReward ?? 25
                const actDiamonds = act?.diamondReward ?? 10
                const actType = (act?.activityType || "Activity").replace(/_/g, " ")
                return (
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-4 md:p-5 lg:p-6">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-secondary/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xl md:text-2xl lg:text-3xl">🎯</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium md:text-lg lg:text-xl truncate">
                              {act ? act.title : "Explore Learning Activities"}
                            </h3>
                            <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                              {act ? (act.description || actType) : "Jump into a random interactive activity"}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">{actType}</Badge>
                              <Badge variant="outline" className="text-xs">{actMinutes} min</Badge>
                              <span className="text-xs text-muted-foreground">+{actXP} XP, +{actDiamonds} 💎</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end border-t border-border/60 bg-card/40 px-4 md:px-6 py-3">
                        <Link href={actHref} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto md:text-base lg:text-lg">Start Activity</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
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
            <PythonTipWidget tip={tipData} />
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

            {/* Learning Topics (top 2 by lesson count) */}
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                Learning Topics
              </h2>

              <div className="space-y-3 lg:space-y-4">
                {topTopics && topTopics.length > 0 ? (
                  topTopics.map((m) => {
                    const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0
                    const exploreHref = `/learn?category=${encodeURIComponent(m.category)}`
                    const desc = describeCategory(m.category)
                    return (
                      <Card
                        key={m.category}
                        className="group overflow-hidden rounded-xl border border-border/60 hover:border-primary/30 transition-all hover:shadow-lg"
                      >
                        <CardContent className="p-0">
                          <div className="relative p-4 md:p-6">
                            <div
                              className={`pointer-events-none absolute inset-0 ${topicGradient(m.category)} opacity-10 group-hover:opacity-20 transition-opacity`}
                            />
                            <div className="relative flex items-start gap-4 min-w-0">
                              <div
                                className={`h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-xl flex items-center justify-center shadow-inner shrink-0 ${topicGradient(m.category)}`}
                              >
                                <span className="text-2xl md:text-3xl lg:text-4xl">{topicIcon(m.category)}</span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold md:text-lg lg:text-xl truncate">{m.category}</h3>
                                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                  {m.completed}/{m.total} lessons • {pct}% complete
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-2 break-words max-w-[36ch]">
                                  {desc}
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                  <Progress value={pct} className="h-2 w-40" />
                                  <Badge className="bg-primary/10 text-primary border-primary/20">{pct}%</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-card/40 px-4 md:px-6 py-3">
                            <Link href={exploreHref} className="w-full sm:w-auto">
                              <Button variant="secondary" size="sm" className="w-full sm:w-auto md:text-base">
                                Explore
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Card className="opacity-75">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">No topics found yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>

            </div>

            {/* Featured Games */}
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                Featured Games
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {/* Random Featured Game (stable pick) */}
                {mounted && featuredPickRef.current && (
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-4 md:p-6 flex items-center gap-4">
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center bg-primary/10">
                          <span className="text-2xl md:text-3xl">{featuredPickRef.current.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium md:text-lg lg:text-xl truncate">{featuredPickRef.current.title}</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                            {featuredPickRef.current.description}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {featuredPickRef.current.badges.map((b, i) => (
                              <Badge key={i} variant={b.variant}>{b.label}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end border-t border-border/60 bg-card/40 px-4 md:px-6 py-3">
                        <Link href={featuredPickRef.current.href} className="w-full sm:w-auto">
                          <Button size="sm" className="w-full sm:w-auto md:text-base">Play</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* More Games (CTA) */}
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 md:p-6 flex items-center gap-4">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center bg-secondary/10">
                        <span className="text-2xl md:text-3xl">🎮</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium md:text-lg lg:text-xl truncate">More Games</h3>
                        <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                          Visit the Games page to play fun, interactive challenges.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end border-t border-border/60 bg-card/40 px-4 md:px-6 py-3">
                      <Link href="/games" className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto md:text-base">Go to Games →</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
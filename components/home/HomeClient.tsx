"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PythonTipWidget from "@/components/python-tip-widget";
import {
  UserPlus,
  LogIn,
  Trophy,
  Play,
  ArrowRight,
  Gamepad2,
  Zap,
} from "lucide-react";
import { getXPProgress } from "@/lib/xp";

type ActivityItem = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  activityType?: string;
  difficulty?: number | string;
  estimatedMinutes?: number;
  diamondReward?: number;
  experienceReward?: number;
  isLocked?: boolean;
  completed?: boolean;
};

type ModulesSummaryItem = {
  category: string;
  total: number;
  completed: number;
  locked: number;
};

type HomeClientProps = {
  dailyChallenge: ActivityItem | null;
  nextLesson: ActivityItem | null;
  modules: ModulesSummaryItem[];
  tip: any | null;
  randomActivity: ActivityItem | null;
  leaderboardCurrentUser?: {
    userId: string;
    name: string;
    level: number;
    streak: number;
    xp: number;
    rank: number;
  } | null;
  initialAuth?:
    | {
        status: "authenticated";
        user?: {
          name?: string;
          email?: string;
          username?: string;
          experience?: number;
          currentDiamonds?: number;
          loginStreak?: number;
        };
      }
    | { status: "unauthenticated" };
};

function difficultyLabel(d: number | string | undefined): string {
  if (typeof d === "string") {
    const s = d.toLowerCase();
    if (s.includes("begin")) return "Beginner";
    if (s.includes("inter")) return "Intermediate";
    if (s.includes("adv")) return "Advanced";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const n = Number(d ?? 1);
  if (n <= 1) return "Beginner";
  if (n === 2) return "Intermediate";
  return "Advanced";
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
};
function topicIcon(name: string): string {
  const key = (name || "").toLowerCase().trim();
  if (key.includes("fundament") || key.includes("basic"))
    return CATEGORY_ICON["python fundamentals"];
  if (key.includes("control")) return CATEGORY_ICON["control flow"];
  if (key.includes("function")) return CATEGORY_ICON["functions"];
  if (key.includes("data")) return CATEGORY_ICON["data structures"];
  if (key.includes("object") || key === "oop")
    return CATEGORY_ICON["object-oriented programming"];
  if (key.includes("module") || key.includes("package"))
    return CATEGORY_ICON["modules & packages"];
  if (key.includes("file") || key.includes("i/o") || key.includes("io"))
    return CATEGORY_ICON["file i/o"];
  if (key.includes("exception") || key.includes("error"))
    return CATEGORY_ICON["exceptions"];
  if (key.includes("comprehension")) return CATEGORY_ICON["comprehensions"];
  if (key.includes("iter") || key.includes("generator"))
    return CATEGORY_ICON["iterators & generators"];
  return "📚";
}
function topicGradient(name: string): string {
  const key = (name || "").toLowerCase().trim();
  if (key.includes("fundament") || key.includes("basic"))
    return "bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-500 text-white";
  if (key.includes("control"))
    return "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white";
  if (key.includes("function"))
    return "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white";
  if (key.includes("data"))
    return "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 text-white";
  if (key.includes("object") || key === "oop")
    return "bg-gradient-to-br from-fuchsia-600 via-pink-500 to-rose-500 text-white";
  if (key.includes("module") || key.includes("package"))
    return "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white";
  if (key.includes("file") || key.includes("i/o") || key.includes("io"))
    return "bg-gradient-to-br from-slate-700 via-slate-600 to-blue-600 text-white";
  if (key.includes("exception") || key.includes("error"))
    return "bg-gradient-to-br from-red-600 via-rose-600 to-orange-600 text-white";
  if (key.includes("comprehension"))
    return "bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500 text-white";
  if (key.includes("iter") || key.includes("generator"))
    return "bg-gradient-to-br from-cyan-600 via-teal-500 to-emerald-500 text-white";
  return "bg-gradient-to-br from-sky-600 to-indigo-600 text-white";
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
  oop: "Build robust software with classes, objects, inheritance, and special (dunder) methods.",
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
};

function describeCategory(name: string): string {
  const key = (name || "").toLowerCase().trim();
  // fuzzy mapping
  if (key.includes("fundament") || key.includes("basic"))
    return CATEGORY_DESCRIPTIONS["python fundamentals"];
  if (key.includes("control")) return CATEGORY_DESCRIPTIONS["control flow"];
  if (key.includes("function")) return CATEGORY_DESCRIPTIONS["functions"];
  if (key.includes("data")) return CATEGORY_DESCRIPTIONS["data structures"];
  if (key.includes("object") || key === "oop")
    return CATEGORY_DESCRIPTIONS["object-oriented programming"];
  if (key.includes("module") || key.includes("package"))
    return CATEGORY_DESCRIPTIONS["modules & packages"];
  if (key.includes("file") || key.includes("i/o") || key.includes("io"))
    return CATEGORY_DESCRIPTIONS["file i/o"];
  if (key.includes("exception") || key.includes("error"))
    return CATEGORY_DESCRIPTIONS["exceptions"];
  if (key.includes("comprehension"))
    return CATEGORY_DESCRIPTIONS["comprehensions"];
  if (key.includes("iter") || key.includes("generator"))
    return CATEGORY_DESCRIPTIONS["iterators & generators"];
  return (
    CATEGORY_DESCRIPTIONS[key] ||
    `Explore ${name} with structured lessons from fundamentals to advanced practice.`
  );
}

// Auth-aware card for "Welcome Back" vs "Join PyLearn" (SSR-deterministic)
function AuthAwareCard({
  initialAuth,
}: {
  initialAuth?: HomeClientProps["initialAuth"];
}) {
  const { data: session, status } = useSession();

  // Prefer SSR-provided auth status to avoid loading flashes for crawlers
  const effectiveStatus = initialAuth ? initialAuth.status : status;

  if (effectiveStatus === "authenticated") {
    const fallbackUser: any =
      initialAuth && initialAuth.status === "authenticated"
        ? initialAuth.user ?? {}
        : {};
    const user: any =
      status === "authenticated" && session?.user ? session.user : fallbackUser;
    const displayName =
      (user?.username as string) ||
      (session?.user as any)?.name ||
      (user?.name as string) ||
      (user?.email ? (user.email as string).split("@")[0] : "Friend");

    const experience = (user as any)?.experience ?? 0;
    const xp = getXPProgress(experience);
    const level = xp.level;
    const diamonds = (user as any)?.currentDiamonds ?? 0;
    const streak = (user as any)?.loginStreak ?? 1;

    // Progress using scalable XP curve
    const progress = xp.progressPercent;
    const xpToNext = xp.xpToNextLevel;

    return (
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
        <CardHeader className="pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold">
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-work-sans)] bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent text-xl md:text-2xl lg:text-3xl font-bold">
                Welcome back, {displayName} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Learn Python with interactive lessons, quizzes, and games
              </p>
              <CardDescription className="md:text-base lg:text-lg font-medium bg-gradient-to-r from-secondary/80 via-primary/60 to-accent/80 bg-clip-text text-transparent">
                {streak >= 2
                  ? `🔥 ${streak}-day streak — keep it up!`
                  : "🎯 Ready to level up your Python skills today?"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link href="/profile">
              <Button size="sm">Profile</Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
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
                  <span className="text-muted-foreground">
                    {xpToNext} XP to next
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <Badge
                variant="outline"
                className="whitespace-nowrap text-xs md:text-sm py-1 px-2"
              >
                💎 {diamonds}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Guest view: polished, centered CTA card (also used during client loading if SSR says unauthenticated)
  return (
    <Card className="overflow-hidden border border-border bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
      <CardHeader className="pb-2 text-center">
        <h1 className="font-[family-name:var(--font-work-sans)] bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
          🚀 Master Python Through Fun & Games
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Learn Python with interactive lessons, quizzes, and games
        </p>
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
              <svg
                className="w-4 h-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 8v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 11h-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Create account
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button
              variant="outline"
              className="w-full md:text-base lg:text-lg"
            >
              {/* Icon on button */}
              <svg
                className="w-4 h-4 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 17l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Log in
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomeClient(props: HomeClientProps) {
  const {
    dailyChallenge,
    nextLesson,
    modules,
    tip,
    randomActivity,
    leaderboardCurrentUser,
    initialAuth,
  } = props;

  const [rankUser, setRankUser] = useState<typeof leaderboardCurrentUser>(
    leaderboardCurrentUser
  );
  const [dailyQuiz, setDailyQuiz] = useState<{
    quiz: {
      id: string;
      title: string;
      description?: string | null;
      rewardXP: number;
      rewardDiamonds: number;
      difficulty: number;
      expiresInSec: number;
    };
    progress: { attempted: boolean; score?: number; completed?: boolean };
  } | null>(null);

  // Client-side fetch to ensure we have cookies and can resolve current user rank
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/leaderboard?period=weekly", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.currentUser) {
          setRankUser(data.currentUser);
        }
      } catch {}
    };
    // Always fetch to ensure client has fresh auth-bound data
    run();
    return () => {
      cancelled = true;
    };
  }, [leaderboardCurrentUser]);

  // Fetch Daily Quiz (dynamic)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/challenges/daily", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!cancelled && data?.success && data?.quiz) {
          setDailyQuiz({
            quiz: data.quiz,
            progress: data.progress || { attempted: false },
          });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topTopics = useMemo(() => {
    if (!modules || modules.length === 0) return [];
    const pf = (modules ?? []).find(
      (m) =>
        (m.category || "").toLowerCase() === "python fundamentals".toLowerCase()
    );
    return pf ? [pf] : [modules[0]];
  }, [modules]);

  const nextLessonHref = nextLesson
    ? `/learn/${encodeURIComponent(nextLesson.slug)}`
    : "/learn";
  const nextLessonDifficulty = difficultyLabel(nextLesson?.difficulty);
  const nextLessonMinutes = Math.max(
    1,
    Number(nextLesson?.estimatedMinutes ?? 5)
  );

  const dailyHref =
    dailyQuiz?.quiz && (dailyQuiz.quiz as any).gamePath
      ? (dailyQuiz.quiz as any).gamePath
      : "/challenges";
  const dailyXp =
    dailyQuiz?.quiz?.rewardXP ?? dailyChallenge?.experienceReward ?? 25;
  const dailyDiamonds =
    dailyQuiz?.quiz?.rewardDiamonds ?? dailyChallenge?.diamondReward ?? 10;

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
        };

  // Stable featured games pick to avoid hydration mismatch
  const featuredGames = useMemo(
    () => [
      {
        key: "code-match",
        href: "/games/code-match",
        title: "Code Match",
        description:
          "Match Python code to its output. 50 questions, sudden‑death, 30s per round.",
        icon: "🧩",
        badges: [
          { label: "50 Q", variant: "secondary" as const },
          { label: "Sudden‑Death", variant: "outline" as const },
          { label: "30s/round", variant: "outline" as const },
        ],
      },
      {
        key: "data-types",
        href: "/games/data-types",
        title: "Data Types",
        description: "Identify correct Python data types under time pressure.",
        icon: "🔢",
        badges: [
          { label: "Timed", variant: "secondary" as const },
          { label: "Beginner", variant: "outline" as const },
        ],
      },
      {
        key: "function-calls",
        href: "/games/function-calls",
        title: "Function Calls",
        description: "Predict outputs of Python function calls — 5 rounds.",
        icon: "🧮",
        badges: [
          { label: "+XP", variant: "secondary" as const },
          { label: "5 rounds", variant: "outline" as const },
        ],
      },
      {
        key: "loop-runner",
        href: "/games/loop-runner",
        title: "Loop Runner",
        description: "Trace loops and find the final values quickly.",
        icon: "🔁",
        badges: [
          { label: "Loops", variant: "secondary" as const },
          { label: "Fast", variant: "outline" as const },
        ],
      },
      {
        key: "memory-match",
        href: "/games/memory-match",
        title: "Memory Match",
        description: "Flip and match Python terms to strengthen recall.",
        icon: "🧠",
        badges: [
          { label: "Recall", variant: "secondary" as const },
          { label: "Casual", variant: "outline" as const },
        ],
      },
      {
        key: "syntax-puzzle",
        href: "/games/syntax-puzzle",
        title: "Syntax Puzzle",
        description: "Fix broken snippets to valid Python syntax.",
        icon: "🧩",
        badges: [
          { label: "Fix Code", variant: "secondary" as const },
          { label: "Syntax", variant: "outline" as const },
        ],
      },
      {
        key: "variable-naming",
        href: "/games/variable-naming",
        title: "Variable Naming",
        description: "Choose the best variable names for clarity.",
        icon: "🏷️",
        badges: [
          { label: "Best Practices", variant: "secondary" as const },
          { label: "Beginner", variant: "outline" as const },
        ],
      },
    ],
    []
  );
  const featuredPickRef = useRef<(typeof featuredGames)[number] | null>(null);
  if (!featuredPickRef.current && featuredGames.length > 0) {
    featuredPickRef.current =
      featuredGames[Math.floor(Math.random() * featuredGames.length)];
  }
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Mobile Brand Header */}
      <div className="md:hidden sticky top-0 z-30 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <img src="/python.svg" alt="PyLearn logo" className="h-6 w-6" />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-primary font-[family-name:var(--font-work-sans)]">
              PyLearn
            </span>
            <span className="text-xs text-muted-foreground">
              Master Python through fun and games
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-4 py-8 space-y-8 md:space-y-10">
        {/* Auth-aware Welcome Section */}
        <AuthAwareCard initialAuth={initialAuth} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenge Banner (driven by API / DB) */}
            <Card className="relative overflow-hidden bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-accent/5 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
              <CardContent className="relative p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-background/90 border-2 border-secondary/30 hover:border-secondary/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm">
                      <span className="text-lg md:text-xl lg:text-2xl group-hover:animate-pulse">
                        🎯
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">
                        {dailyQuiz?.quiz?.title || "Daily Challenge"}
                      </p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        {dailyQuiz?.quiz?.description ||
                          "Complete today’s quick challenge to earn rewards"}
                      </p>
                      <p className="text-xs md:text-sm lg:text-base mt-0.5">
                        +{dailyXp} XP • +{dailyDiamonds} 💎{" "}
                        {dailyQuiz
                          ? `• ${
                              dailyQuiz.quiz.expiresInSec <= 0
                                ? "Expired"
                                : "Ends today"
                            }`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Link href={dailyHref}>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="md:size-default lg:px-6"
                      disabled={Boolean(
                        dailyQuiz && dailyQuiz.quiz.expiresInSec <= 0
                      )}
                    >
                      {dailyQuiz?.progress?.completed ? (
                        <>
                          <Trophy className="w-4 h-4 mr-2" />
                          Completed
                        </>
                      ) : dailyQuiz?.progress?.attempted ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play Game
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Your Weekly Rank (under Daily Challenge) */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-200/30 hover:from-amber-500/20 hover:via-yellow-500/20 hover:to-orange-500/20 hover:shadow-lg transition-all duration-300 group">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-600/20 via-yellow-600/15 to-orange-600/20 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
              <CardContent className="relative p-4 md:p-5 lg:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg bg-white/90 border-2 border-amber-200/50 hover:border-amber-300/70 flex items-center justify-center shadow-sm transition-all duration-300 backdrop-blur-sm">
                      <Trophy
                        className="h-5 w-5 md:h-6 md:w-6 text-amber-600 hover:scale-110 transition-transform duration-200"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg text-gray-900">
                        Your Weekly Rank
                      </p>
                      {rankUser ? (
                        <p className="text-xs md:text-sm lg:text-base text-gray-600">
                          #{rankUser.rank} • {rankUser.xp} XP this week
                        </p>
                      ) : (
                        <p className="text-xs md:text-sm lg:text-base text-gray-600">
                          Complete activities to enter the weekly leaderboard
                        </p>
                      )}
                    </div>
                  </div>
                  <Link href="/leaderboard">
                    <Button
                      size="sm"
                      className="md:size-default lg:px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs md:text-sm lg:text-base"
                  >
                    View All Activities
                  </Button>
                </Link>
              </div>
              {(() => {
                const act = randomActivity;
                const actHref = act
                  ? `/activities/${encodeURIComponent(act.slug)}`
                  : "/activities";
                const actMinutes = Math.max(
                  1,
                  Number(act?.estimatedMinutes ?? 5)
                );
                const actXP = act?.experienceReward ?? 25;
                const actDiamonds = act?.diamondReward ?? 10;
                const actType = (act?.activityType || "Activity").replace(
                  /_/g,
                  " "
                );
                return (
                  <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 border-indigo-200/30 hover:from-indigo-500/20 hover:via-blue-500/20 hover:to-cyan-500/20 hover:shadow-lg transition-all duration-300 group">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-blue-600/15 to-cyan-600/20 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                    <CardContent className="relative p-0">
                      <div className="p-4 md:p-5 lg:p-6">
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-white/90 border-2 border-indigo-200/50 hover:border-indigo-300/70 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300 shadow-sm backdrop-blur-sm">
                            <span className="text-xl md:text-2xl lg:text-3xl group-hover:animate-bounce">
                              🎯
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium md:text-lg lg:text-xl truncate text-gray-900">
                              {act ? act.title : "Explore Learning Activities"}
                            </h3>
                            <p className="text-sm md:text-base lg:text-lg text-gray-600">
                              {act
                                ? act.description || actType
                                : "Jump into a random interactive activity"}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge
                                variant="secondary"
                                className="bg-white/80 text-gray-700 border-indigo-200/50 text-xs"
                              >
                                {actType}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-white/60 text-gray-700 border-indigo-200/50 text-xs"
                              >
                                {actMinutes} min
                              </Badge>
                              <span className="text-xs text-gray-600">
                                +{actXP} XP, +{actDiamonds} 💎
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end border-t border-indigo-200/30 bg-white/20 backdrop-blur-sm px-4 md:px-6 py-3">
                        <Link href={actHref} className="w-full sm:w-auto">
                          <Button className="w-full sm:w-auto md:text-base lg:text-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0">
                            <Zap className="w-4 h-4 mr-2" />
                            Start Activity
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>

            {/* Python Tips link/banner */}
            <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/20 transition-all hover:shadow-xl duration-300 group">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-inner">
                      <span className="text-lg md:text-xl lg:text-2xl group-hover:animate-pulse">
                        💡
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">
                        Python Tips
                      </p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                        Quick, practical tips to improve your Python daily
                      </p>
                    </div>
                  </div>
                  <Link href="/tips">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="md:size-default lg:px-6"
                    >
                      Browse Tips
                      <span className="ml-1" aria-hidden="true">
                        →
                      </span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-2xl group-hover:bg-primary/30 transition-colors duration-500" />
              <div className="pointer-events-none absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-secondary/15 blur-xl group-hover:bg-secondary/25 transition-colors duration-700" />
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
                  className="h-20 md:h-24 lg:h-28 flex-col gap-2 font-[family-name:var(--font-work-sans)] w-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">📚</span>
                  <span className="md:text-base lg:text-lg">Learn</span>
                </Button>
              </Link>
              <Link href="/quiz">
                <Button
                  size="lg"
                  className="h-20 md:h-24 lg:h-28 flex-col gap-2 font-[family-name:var(--font-work-sans)] w-full bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                    const pct =
                      m.total > 0
                        ? Math.round((m.completed / m.total) * 100)
                        : 0;
                    const exploreHref = `/learn?category=${encodeURIComponent(
                      m.category
                    )}`;
                    const desc = describeCategory(m.category);
                    return (
                      <Card
                        key={m.category}
                        className="group overflow-hidden rounded-xl border border-border/60 hover:border-primary/30 transition-all hover:shadow-lg"
                      >
                        <CardContent className="p-0">
                          <div className="relative p-4 md:p-6">
                            <div
                              className={`pointer-events-none absolute inset-0 ${topicGradient(
                                m.category
                              )} opacity-5 group-hover:opacity-10 transition-opacity`}
                            />
                            <div className="relative flex items-start gap-4 min-w-0">
                              <div className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-xl flex items-center justify-center shrink-0 bg-background/90 border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300 shadow-sm">
                                <span className="text-2xl md:text-3xl lg:text-4xl">
                                  {topicIcon(m.category)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold md:text-lg lg:text-xl truncate">
                                  {m.category}
                                </h3>
                                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                                  {m.completed}/{m.total} lessons • {pct}%
                                  complete
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-2 break-words max-w-[36ch]">
                                  {desc}
                                </p>
                                <div className="mt-3 flex items-center gap-3">
                                  <Progress value={pct} className="h-2 w-40" />
                                  <Badge className="bg-primary/10 text-primary border-primary/20">
                                    {pct}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-card/40 px-4 md:px-6 py-3">
                            <Link
                              href={exploreHref}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full sm:w-auto md:text-base"
                              >
                                Explore
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="opacity-75">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        No topics found yet.
                      </p>
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
                  <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-200/30 hover:from-violet-500/20 hover:via-purple-500/20 hover:to-fuchsia-500/20 hover:shadow-lg transition-all duration-300 group">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/15 to-fuchsia-600/20 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                    <CardContent className="relative p-0">
                      <div className="p-4 md:p-6 flex items-center gap-4">
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center bg-white/90 border-2 border-violet-200/50 hover:border-violet-300/70 shadow-sm transition-all duration-300 backdrop-blur-sm">
                          <span className="text-2xl md:text-3xl">
                            {featuredPickRef.current.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium md:text-lg lg:text-xl truncate text-gray-900">
                            {featuredPickRef.current.title}
                          </h3>
                          <p className="text-sm md:text-base lg:text-lg text-gray-600">
                            {featuredPickRef.current.description}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {featuredPickRef.current.badges.map((b, i) => (
                              <Badge
                                key={i}
                                variant={b.variant}
                                className="bg-white/80 text-gray-700 border-violet-200/50"
                              >
                                {b.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end border-t border-violet-200/30 bg-white/20 backdrop-blur-sm px-4 md:px-6 py-3">
                        <Link
                          href={featuredPickRef.current.href}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="sm"
                            className="w-full sm:w-auto md:text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* More Games (CTA) */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-emerald-200/30 hover:from-emerald-500/20 hover:via-teal-500/20 hover:to-cyan-500/20 hover:shadow-lg transition-all duration-300 group">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-teal-600/15 to-cyan-600/20 opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                  <CardContent className="relative p-0">
                    <div className="p-4 md:p-6 flex items-center gap-4">
                      <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center bg-white/90 border-2 border-emerald-200/50 hover:border-emerald-300/70 shadow-sm transition-all duration-300 backdrop-blur-sm">
                        <span className="text-2xl md:text-3xl">🎮</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium md:text-lg lg:text-xl truncate text-gray-900">
                          More Games
                        </h3>
                        <p className="text-sm md:text-base lg:text-lg text-gray-600">
                          Visit the Games page to play fun, interactive
                          challenges.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end border-t border-emerald-200/30 bg-white/20 backdrop-blur-sm px-4 md:px-6 py-3">
                      <Link href="/games" className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="w-full sm:w-auto md:text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
                        >
                          <Gamepad2 className="w-4 h-4 mr-2" />
                          Go to Games
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
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
  );
}

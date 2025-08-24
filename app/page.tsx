export const dynamic = "force-dynamic"
export const revalidate = 0

import type { Metadata } from "next"
// no server headers/cookies needed; leaderboard loads client-side
import Script from "next/script"
import HomeClient from "@/components/home/HomeClient"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

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


export const metadata: Metadata = {
  title: "PyLearn – Learn Python by Playing | Free Interactive Lessons, Quizzes, Games",
  description:
    "Master Python with interactive lessons, quizzes, and games. Personalized daily challenges, progress tracking, and leaderboards. Perfect for beginners and intermediate learners.",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  keywords: [
    "learn python",
    "python course",
    "python quiz",
    "python games",
    "interactive python",
    "python basics",
    "beginner python",
    "intermediate python",
    "python challenges",
    "practice python",
    "pylearn",
  ],
  openGraph: {
    title: "PyLearn – Learn Python by Playing",
    description:
      "Interactive Python learning with lessons, quizzes, and games. Track progress, earn XP, climb leaderboards.",
    type: "website",
    url: "/",
    siteName: "PyLearn",
    locale: "en_US",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "PyLearn – Learn Python by Playing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PyLearn – Learn Python by Playing",
    description:
      "Interactive Python learning with lessons, quizzes, and games. Track progress, earn XP, climb leaderboards.",
    images: ["/icon.png"],
  },
}


async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export default async function Page() {
  // Seed auth on SSR to avoid client "loading" flashes for bots
  const session = await getServerSession(authOptions)
  const initialAuth = session?.user
    ? {
        status: "authenticated" as const,
        user: {
          name: (session.user as any)?.name ?? undefined,
          email: session.user.email ?? undefined,
          username: (session.user as any)?.username ?? undefined,
          experience: (session.user as any)?.experience ?? 0,
          currentDiamonds: (session.user as any)?.currentDiamonds ?? 0,
          loginStreak: (session.user as any)?.loginStreak ?? 1,
        },
      }
    : { status: "unauthenticated" as const }
  // 1) Daily and metadata
  const dailyPromise = getJson<{ success: boolean; items: ActivityItem[]; total?: number }>("/api/learn/activities?page=1&pageSize=1")
  const nextPromise = getJson<{ success: boolean; next: ActivityItem | null }>("/api/learn/activities?status=next")
  const modulesPromise = getJson<{ success: boolean; items: ModulesSummaryItem[] }>("/api/learn/activities?group=modules")
  const tipPromise = getJson<{ tip?: any }>("/api/python-tips/random")
  const [dailyRes, nextRes, modulesRes, tipRes] = await Promise.all([
    dailyPromise,
    nextPromise,
    modulesPromise,
    tipPromise,
  ])

  const dailyChallenge = dailyRes?.items?.[0] ?? null
  const nextLesson = nextRes?.next ?? null
  let modules = modulesRes?.items ?? []

  // Fallback: if API returned no topics, aggregate categories directly from DB
  if (!modules || modules.length === 0) {
    try {
      // Use Prisma groupBy to get counts per category
      const grouped = await prisma.learningActivity.groupBy({
        where: { isActive: true, activityType: "lesson" },
        by: ["category"],
        _count: { category: true },
      })
      modules = grouped
        .filter((g) => !!g.category)
        .map((g) => ({
          category: g.category as string,
          total: g._count.category || 0,
          completed: 0, // optional: can compute with user session later
          locked: 0,
        }))
        .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    } catch (_e) {
      modules = []
    }
  }

  const tip = tipRes?.tip ?? null
  const leaderboardCurrentUser = null

  // 2) Fetch a random non-lesson activity directly from DB (Activities page data model)
  let randomActivity: ActivityItem | null = null
  try {
    const where = {
      isActive: true,
      NOT: { activityType: "lesson" as const },
    }
    const total = await prisma.learningActivity.count({ where })
    if (total > 0) {
      const skip = Math.floor(Math.random() * total)
      const rows = await prisma.learningActivity.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          activityType: true,
          category: true,
          estimatedMinutes: true,
          diamondReward: true,
          experienceReward: true,
          isLocked: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip,
        take: 1,
      })
      const r = rows[0]
      if (r) {
        randomActivity = {
          id: r.id,
          slug: r.slug ?? r.id,
          title: r.title,
          description: r.description ?? "",
          activityType: r.activityType ?? "activity",
          category: r.category ?? "General",
          estimatedMinutes: Math.max(1, Number(r.estimatedMinutes ?? 5)),
          diamondReward: Number(r.diamondReward ?? 0),
          experienceReward: Number(r.experienceReward ?? 0),
          isLocked: !!r.isLocked,
          difficulty: 1,
          completed: false,
        }
      }
    }
  } catch {
    randomActivity = null
  }

  return (
    <>
      <HomeClient
        dailyChallenge={dailyChallenge}
        nextLesson={nextLesson}
        modules={modules}
        tip={tip}
        randomActivity={randomActivity}
        leaderboardCurrentUser={leaderboardCurrentUser}
        initialAuth={initialAuth}
      />
      <Script id="ld-home-website" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PyLearn",
          description:
            "Master Python with interactive lessons, quizzes, and games. Personalized daily challenges and leaderboards.",
          url: "/",
          inLanguage: "en",
          publisher: { "@type": "Organization", name: "PyLearn" },
          potentialAction: {
            "@type": "SearchAction",
            target: "/search?q={query}",
            "query-input": "required name=query",
          },
        })}
      </Script>
      <Script id="ld-home-org" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PyLearn",
          url: "/",
          logo: "/icon.png",
          sameAs: [
            "https://twitter.com/pylearnapp",
            "https://facebook.com/pylearnapp",
            "https://github.com/pylearnapp"
          ]
        })}
      </Script>
      <Script id="ld-home-course" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Learn Python Programming",
          description: "Master Python with interactive lessons, quizzes, and games. Perfect for beginners and intermediate learners.",
          provider: {
            "@type": "Organization",
            name: "PyLearn",
            sameAs: "/"
          },
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            educationalLevel: "Beginner to Intermediate",
            courseWorkload: "Self-paced (~3–5 hours per week)"
          },
          learningResourceType: "Interactive Resource",
          teaches: "Python programming fundamentals, data structures, functions, control flow",
          about: {
            "@type": "Thing",
            name: "Python Programming"
          },
          audience: {
            "@type": "Audience",
            audienceType: "Beginner and Intermediate Programmers"
          },
          isAccessibleForFree: true
        })}
      </Script>
    </>
  )
}

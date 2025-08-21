import { MobilePageHeader } from "@/components/mobile-page-header"
import LearnGrid, { type LearnActivity } from "@/components/learn/learn-grid"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { headers } from "next/headers"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }
): Promise<Metadata> {
  const params = await searchParams

  const rawCategory = params?.category
  const categoryParam = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory

  // Validate category against DB categories (case-insensitive)
  let category: string | undefined
  if (categoryParam) {
    const rows = await prisma.learningActivity.findMany({
      where: { isActive: true, activityType: "lesson" },
      select: { category: true },
      distinct: ["category"],
    })
    const categories = Array.from(
      new Set(rows.map((r) => r.category).filter((c): c is string => !!c))
    )
    const match = categories.find((c) => c.toLowerCase() === categoryParam.toLowerCase())
    if (match) category = match
  }

  // Build absolute canonical URL
  const h = await headers()
  const host = h.get("host") || "localhost:3000"
  const proto = h.get("x-forwarded-proto") || "https"
  const baseUrl = `${proto}://${host}`
  const url = new URL(`${baseUrl}/learn`)
  if (category) url.searchParams.set("category", category)

  const title = category
    ? `${category} — Learn Python`
    : "Learn Python — Lessons, Exercises, and Mini Projects"

  const description = category
    ? `Explore ${category} lessons in our interactive Python course. Browse curated topics with examples, practice, and quizzes.`
    : "Browse interactive Python lessons by category: Python Fundamentals, Control Flow, Functions, Data Structures, Mini Projects, and more. Each lesson includes examples, practice, and a quiz."

  const keywords = [
    "Python",
    "Learn Python",
    "Python Tutorial",
    "Python Course",
    "Programming",
    "Coding",
    "Lessons",
    "Exercises",
    "Quiz",
    "Beginner",
    "Intermediate",
  ]
  if (category) keywords.push(category)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url.toString(),
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: url.toString(),
      siteName: "Learn Python",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

async function fetchInitialData(
  userId?: string,
  initialTake: number = 10,
  preferredCategory?: string
): Promise<{
  categories: string[]
  initialCategory: string
  items: LearnActivity[]
  total: number
}> {
  // Build category list (only active lessons), put "Python Fundamentals" first if present
  const categoryRows = await prisma.learningActivity.findMany({
    where: { isActive: true, activityType: "lesson" },
    select: { category: true },
    distinct: ["category"],
  })

  let categories = Array.from(
    new Set(categoryRows.map((r) => r.category).filter((c): c is string => !!c))
  )

  const pfIndex = categories.findIndex((c) => c.toLowerCase() === "python fundamentals")
  if (pfIndex > 0) {
    const [pf] = categories.splice(pfIndex, 1)
    categories.unshift(pf)
  }

  // Default initial category (but may be overridden by preferredCategory)
  let initialCategory = categories[0] ?? "Python Fundamentals"

  // If a preferredCategory is provided via query string, honor it when present in DB
  if (preferredCategory) {
    const match = categories.find((c) => c.toLowerCase() === preferredCategory.toLowerCase())
    if (match) {
      initialCategory = match
    }
  }

  // Fetch first page server-side (desktop/tablet default = 10)
  const where: any = {
    isActive: true,
    activityType: "lesson",
    category: initialCategory,
  }

  const [total, rows] = await Promise.all([
    prisma.learningActivity.count({ where }),
    prisma.learningActivity.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { topicOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
        diamondReward: true,
        experienceReward: true,
        isLocked: true,
      },
      skip: 0,
      take: initialTake, // SSR page size (10 desktop/tablet, 5 mobile)
    }),
  ])

  // Mark completion for current user on SSR list
  let completedSet: Set<string> | undefined
  if (userId && rows.length > 0) {
    const attempts = await prisma.activityAttempt.findMany({
      where: { userId, completed: true, activityId: { in: rows.map((r) => r.id) } },
      select: { activityId: true },
    })
    completedSet = new Set(attempts.map((a) => a.activityId))
  }

  const items: LearnActivity[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug ?? r.id,
    title: r.title,
    description: r.description,
    category: r.category ?? "General",
    difficulty: r.difficulty ?? 1,
    estimatedMinutes: Math.max(1, r.estimatedMinutes ?? 5),
    diamondReward: r.diamondReward ?? 10,
    experienceReward: r.experienceReward ?? 25,
    isLocked: !!r.isLocked,
    completed: completedSet ? completedSet.has(r.id) : false,
  }))

  return { categories, initialCategory, items, total }
}

export default async function LearnPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const h = await headers();
  const ua = h.get("user-agent") || ""
  const isMobileUA =
    /Mobile|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua)

  const { category } = (searchParams ? await searchParams : {}) as Record<string, string | string[] | undefined>
  const preferredCategory = Array.isArray(category) ? category[0] : category

  const { categories, initialCategory, items, total } = await fetchInitialData(
    userId,
    isMobileUA ? 5 : 10,
    preferredCategory
  )

  // SEO-aware UI headings
  const headingTitle = preferredCategory ? `${initialCategory} — Learn` : "Learn"
  const headingSubtitle = preferredCategory
    ? `Explore ${initialCategory} lessons`
    : "Browse Python lessons"

  // JSON-LD structured data
  const host2 = h.get("host") || "localhost:3000"
  const proto2 = h.get("x-forwarded-proto") || "https"
  const baseUrl2 = `${proto2}://${host2}`

  const itemListElements = items.map((it, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: it.title,
    url: `${baseUrl2}/learn/${it.slug}`,
  }))

  const collectionLD = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: preferredCategory
      ? `${initialCategory} — Learn Python`
      : "Learn Python — Lessons, Exercises, and Mini Projects",
    description: preferredCategory
      ? `Explore ${initialCategory} lessons in our interactive Python course. Browse curated topics with examples, practice, and quizzes.`
      : "Browse interactive Python lessons by category: Python Fundamentals, Control Flow, Functions, Data Structures, Mini Projects, and more. Each lesson includes examples, practice, and a quiz.",
    url: preferredCategory
      ? `${baseUrl2}/learn?category=${encodeURIComponent(initialCategory)}`
      : `${baseUrl2}/learn`,
    hasPart: {
      "@type": "ItemList",
      itemListElement: itemListElements,
    },
  }

  const breadcrumbsLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Learn",
        item: `${baseUrl2}/learn`,
      },
      ...(preferredCategory
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: initialCategory,
              item: `${baseUrl2}/learn?category=${encodeURIComponent(initialCategory)}`,
            },
          ]
        : []),
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLD) }}
      />
      <MobilePageHeader title={headingTitle} subtitle={headingSubtitle} />
      <LearnGrid
        categories={categories}
        initialCategory={initialCategory}
        initialItems={items}
        total={total}
        initialPage={1}
        pageSizeDesktop={10}
        pageSizeMobile={5}
        defaultCategory="Python Fundamentals"
      />
    </div>
  )
}

/**
 * Dynamic Tips page from DB with strong visuals, search, filters, and pagination.
 * Uses Prisma via "@/lib/prisma" (same as the random tip API route).
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Code, Flame } from "lucide-react"
import Link from "next/link"
import PythonTipWidget from "@/components/python-tip-widget"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Metadata } from "next"
import { MobilePageHeader } from "@/components/mobile-page-header"

// Ensure dynamic SSR with Prisma
export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

type SearchParams = {
  q?: string
  category?: string
  difficulty?: string
  page?: string
  tag?: string
}

type TipsPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>
}

const PAGE_SIZE = 12

// SEO helpers and dynamic metadata
const SITE_NAME = "PyLearn"
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.app"

function toTitleCase(input: string) {
  return input
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildCanonicalFromParams(sp: SearchParams = {}): string {
  const url = new URL("/tips", BASE_URL)
  const page = Math.max(1, Number(sp.page || "1"))
  const isSearch = !!(sp.q && sp.q.trim())

  if (!isSearch) {
    if (sp.difficulty && sp.difficulty !== "all") url.searchParams.set("difficulty", sp.difficulty)
    if (sp.tag) url.searchParams.set("tag", sp.tag)
    if (page > 1) url.searchParams.set("page", String(page))
  }

  return url.toString()
}

function buildSeoTitle(sp: SearchParams = {}): string {
  const parts: string[] = ["Python Tips & Tricks"]
  if (sp.difficulty && sp.difficulty !== "all") parts.push(`• ${toTitleCase(sp.difficulty)}`)
  if (sp.q && sp.q.trim()) parts.push(`• Search "${sp.q.trim()}"`)
  const page = Math.max(1, Number(sp.page || "1"))
  if (page > 1) parts.push(`• Page ${page}`)
  parts.push("| PyLearn")
  return parts.join(" ")
}

function buildDescription(sp: SearchParams = {}): string {
  const segs: string[] = []
  if (sp.difficulty && sp.difficulty !== "all") segs.push(`for ${toTitleCase(sp.difficulty)} learners`)
  if (sp.q && sp.q.trim()) segs.push(`matching "${sp.q.trim()}"`)
  const suffix = segs.length ? " " + segs.join(" ") : ""
  return `Discover daily Python tips${suffix}. Search concise, practical tricks with code examples to level up your Python skills.`
}

export async function generateMetadata({ searchParams }: { searchParams?: SearchParams | Promise<SearchParams> }): Promise<Metadata> {
  const sp: SearchParams = (await Promise.resolve(searchParams)) || {}
  const title = buildSeoTitle(sp)
  const description = buildDescription(sp)
  const canonical = buildCanonicalFromParams(sp)
  const isSearch = !!(sp.q && sp.q.trim())

  const keywords = [
    "python tips",
    "python tricks",
    "python best practices",
    "learn python",
    "python examples",
    ...(sp.difficulty && sp.difficulty !== "all" ? [`python ${sp.difficulty} tips`] : []),
    ...(sp.tag ? [`python ${sp.tag} tips`] : []),
  ]

  return {
    title,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: { canonical },
    keywords,
    robots: {
      index: !isSearch,
      follow: true,
      googleBot: {
        index: !isSearch,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: ["/icon.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icon.png"],
    },
  }
}

function toTitleCaseDifficulty(d: string | null | undefined): "Beginner" | "Intermediate" | "Advanced" {
  const base = (d || "beginner").toLowerCase()
  if (base === "intermediate") return "Intermediate"
  if (base === "advanced") return "Advanced"
  return "Beginner"
}

function buildWhere(params: SearchParams = {}) {
  const difficulty = params.difficulty ? params.difficulty.toLowerCase() : undefined
  const tag = params.tag || undefined
  const q = params.q || ""

  const where: any = {
    isActive: true,
    OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }],
  }

  if (difficulty && ["beginner", "intermediate", "advanced"].includes(difficulty)) {
    where.difficulty = difficulty
  }
  if (tag) {
    where.tags = { contains: tag, mode: "insensitive" }
  }
  if (q && q.trim().length > 0) {
    where.OR = [
      ...(where.OR || []),
      { title: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { codeExample: { contains: q, mode: "insensitive" } },
    ]
  }

  return where
}

export default async function PythonTipsPage({ searchParams }: TipsPageProps) {
  const sp: SearchParams = (await Promise.resolve(searchParams)) || {}
  const page = Math.max(1, Number((sp.page || "1")))
  const where = buildWhere(sp)
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  // Fetch counts only (categories filter removed)
  const totalCount = await prisma.pythonTip.count({ where })

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const skip = (page - 1) * PAGE_SIZE

  // Fetch tips with category for rendering
  const tips = await prisma.pythonTip.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
    skip,
    take: PAGE_SIZE,
  })

  // Map to PythonTipWidget shape
  let items = tips.map((t) => ({
    id: t.id,
    title: t.title,
    content: t.content || "",
    codeExample: t.codeExample || "",
    category: t.category?.name || t.category?.slug || "General",
    difficulty: toTitleCaseDifficulty(t.difficulty),
    xpReward: (t as any).xpReward ?? 10,
  }))

  // SSR: mark which of these tips the user has already completed
  if (userId && items.length > 0) {
    const tipIds = items.map((i) => i.id)
    const interactions = await prisma.userPythonTipInteraction.findMany({
      where: { userId, tipId: { in: tipIds }, hasCompleted: true },
      select: { tipId: true },
    })
    const completedSet = new Set(interactions.map((x) => x.tipId))
    items = items.map((i) => ({ ...i, isCompleted: completedSet.has(i.id) }))
  }

  // Compute remaining completions today (UTC) for the 3-per-day cap (only when logged in)
  let remainingToday: number | null = null
  if (userId) {
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
    const completedToday = await prisma.userPythonTipInteraction.count({
      where: { userId, hasCompleted: true, completedAt: { gte: start, lte: end } },
    })
    remainingToday = Math.max(0, 3 - completedToday)
  }

  const currentDifficulty = sp.difficulty || "all"
  const qValue = sp.q || ""

  // Canonical URL and JSON-LD structured data
  const canonicalUrl = buildCanonicalFromParams(sp)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Python Tips & Tricks",
    description:
      "Daily Python tips with code examples. Search and filter by difficulty.",
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: BASE_URL,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Python Tips", item: canonicalUrl },
      ],
    },
    hasPart: items.slice(0, PAGE_SIZE).map((t, idx) => ({
      "@type": "CreativeWork",
      position: idx + 1,
      name: t.title,
      about: t.category,
      text: t.content,
      inLanguage: "en",
      learningResourceType: "Python Tip",
      educationalLevel: t.difficulty,
    })),
  }

  // Helpers to build query string links
  const buildQuery = (patch: Record<string, string | number | undefined>) => {
    const url = new URLSearchParams()
    if (qValue) url.set("q", qValue)
    if (currentDifficulty) url.set("difficulty", currentDifficulty)
    const next = { q: qValue, difficulty: currentDifficulty, page, ...patch }
    // Clean undefined/empty
    Object.entries(next).forEach(([k, v]) => {
      if (v !== undefined && String(v).length > 0) url.set(k, String(v))
    })
    return `/tips?${url.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 md:p-6 lg:p-8">
      {/* Mobile Header (same component as Activities) */}
      <div className="md:hidden">
        <MobilePageHeader title="Python Tips" subtitle="Quick, practical tips to improve your Python daily" backHref="/" />
      </div>
      <div className="max-w-4xl mx-auto lg:max-w-6xl xl:max-w-7xl space-y-5 md:space-y-8">
        {/* SEO: JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Header */}
        <div className="hidden md:block text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 md:text-4xl lg:text-5xl">Python Tips & Tricks</h1>
          <p className="text-gray-600 md:text-lg">
            Daily doses of Python knowledge to level up your coding skills
          </p>
        </div>

        {/* Daily reward limit banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 md:p-5 flex items-center justify-between gap-3">
            {userId ? (
              <div className="text-sm md:text-base text-blue-900">
                <strong>{remainingToday}</strong> completions left today (max 3 tips grant XP per day)
              </div>
            ) : (
              <div className="text-sm md:text-base text-blue-900">
                Log in to earn XP from tips. You can earn rewards from up to <strong>3 tips per day</strong>.
              </div>
            )}
            <div className="hidden md:block text-blue-700 text-xs">
              UTC-based daily reset
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards (live counts) */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 md:text-base">Total Tips</p>
                  <p className="text-2xl font-bold md:text-3xl lg:text-4xl">{totalCount}</p>
                </div>
                <Flame className="h-8 w-8 opacity-80 md:h-10 md:w-10 lg:h-12 lg:w-12" />
              </div>
            </CardContent>
          </Card>


          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 md:text-base">Per Page</p>
                  <p className="text-2xl font-bold md:text-3xl lg:text-4xl">{PAGE_SIZE}</p>
                </div>
                <Code className="h-8 w-8 opacity-80 md:h-10 md:w-10 lg:h-12 lg:w-12" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters (GET form for server-side filtering) */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <form action="/tips" method="GET" className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={qValue}
                    placeholder="Search tips..."
                    className="w-full pl-10 md:pl-12 md:text-base md:h-12 px-3 py-2 rounded-md border border-gray-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <select
                  name="difficulty"
                  defaultValue={currentDifficulty}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm md:text-base md:px-4 md:py-3 bg-white"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <Button type="submit" className="md:h-12 md:px-6">Apply</Button>
            </form>
          </CardContent>
        </Card>

        {/* Tips List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {items.map((tip) => (
            <PythonTipWidget key={tip.id} tip={tip} mode="tips" />
          ))}
        </div>

        {items.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center md:p-12">
              <Code className="h-12 w-12 text-gray-400 mx-auto mb-4 md:h-16 md:w-16" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 md:text-xl">No tips found</h3>
              <p className="text-gray-600 md:text-lg">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <Link href={buildQuery({ page: Math.max(1, page - 1) })}>
              <Button variant="outline" disabled={page <= 1}>
                Prev
              </Button>
            </Link>
            <div className="px-3 py-2 text-sm md:text-base rounded bg-white border border-gray-200">
              Page {page} of {totalPages}
            </div>
            <Link href={buildQuery({ page: Math.min(totalPages, page + 1) })}>
              <Button variant="outline" disabled={page >= totalPages}>
                Next
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

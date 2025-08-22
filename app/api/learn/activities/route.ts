import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const revalidate = 0

function intParam(value: string | null, fallback: number) {
  const n = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

async function getUserId(): Promise<string | undefined> {
  const session = await getServerSession(authOptions)
  return (session?.user as any)?.id as string | undefined
}

/**
 * Maps a LearningActivity row to a public item for the API
 */
function mapActivityToItem(r: any) {
  return {
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
    tags: r.tags
      ? Array.isArray(r.tags)
        ? r.tags
        : String(r.tags)
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
      : [],
  }
}

// Smart ordering score: lower score appears earlier
function scoreActivity(r: any): number {
  const title = (r.title || "").toLowerCase()
  const content = (r.content || "").toLowerCase()
  const tags: string[] = r.tags
    ? Array.isArray(r.tags)
      ? r.tags
      : String(r.tags)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
    : []

  const text = `${title} ${content} ${tags.join(" ")}`

  let score = 0
  // Respect explicit sort/topic order as baseline
  score += (r.sortOrder ?? 0) * 10
  score += (r.topicOrder ?? 0) * 2

  // Difficulty influence (easier first)
  score += (r.difficulty ?? 1) * 3

  // Keyword-based curriculum shaping
  const weight = (cond: boolean, w: number) => {
    if (cond) score += w
  }

  // Very early topics
  weight(/\b(intro|introduction|getting started|basics|fundamentals)\b/.test(text), -40)
  weight(/\b(variable|variables|type|types|data type)\b/.test(text), -30)
  weight(/\b(operator|arithmetic|comparison|logical)\b/.test(text), -24)
  weight(/\b(string|f-string|formatting)\b/.test(text), -22)
  weight(/\b(list|tuple)\b/.test(text), -20)
  weight(/\b(dict|dictionary|set)\b/.test(text), -18)
  weight(/\b(condition|if|elif|else)\b/.test(text), -16)
  weight(/\b(loop|for|while|iteration|range)\b/.test(text), -14)
  weight(/\b(function|def|parameter|argument|return|scope)\b/.test(text), -12)
  weight(/\b(module|package|import)\b/.test(text), -10)
  weight(/\b(file|io|read|write|path)\b/.test(text), -8)
  weight(/\b(class|object|oop|inheritance|method)\b/.test(text), -6)
  weight(/\b(exception|error handling|try|except|finally)\b/.test(text), -5)

  // Tag boosters for curriculum order
  weight(tags.includes("beginner"), -20)
  weight(tags.includes("intermediate"), 5)
  weight(tags.includes("advanced"), 12)

  // Length heuristic: shorter intros first
  const lengthPenalty = Math.min(20, Math.floor((content.length || 0) / 800))
  score += lengthPenalty

  return score
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get("category") || undefined
    const page = intParam(searchParams.get("page"), 1)
    const pageSize = intParam(searchParams.get("pageSize"), 5)

    const group = searchParams.get("group") || undefined // "modules"
    const status = searchParams.get("status") || undefined // "next"

    const where: any = {
      isActive: true,
      activityType: "lesson",
    }
    if (category) where.category = category

    // Route: /api/learn/activities?group=modules
    // Returns per-category module summaries with totals and completed counts for the current user
    if (group === "modules") {
      const [userId, rows] = await Promise.all([
        getUserId(),
        prisma.learningActivity.findMany({
          where,
          select: { id: true, category: true, isLocked: true },
          orderBy: [{ sortOrder: "asc" }, { topicOrder: "asc" }, { title: "asc" }],
        }),
      ])

      const byCategory = new Map<
        string,
        { ids: string[]; total: number; locked: number }
      >()

      for (const r of rows) {
        const cat = r.category || "General"
        if (!byCategory.has(cat)) byCategory.set(cat, { ids: [], total: 0, locked: 0 })
        const entry = byCategory.get(cat)!
        entry.total += 1
        entry.ids.push(r.id)
        if (r.isLocked) entry.locked += 1
      }

      let completedIds = new Set<string>()
      if (rows.length > 0 && userId) {
        const attempts = await prisma.activityAttempt.findMany({
          where: { userId, completed: true, activityId: { in: rows.map((r) => r.id) } },
          select: { activityId: true },
        })
        completedIds = new Set(attempts.map((a) => a.activityId))
      }

      const items = Array.from(byCategory.entries()).map(([cat, data]) => {
        const completed = data.ids.reduce((acc, id) => (completedIds.has(id) ? acc + 1 : acc), 0)
        return {
          category: cat,
          total: data.total,
          completed,
          locked: data.locked,
        }
      })

      return NextResponse.json(
        { success: true, group: "modules", items },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    // Route: /api/learn/activities?status=next
    // Returns the next (first incomplete) lesson for the current user (or first lesson if not authenticated)
    if (status === "next") {
      const userId = await getUserId()
      const rows = await prisma.learningActivity.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { topicOrder: "asc" }, { title: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          estimatedMinutes: true,
          diamondReward: true,
          experienceReward: true,
          isLocked: true,
        },
      })

      let nextRow: any | null = null

      if (userId && rows.length > 0) {
        const attempts = await prisma.activityAttempt.findMany({
          where: {
            userId,
            activityId: { in: rows.map((r) => r.id) },
          },
          select: { activityId: true, completed: true },
        })

        const completedIds = new Set(
          attempts.filter((a) => a.completed).map((a) => a.activityId)
        )

        nextRow = rows.find((r) => !completedIds.has(r.id)) ?? null
      } else {
        // Not logged in: choose the first available lesson
        nextRow = rows.at(0) ?? null
      }

      const next = nextRow ? { ...mapActivityToItem(nextRow), completed: false } : null

      return NextResponse.json(
        { success: true, next },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    // Default: paged list (existing behavior)
    const skip = (page - 1) * pageSize
    // Fetch all to perform smart ordering, then paginate in-memory
    const rows = await prisma.learningActivity.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
        diamondReward: true,
        experienceReward: true,
        isLocked: true,
        tags: true,
        content: true,
        sortOrder: true,
        topicOrder: true,
      },
    })
    const total = rows.length

    // Smart order
    const ordered = rows
      .map((r) => ({ r, s: scoreActivity(r) }))
      .sort((a, b) => a.s - b.s)
      .map((x) => x.r)

    const pageRows = ordered.slice(skip, skip + pageSize)

    // Mark completion for current user if available
    let completedIds = new Set<string>()
    const userId = await getUserId()
    if (userId && pageRows.length > 0) {
      const attempts = await prisma.activityAttempt.findMany({
        where: {
          userId,
          completed: true,
          activityId: { in: pageRows.map((r) => r.id) },
        },
        select: { activityId: true },
      })
      completedIds = new Set(attempts.map((a) => a.activityId))
    }

    const items = pageRows.map((r, idx) => ({
      ...mapActivityToItem(r),
      completed: completedIds.has(r.id),
      order: skip + idx + 1,
    }))

    return NextResponse.json(
      {
        success: true,
        page,
        pageSize,
        total,
        items,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Learn activities API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  }
}
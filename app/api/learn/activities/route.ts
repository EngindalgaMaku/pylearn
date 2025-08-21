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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || undefined
    const page = intParam(searchParams.get("page"), 1)
    const pageSize = intParam(searchParams.get("pageSize"), 5)

    const where: any = {
      isActive: true,
      activityType: "lesson",
    }
    if (category) where.category = category

    const [total, rows] = await Promise.all([
      prisma.learningActivity.count({ where }),
      prisma.learningActivity.findMany({
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
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // Mark completion for current user if available
    let completedIds = new Set<string>()
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (userId && rows.length > 0) {
      const attempts = await prisma.activityAttempt.findMany({
        where: {
          userId,
          completed: true,
          activityId: { in: rows.map((r) => r.id) },
        },
        select: { activityId: true },
      })
      completedIds = new Set(attempts.map((a) => a.activityId))
    }

    const items = rows.map((r) => ({
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
      completed: completedIds.has(r.id),
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
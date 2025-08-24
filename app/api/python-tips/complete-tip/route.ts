import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

function toUTCDateOnly(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function getTodayUTCRange(today = new Date()) {
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999))
  return { start, end }
}

const DAILY_LIMIT = 3

// GET -> returns { success, remainingToday }
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } })

    const { start, end } = getTodayUTCRange()

    const completedToday = await prisma.userPythonTipInteraction.count({
      where: {
        userId,
        hasCompleted: true,
        completedAt: { gte: start, lte: end },
      },
    })

    const remainingToday = Math.max(0, DAILY_LIMIT - completedToday)

    return NextResponse.json({ success: true, remainingToday }, { headers: { "Cache-Control": "no-store" } })
  } catch (err) {
    console.error("GET tips/complete-tip error", err)
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}

// POST { tipId } -> completes a tip, grants XP if under limit, caps at 3/day
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } })

    const body = (await request.json().catch(() => null)) as { tipId?: string } | null
    const tipId = body?.tipId
    if (!tipId) return NextResponse.json({ success: false, error: "tipId is required" }, { status: 400, headers: { "Cache-Control": "no-store" } })

    const tip = await prisma.pythonTip.findFirst({ where: { isActive: true, OR: [{ id: tipId }, { slug: tipId }] }, select: { id: true, xpReward: true } })
    if (!tip) return NextResponse.json({ success: false, error: "Tip not found (id or slug)" }, { status: 404, headers: { "Cache-Control": "no-store" } })

    const { start, end } = getTodayUTCRange()

    // Check if this tip already completed ever
    const existing = await prisma.userPythonTipInteraction.findUnique({ where: { userId_tipId: { userId, tipId: tip.id } }, select: { hasCompleted: true } })
    if (existing?.hasCompleted) {
      // No rewards again
      const userSnap = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, level: true, experience: true, currentDiamonds: true, totalDiamonds: true } })
      return NextResponse.json(
        { success: true, alreadyCompletedForTip: true, dailyLimitReached: false, rewards: { experience: 0, diamonds: 0 }, user: userSnap },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    // Count completed tips today
    const completedToday = await prisma.userPythonTipInteraction.count({ where: { userId, hasCompleted: true, completedAt: { gte: start, lte: end } } })

    if (completedToday >= DAILY_LIMIT) {
      const userSnap = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, level: true, experience: true, currentDiamonds: true, totalDiamonds: true } })
      return NextResponse.json(
        { success: true, alreadyCompletedForTip: false, dailyLimitReached: true, rewards: { experience: 0, diamonds: 0 }, user: userSnap, remainingToday: 0 },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    // Under limit: mark completed and grant XP (diamonds 0)
    const xp = typeof tip.xpReward === "number" ? tip.xpReward : 10

    const result = await prisma.$transaction(async (tx) => {
      await tx.userPythonTipInteraction.upsert({
        where: { userId_tipId: { userId, tipId: tip.id } },
        update: { hasCompleted: true, completedAt: new Date(), updatedAt: new Date(), hasViewed: true },
        create: { userId, tipId: tip.id, hasCompleted: true, completedAt: new Date(), hasViewed: true, firstViewedAt: new Date() },
      })

      const userAfter = await tx.user.update({
        where: { id: userId },
        data: { experience: { increment: xp } },
        select: { id: true, level: true, experience: true, currentDiamonds: true, totalDiamonds: true },
      })

      return { userAfter }
    })

    const newCompletedToday = await prisma.userPythonTipInteraction.count({ where: { userId, hasCompleted: true, completedAt: { gte: start, lte: end } } })

    return NextResponse.json(
      {
        success: true,
        alreadyCompletedForTip: false,
        dailyLimitReached: false,
        rewards: { experience: xp, diamonds: 0 },
        user: result.userAfter,
        remainingToday: Math.max(0, DAILY_LIMIT - newCompletedToday),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (err) {
    console.error("POST tips/complete-tip error", err)
    return NextResponse.json({ success: false, error: "Failed to complete tip" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getLevelFromXP } from "@/lib/xp"

export const dynamic = "force-dynamic"
export const revalidate = 0

function getPeriodRange(period: string | null): { start?: Date; end?: Date } {
  const now = new Date()
  if (period === "weekly") {
    const d = new Date(now)
    const day = d.getDay() // 0 Sun - 6 Sat
    const diffToMonday = (day + 6) % 7 // days since Monday
    d.setHours(0, 0, 0, 0)
    const start = new Date(d)
    start.setDate(d.getDate() - diffToMonday)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    return { start, end }
  }
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start, end }
  }
  // alltime
  return {}
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const periodParam = searchParams.get("period") || "weekly"
    const { start, end } = getPeriodRange(periodParam)

    const session = await getServerSession(authOptions)
    const currentUserId = (session?.user as any)?.id as string | undefined

    // Pull completed activity attempts within period and sum XP from related activity
    const where: any = { completed: true }
    if (start || end) {
      where.completedAt = {}
      if (start) where.completedAt.gte = start
      if (end) where.completedAt.lt = end
    }

    const attempts = await prisma.activityAttempt.findMany({
      where,
      select: {
        userId: true,
        activity: { select: { experienceReward: true } },
      },
    })

    const xpByUser = new Map<string, number>()
    for (const a of attempts) {
      const xp = a.activity?.experienceReward ?? 0
      xpByUser.set(a.userId, (xpByUser.get(a.userId) || 0) + xp)
    }

    // Optionally include daily mini quiz XP
    if (start || end || periodParam === "alltime") {
      const quizWhere: any = {}
      if (start || end) {
        quizWhere.completedAt = {}
        if (start) quizWhere.completedAt.gte = start
        if (end) quizWhere.completedAt.lt = end
      }
      try {
        const dmqAttempts = await prisma.dailyMiniQuizAttempt.findMany({
          where: quizWhere,
          select: { userId: true, experienceEarned: true },
        })
        for (const q of dmqAttempts) {
          xpByUser.set(q.userId, (xpByUser.get(q.userId) || 0) + (q.experienceEarned || 0))
        }
      } catch {}
    }

    // Fetch top users' public info
    const entries = Array.from(xpByUser.entries())
      .map(([userId, xp]) => ({ userId, xp }))
      .filter((e) => e.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 100)

    const users = await prisma.user.findMany({
      where: { id: { in: entries.map((e) => e.userId) } },
      select: { id: true, username: true, level: true, experience: true, loginStreak: true, avatar: true },
    })
    const usersById = new Map(users.map((u) => [u.id, u]))

    const items = entries.map((e, idx) => {
      const u = usersById.get(e.userId)
      return {
        userId: e.userId,
        name: u?.username || "User",
        avatar: u?.avatar || "🐍",
        level: getLevelFromXP(u?.experience || 0) || u?.level || 1,
        streak: u?.loginStreak || 0,
        xp: e.xp,
        rank: idx + 1,
        you: currentUserId === e.userId,
      }
    })

    // current user rank if not in top slice
    let currentUser = null as
      | { userId: string; name: string; level: number; streak: number; xp: number; rank: number } 
      | null
    if (currentUserId) {
      const allEntriesSorted = Array.from(xpByUser.entries())
        .map(([userId, xp]) => ({ userId, xp }))
        .filter((e) => e.xp > 0)
        .sort((a, b) => b.xp - a.xp)
      const idx = allEntriesSorted.findIndex((e) => e.userId === currentUserId)
      if (idx >= 0) {
        const u = usersById.get(currentUserId) || (await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { username: true, level: true, experience: true, loginStreak: true },
        }))
        currentUser = {
          userId: currentUserId,
          name: u?.username || "You",
          level: getLevelFromXP((u as any)?.experience || 0) || u?.level || 1,
          streak: u?.loginStreak || 0,
          xp: allEntriesSorted[idx].xp,
          rank: idx + 1,
        }
      }
    }

    return NextResponse.json(
      { success: true, period: periodParam, items, currentUser },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "failed_to_compute_leaderboard" },
      { status: 500 }
    )
  }
}
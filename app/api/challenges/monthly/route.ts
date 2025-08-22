import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function startOfMonth(d = new Date()) {
  const s = new Date(d)
  s.setDate(1)
  s.setHours(0, 0, 0, 0)
  return s
}

function endOfMonth(d = new Date()) {
  const s = startOfMonth(d)
  const e = new Date(s)
  e.setMonth(e.getMonth() + 1)
  e.setDate(0)
  e.setHours(23, 59, 59, 999)
  return e
}

export async function GET(_req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined

    const start = startOfMonth()
    const end = endOfMonth()

    let monthly = await prisma.weeklyChallenge.findFirst({
      where: {
        isActive: true,
        challengeType: "monthly",
        startDate: { lte: end },
        endDate: { gte: start },
      },
    })

    if (!monthly) {
      monthly = await prisma.weeklyChallenge.create({
        data: {
          title: "Monthly Python Quest",
          description: "Complete a set of learning activities and quizzes across the month.",
          challengeType: "monthly",
          difficulty: "hard",
          startDate: start,
          endDate: end,
          requirements: "complete_activities",
          targetValue: 40,
          category: "general",
          icon: "📅",
        },
      })
    }

    let progress: any = null
    if (userId) {
      progress = await prisma.userChallengeProgress.findUnique({
        where: { userId_challengeId: { userId, challengeId: monthly.id } },
      })
    }

    const now = new Date()
    const expiresInSec = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))

    return NextResponse.json({ monthly: { ...monthly, expiresInSec }, progress })
  } catch (e: any) {
    console.error("/api/challenges/monthly GET error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

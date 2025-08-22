import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function startOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // Monday=0
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfWeek(d = new Date()) {
  const s = startOfWeek(d)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

export async function GET(_req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined

    const start = startOfWeek()
    const end = endOfWeek()

    let weekly = await prisma.weeklyChallenge.findFirst({
      where: {
        isActive: true,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    })

    if (!weekly) {
      // Create a default weekly if none exists for this range
      weekly = await prisma.weeklyChallenge.create({
        data: {
          title: "Learning Marathon",
          description: "Complete 15 learning activities this week",
          challengeType: "complete_learning_activities",
          difficulty: "hard",
          startDate: start,
          endDate: end,
          isActive: true,
          requirements: JSON.stringify({ target: 15, metric: "activities_completed", category: "any" }),
          targetValue: 15,
          diamondReward: 200,
          experienceReward: 400,
          category: "general",
          tags: "weekly,progress",
          icon: "🏆",
        },
      })
    }

    let progress: { currentValue: number; isCompleted: boolean } | undefined
    if (userId) {
      const p = await prisma.userChallengeProgress.findUnique({
        where: { userId_challengeId: { userId, challengeId: weekly.id } },
      })
      if (p) progress = { currentValue: p.currentValue, isCompleted: p.isCompleted }
    }

    const now = new Date()
    const expiresInSec = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))

    return NextResponse.json({
      success: true,
      weekly: {
        id: weekly.id,
        title: weekly.title,
        description: weekly.description,
        difficulty: weekly.difficulty,
        rewardXP: weekly.experienceReward,
        rewardDiamonds: weekly.diamondReward,
        targetValue: weekly.targetValue,
        expiresInSec,
      },
      progress,
    })
  } catch (err) {
    console.error("GET /api/challenges/weekly error", err)
    return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 })
  }
}

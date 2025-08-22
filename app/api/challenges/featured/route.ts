import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined

    const now = new Date()

    let featured = await prisma.weeklyChallenge.findFirst({
      where: {
        isActive: true,
        challengeType: "featured",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { priority: "desc" },
    })

    if (!featured) {
      // Create a 7-day default featured event
      const start = new Date()
      const end = new Date()
      end.setDate(start.getDate() + 7)
      end.setHours(23, 59, 59, 999)
      featured = await prisma.weeklyChallenge.create({
        data: {
          title: "Featured: Syntax Showdown",
          description: "Boost your skills with curated syntax activities this week!",
          challengeType: "featured",
          difficulty: "intermediate",
          startDate: start,
          endDate: end,
          requirements: "complete_activities",
          targetValue: 10,
          category: "general",
          icon: "✨",
          priority: 10,
        },
      })
    }

    let progress: any = null
    if (userId) {
      progress = await prisma.userChallengeProgress.findUnique({
        where: { userId_challengeId: { userId, challengeId: featured.id } },
      })
    }

    const expiresInSec = Math.max(0, Math.floor((new Date(featured.endDate).getTime() - now.getTime()) / 1000))

    return NextResponse.json({ featured: { ...featured, expiresInSec }, progress })
  } catch (e: any) {
    console.error("/api/challenges/featured GET error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

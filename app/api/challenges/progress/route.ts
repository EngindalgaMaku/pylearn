import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { challengeId, increment, set, completed } = body as {
      challengeId: string
      increment?: number
      set?: number
      completed?: boolean
    }

    if (!challengeId) {
      return NextResponse.json({ error: "challengeId is required" }, { status: 400 })
    }

    // Ensure challenge exists
    const challenge = await prisma.weeklyChallenge.findUnique({ where: { id: challengeId } })
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Upsert progress
    const existing = await prisma.userChallengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })

    let currentValue = existing?.currentValue ?? 0
    if (typeof set === "number") currentValue = set
    if (typeof increment === "number") currentValue += increment
    if (currentValue < 0) currentValue = 0

    const isCompleted = completed === true ? true : currentValue >= challenge.targetValue

    const progress = await prisma.userChallengeProgress.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      create: {
        userId,
        challengeId,
        currentValue,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastProgressAt: new Date(),
      },
      update: {
        currentValue,
        isCompleted,
        completedAt: isCompleted ? new Date() : existing?.completedAt ?? null,
        lastProgressAt: new Date(),
      },
    })

    return NextResponse.json({ progress })
  } catch (e: any) {
    console.error("/api/challenges/progress POST error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { gameKey, score = 0, correctCount = 0, durationSec = 0, completedAt, bonusXP = 0 } = body as {
      gameKey: string
      score?: number
      correctCount?: number
      durationSec?: number
      completedAt?: string | Date
      bonusXP?: number
    }

    if (!gameKey) return NextResponse.json({ error: "gameKey is required" }, { status: 400 })

    const anyPrisma = prisma as any
    if (!anyPrisma?.gameSession) {
      return NextResponse.json(
        { error: "GameSession model not available yet. Run Prisma migrate and generate.", hint: "npx prisma migrate dev && npx prisma generate" },
        { status: 503 }
      )
    }

    const gs = await anyPrisma.gameSession.create({
      data: {
        userId,
        gameKey,
        score: Number(score) || 0,
        correctCount: Number(correctCount) || 0,
        durationSec: Number(durationSec) || 0,
        bonusXP: Number(bonusXP) || 0,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    })

    // Calculate rewards with caps
    const baseScore = Number(score) || 0
    const xpFromScore = Math.max(1, Math.min(10, Math.round(baseScore / 10))) // 0-100 -> 0-10, min 1, max 10
    const xpReward = Math.min(10, xpFromScore + Math.max(0, Math.min(10, Number(bonusXP) || 0))) // bonusXP limited within 0-10 window
    const diamondReward = baseScore >= 80 ? 3 : baseScore >= 50 ? 2 : 1

    // Persist rewards and transaction
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: xpReward },
            currentDiamonds: { increment: diamondReward },
            totalDiamonds: { increment: diamondReward },
          },
        })

        await tx.diamondTransaction.create({
          data: {
            userId,
            amount: diamondReward,
            type: "GAME_REWARD",
            description: `${gameKey} completed - Score: ${baseScore}% | +${xpReward} XP`,
            relatedId: gs.id,
            relatedType: "game_session",
          },
        })
      })
    } catch (e) {
      console.error("Failed to apply game rewards:", e)
    }

    // Best-effort: increment active challenges progress for this user
    try {
      const now = new Date()
      const activeChallenges = await prisma.weeklyChallenge.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: { id: true, targetValue: true },
      })

      if (activeChallenges.length && userId) {
        await Promise.all(
          activeChallenges.map(async (ch) => {
            const existing = await prisma.userChallengeProgress.findUnique({
              where: { userId_challengeId: { userId, challengeId: ch.id } },
            })
            const currentValue = (existing?.currentValue ?? 0) + 1
            const isCompleted = currentValue >= (ch.targetValue ?? 0)
            await prisma.userChallengeProgress.upsert({
              where: { userId_challengeId: { userId, challengeId: ch.id } },
              create: {
                userId,
                challengeId: ch.id,
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
          })
        )
      }
    } catch (e) {
      console.error("Failed to update challenge progress from game session:", e)
    }

    return NextResponse.json({ session: gs, rewards: { xp: xpReward, diamonds: diamondReward } })
  } catch (e: any) {
    console.error("/api/games/session POST error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateChallengesProgressForEvent } from "@/lib/challengeProgress"

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { gameKey, score = 0, correctCount = 0, durationSec = 0, completedAt, bonusXP = 0, difficulty } = body as {
      gameKey: string
      score?: number
      correctCount?: number
      durationSec?: number
      completedAt?: string | Date
      bonusXP?: number
      difficulty?: "beginner" | "advanced"
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

    // Calculate rewards: default 1 XP and 1 diamond per correct answer
    // If Code Match is played on advanced difficulty, apply a 2x multiplier
    const baseScore = Number(score) || 0
    const correct = Math.max(0, Number(correctCount) || 0)
    const isAdvanced = (gameKey === "code-match") && (difficulty === "advanced")
    const multiplier = isAdvanced ? 2 : 1
    const xpReward = correct * multiplier
    const diamondReward = correct * multiplier

    // Persist rewards and transaction, while computing before/after totals
    let beforeXP = 0, beforeDiamonds = 0, afterXP = 0, afterDiamonds = 0
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { experience: true, currentDiamonds: true } })
        beforeXP = user?.experience ?? 0
        beforeDiamonds = user?.currentDiamonds ?? 0

        const updated = await tx.user.update({
          where: { id: userId },
          data: {
            experience: { increment: xpReward },
            currentDiamonds: { increment: diamondReward },
            totalDiamonds: { increment: diamondReward },
          },
          select: { experience: true, currentDiamonds: true },
        })
        afterXP = updated.experience
        afterDiamonds = updated.currentDiamonds

        await tx.diamondTransaction.create({
          data: {
            userId,
            amount: diamondReward,
            type: "GAME_REWARD",
            description: `${gameKey} completed${isAdvanced ? " (advanced)" : ""} - Score: ${baseScore}% | +${xpReward} XP`,
            relatedId: gs.id,
            relatedType: "game_session",
          },
        })
      })
    } catch (e) {
      console.error("Failed to apply game rewards:", e)
    }

    // If there is a Daily Mini Quiz for today matching this game, and the
    // requirement is satisfied, award its one-time reward and create attempt.
    // This is independent from the generic game session reward above.
    try {
      function startOfDay(d = new Date()) {
        const x = new Date(d)
        x.setHours(0, 0, 0, 0)
        return x
      }
      function endOfDay(d = new Date()) {
        const x = new Date(d)
        x.setHours(23, 59, 59, 999)
        return x
      }

      const todayStart = startOfDay()
      const todayEnd = endOfDay()

      // Find today's daily where questions JSON contains our gameKey
      const daily = await prisma.dailyMiniQuiz.findFirst({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          isActive: true,
          // questions is a stringified JSON - use a contains match as a pragmatic filter
          questions: { contains: `"gameKey":"${gameKey}"` },
        },
      })

      if (daily) {
        let req: { target?: number; timeLimitSec?: number } = {}
        try {
          const parsed = JSON.parse(daily.questions || "{}")
          req = parsed?.requirement || {}
        } catch {}

        const metTarget = (Number(correctCount) || 0) >= (Number(req.target) || 0)
        const withinTime = (Number(durationSec) || 0) <= (Number(req.timeLimitSec) || Number.MAX_SAFE_INTEGER)

        if (metTarget && withinTime) {
          const already = await prisma.dailyMiniQuizAttempt.findUnique({
            where: { userId_quizId: { userId, quizId: daily.id } },
            select: { id: true },
          })
          if (!already) {
            await prisma.$transaction(async (tx) => {
              // Create attempt record as a claim log
              await tx.dailyMiniQuizAttempt.create({
                data: {
                  userId,
                  quizId: daily.id,
                  answers: JSON.stringify({ fromGameSessionId: gs.id }),
                  score: Number(baseScore) || 0,
                  timeSpent: Number(durationSec) || 0,
                  diamondsEarned: daily.diamondReward || 0,
                  experienceEarned: daily.experienceReward || 0,
                },
              })

              // Increment user's wallet
              await tx.user.update({
                where: { id: userId },
                data: {
                  currentDiamonds: { increment: daily.diamondReward || 0 },
                  totalDiamonds: { increment: daily.diamondReward || 0 },
                  experience: { increment: daily.experienceReward || 0 },
                },
              })

              // Log diamond transaction
              if ((daily.diamondReward || 0) > 0) {
                await tx.diamondTransaction.create({
                  data: {
                    userId,
                    amount: daily.diamondReward || 0,
                    type: "DAILY_MINI_QUIZ",
                    description: `${daily.title} completed | +${daily.experienceReward || 0} XP`,
                    relatedId: daily.id,
                    relatedType: "daily_mini_quiz",
                  },
                })
              }

              // Update aggregates on the daily quiz
              await tx.dailyMiniQuiz.update({
                where: { id: daily.id },
                data: {
                  totalAttempts: { increment: 1 },
                  totalCorrect: { increment: Number(correctCount) || 0 },
                },
              })
            })
          }
        }
      }
    } catch (e) {
      console.error("Failed to apply daily mini quiz reward:", e)
    }

    // Update challenge progress only for game_session type requirements
    try {
      await updateChallengesProgressForEvent({ kind: "game_session", userId, gameKey })
    } catch (e) {
      console.error("Failed to update challenge progress from game session:", e)
    }

    return NextResponse.json({
      session: gs,
      rewards: { xp: xpReward, diamonds: diamondReward },
      totals: { before: { xp: beforeXP, diamonds: beforeDiamonds }, after: { xp: afterXP, diamonds: afterDiamonds } },
    })
  } catch (e: any) {
    console.error("/api/games/session POST error:", e)
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}

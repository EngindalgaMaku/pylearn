import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId)
      return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })

    const { challengeId } = (await req.json()) as { challengeId?: string }
    if (!challengeId)
      return NextResponse.json({ success: false, error: "challengeId is required", code: "BAD_REQUEST" }, { status: 400 })

    const progress = await prisma.userChallengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })
    if (!progress)
      return NextResponse.json({ success: false, error: "Progress not found", code: "NOT_FOUND" }, { status: 404 })
    if (!progress.isCompleted)
      return NextResponse.json({ success: false, error: "Challenge not completed", code: "NOT_COMPLETED" }, { status: 400 })
    if (progress.rewardsClaimed)
      return NextResponse.json(
        { success: false, error: "Rewards already claimed", code: "ALREADY_CLAIMED", alreadyClaimed: true, progress },
        { status: 409 }
      )

    const challenge = await prisma.weeklyChallenge.findUnique({ where: { id: challengeId } })
    if (!challenge)
      return NextResponse.json({ success: false, error: "Challenge not found", code: "NOT_FOUND" }, { status: 404 })

    const diamonds = challenge.diamondReward ?? 0
    const xp = challenge.experienceReward ?? 0

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          currentDiamonds: { increment: diamonds },
          experience: { increment: xp },
        },
        select: { id: true, level: true, experience: true, currentDiamonds: true, totalDiamonds: true },
      })

      await tx.userChallengeProgress.update({
        where: { userId_challengeId: { userId, challengeId } },
        data: { rewardsClaimed: true, claimedAt: new Date() },
      })

      if (diamonds > 0) {
        await tx.diamondTransaction.create({
          data: {
            userId,
            amount: diamonds,
            type: "challenge_reward",
            description: `Reward for challenge: ${challenge.title}`,
            relatedId: challenge.id,
            relatedType: "WeeklyChallenge",
          },
        })
      }

      return { updatedUser }
    })

    const updatedProgress = await prisma.userChallengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })

    return NextResponse.json({ success: true, progress: updatedProgress, user: result.updatedUser, reward: { xp, diamonds } })
  } catch (e: any) {
    console.error("/api/challenges/claim POST error:", e)
    return NextResponse.json({ success: false, error: e?.message || "Server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

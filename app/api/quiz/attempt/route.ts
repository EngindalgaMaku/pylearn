import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/quiz/attempt
// Body: { quizId: string, answers: number[], order?: number[], timeSpent: number }
export async function POST(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  const userId = session?.user?.id as string | undefined

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { quizId?: string; answers?: number[]; order?: number[]; timeSpent?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { quizId, answers, order, timeSpent } = body || {}
  if (!quizId || !Array.isArray(answers)) {
    return NextResponse.json({ error: "quizId and answers are required" }, { status: 400 })
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } })
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }

  // Compute score based on server-side questions
  let parsedQuestions: Array<{ correctAnswer: number }> = []
  try {
    const parsed = JSON.parse(quiz.questions)
    if (Array.isArray(parsed)) parsedQuestions = parsed
  } catch {
    // leave empty
  }

  const totalQuestions = parsedQuestions.length || answers.length
  let correctAnswers = 0
  const hasOrder = Array.isArray(order) && order.length === parsedQuestions.length
  for (let i = 0; i < Math.min(answers.length, parsedQuestions.length); i++) {
    const originalIndex = hasOrder ? order[i] : i
    const q = parsedQuestions[originalIndex]
    if (q && answers[i] === q.correctAnswer) correctAnswers++
  }
  const score = Math.round((correctAnswers / Math.max(1, totalQuestions)) * 100)

  // Save attempt
  const created = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      answers: JSON.stringify(answers),
      score,
      correctAnswers,
      totalQuestions,
      timeSpent: typeof timeSpent === "number" ? timeSpent : 0,
      isCompleted: true,
      completedAt: new Date(),
    },
  })

  // Milestone rewards: lifetime total correct answers thresholds
  const MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const milestoneReward = (n: number) => {
    // Increasing rewards; simple linear: n diamonds and n*2 XP
    return { diamonds: n, xp: n * 2 }
  }

  // Compute user's lifetime correct answers (including this attempt)
  const totalCorrect = await prisma.quizAttempt.aggregate({
    _sum: { correctAnswers: true },
    where: { userId },
  })
  const lifetimeCorrect = totalCorrect._sum.correctAnswers ?? 0

  // Already claimed milestones (tracked via DiamondTransaction relatedType/relatedId)
  const claimed = await prisma.diamondTransaction.findMany({
    where: { userId, relatedType: "quiz_milestone" },
    select: { relatedId: true },
  })
  const claimedSet = new Set((claimed || []).map((c) => c.relatedId))

  const toAward: number[] = MILESTONES.filter((m) => m <= lifetimeCorrect && !claimedSet.has(String(m)))

  let awarded: { milestone: number; diamonds: number; xp: number }[] = []
  if (toAward.length) {
    await prisma.$transaction(async (tx) => {
      for (const m of toAward) {
        const { diamonds, xp } = milestoneReward(m)
        // Create diamond transaction (acts as claim log) and increment user's diamonds/experience
        await tx.diamondTransaction.create({
          data: {
            userId,
            amount: diamonds,
            type: "CREDIT",
            description: `Quiz milestone: ${m} correct answers (lifetime)`,
            relatedType: "quiz_milestone",
            relatedId: String(m),
          },
        })
        await tx.user.update({
          where: { id: userId },
          data: {
            currentDiamonds: { increment: diamonds },
            totalDiamonds: { increment: diamonds },
            experience: { increment: xp },
          },
        })
        awarded.push({ milestone: m, diamonds, xp })
      }
    })
  }

  // Return attempt result and any newly awarded milestones
  const userAfter = await prisma.user.findUnique({ where: { id: userId }, select: { currentDiamonds: true, totalDiamonds: true, experience: true } })

  return NextResponse.json({
    id: created.id,
    score,
    correctAnswers,
    totalQuestions,
    lifetimeCorrect,
    awarded,
    wallet: {
      currentDiamonds: userAfter?.currentDiamonds ?? null,
      totalDiamonds: userAfter?.totalDiamonds ?? null,
      experience: userAfter?.experience ?? null,
    },
  })
}

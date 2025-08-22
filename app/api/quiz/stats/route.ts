import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/quiz/stats?quizId=...
export async function GET(request: Request) {
  const session = (await getServerSession(authOptions as any)) as any
  const userId = session?.user?.id as string | undefined
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const quizId = url.searchParams.get("quizId") || undefined
  if (!quizId) {
    return NextResponse.json({ error: "quizId is required" }, { status: 400 })
  }

  const [attemptsCount, aggregate, best] = await Promise.all([
    prisma.quizAttempt.count({ where: { userId, quizId } }),
    prisma.quizAttempt.aggregate({
      _sum: { correctAnswers: true, score: true },
      _avg: { score: true },
      where: { userId, quizId },
    }),
    prisma.quizAttempt.findFirst({ where: { userId, quizId }, orderBy: { score: "desc" }, select: { score: true } }),
  ])

  const totalCorrect = aggregate._sum.correctAnswers ?? 0
  const averageScore = Math.round((aggregate._avg.score ?? 0))
  const bestScore = best?.score ?? null

  return NextResponse.json({ attemptsCount, totalCorrect, averageScore, bestScore })
}

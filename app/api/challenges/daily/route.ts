import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function pickSample<T>(arr: T[], n: number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

export async function GET(_req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as any
    const userId = (session?.user as any)?.id as string | undefined

    // Games-based daily challenge selection (no DB side-effects)
    // Rotate among available games; default to Syntax Puzzle
    const games = [
      { key: "syntax-puzzle", title: "Syntax Puzzle Daily", description: "Solve 5 syntax puzzles in under 10 minutes", path: "/games/syntax-puzzle", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
      { key: "code-match", title: "Code Match Daily", description: "Match code to output — 5 rounds", path: "/games/code-match", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
      { key: "variable-naming", title: "Variable Naming Daily", description: "Name variables correctly 5 times", path: "/games/variable-naming", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
      { key: "data-types", title: "Data Types Daily", description: "Identify correct Python data types — 5 questions", path: "/games/data-types", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
      { key: "loop-runner", title: "Loop Runner Daily", description: "Predict loop outputs — 5 rounds", path: "/games/loop-runner", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
      { key: "function-calls", title: "Function Calls Daily", description: "Predict function call outputs — 5 rounds", path: "/games/function-calls", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
    ] as const
    const idx = new Date().getDate() % games.length
    const pick = games[idx]

    // Requirement definition for completion
    const requirement = { type: "game_session", target: 5, timeLimitSec: 600 }

    // Read progress from GameSession if logged in
    let progress: { attempted: boolean; score?: number; completed?: boolean } = { attempted: false }
    if (userId) {
      const todayStart = startOfDay()
      const todayEnd = endOfDay()
      const anyPrisma = prisma as any
      const sessionRow = anyPrisma?.gameSession
        ? await anyPrisma.gameSession.findFirst({
            where: {
              userId,
              gameKey: pick.key,
              createdAt: { gte: todayStart, lte: todayEnd },
            },
            select: { score: true, correctCount: true, durationSec: true },
            orderBy: { createdAt: "desc" },
          })
        : null
      if (sessionRow) {
        const completed = sessionRow.correctCount >= requirement.target && sessionRow.durationSec <= requirement.timeLimitSec
        progress = {
          attempted: true,
          score: sessionRow.score,
          completed,
        }
      }
    }

    // compute expires
    const now = new Date()
    const msLeft = endOfDay(now).getTime() - now.getTime()
    const expiresInSec = Math.max(0, Math.floor(msLeft / 1000))

    return NextResponse.json({
      success: true,
      quiz: {
        id: `daily-${pick.key}-${now.toISOString().slice(0,10)}`,
        title: pick.title,
        description: pick.description,
        rewardXP: pick.baseXP,
        rewardDiamonds: pick.baseDiamonds,
        difficulty: pick.difficulty,
        expiresInSec,
        gamePath: pick.path,
        requirement,
      },
      progress,
    })
  } catch (err) {
    console.error("GET /api/challenges/daily error", err)
    return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"

type EventActivityCompleted = {
  kind: "activity_completed"
  userId: string
  category?: string | null
  activityType?: string | null
}

type EventQuizAttempt = {
  kind: "quiz_attempt"
  userId: string
  category?: string | null
  correctAnswers?: number
}

type EventGameSession = {
  kind: "game_session"
  userId: string
  gameKey: string
}

export type ChallengeProgressEvent = EventActivityCompleted | EventQuizAttempt | EventGameSession

function normalizeScopeFromActivityType(activityType?: string | null): "lesson" | "quiz" | "interactive" | "any" {
  const t = (activityType || "").toLowerCase()
  if (t.includes("quiz")) return "quiz"
  if (t.includes("interactive")) return "interactive"
  return "lesson"
}

function parseRequirements(req: any): any {
  if (!req) return { type: "complete_activities", scope: "any" }
  if (typeof req === "string") {
    try {
      const parsed = JSON.parse(req)
      return parsed
    } catch {
      // Fallback for older seeds like "complete_activities"
      return { type: String(req), scope: "any" }
    }
  }
  return req
}

function matchesCompleteActivities(ev: EventActivityCompleted | EventQuizAttempt, req: any): number {
  const scope = (req?.scope as string) || "any"
  const category = (req?.category as string) || undefined
  const evCategory = (ev.category || undefined) as string | undefined

  // Scope check
  if (ev.kind === "activity_completed") {
    const evScope = normalizeScopeFromActivityType(ev.activityType)
    if (scope !== "any" && scope !== evScope) return 0
  }
  if (ev.kind === "quiz_attempt") {
    if (scope !== "any" && scope !== "quiz") return 0
  }

  // Category check (if requirement specifies one)
  if (category && evCategory && category.toLowerCase() !== evCategory.toLowerCase()) return 0
  if (category && !evCategory) return 0

  // Amount
  return 1
}

function matchesQuizCorrect(ev: EventQuizAttempt, req: any): number {
  const category = (req?.category as string) || undefined
  const evCategory = (ev.category || undefined) as string | undefined
  if (category && evCategory && category.toLowerCase() !== evCategory.toLowerCase()) return 0
  if (category && !evCategory) return 0
  return Math.max(0, Number(ev.correctAnswers || 0))
}

function matchesGameSession(ev: EventGameSession, req: any): number {
  const keys = req?.gameKeys
  if (!keys || keys === "any") return 1
  if (Array.isArray(keys)) {
    return keys.includes(ev.gameKey) ? 1 : 0
  }
  return 0
}

export async function updateChallengesProgressForEvent(event: ChallengeProgressEvent): Promise<void> {
  const userId = event.userId
  const now = new Date()
  const challenges = await prisma.weeklyChallenge.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    select: { id: true, targetValue: true, requirements: true, challengeType: true },
  })

  if (!challenges.length) return

  for (const ch of challenges) {
    const req = parseRequirements(ch.requirements)
    const type = (req?.type as string) || String(ch.challengeType || "")
    let inc = 0

    if (type === "complete_activities") {
      if (event.kind === "activity_completed") inc = matchesCompleteActivities(event, req)
      if (event.kind === "quiz_attempt") inc = matchesCompleteActivities(event, req)
    } else if (type === "quiz_correct") {
      if (event.kind === "quiz_attempt") inc = matchesQuizCorrect(event, req)
    } else if (type === "games_session" || type === "game_session") {
      if (event.kind === "game_session") inc = matchesGameSession(event, req)
    } else if (type === "complete_learning_activities") {
      // Backward-compat: any completed activity counts as 1
      if (event.kind === "activity_completed" || event.kind === "quiz_attempt") inc = 1
    }

    if (inc <= 0) continue

    const existing = await prisma.userChallengeProgress.findUnique({ where: { userId_challengeId: { userId, challengeId: ch.id } } })
    const currentValue = (existing?.currentValue ?? 0) + inc
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
  }
}




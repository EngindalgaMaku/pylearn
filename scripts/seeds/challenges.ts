import "dotenv/config"
import { prisma } from "../../lib/prisma"

function startOfWeek(d = new Date()) {
  const day = d.getDay() || 7
  const s = new Date(d)
  s.setHours(0, 0, 0, 0)
  s.setDate(s.getDate() - day + 1)
  return s
}

function endOfWeek(d = new Date()) {
  const s = startOfWeek(d)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

function startOfMonth(d = new Date()) {
  const s = new Date(d)
  s.setDate(1)
  s.setHours(0, 0, 0, 0)
  return s
}

function endOfMonth(d = new Date()) {
  const s = startOfMonth(d)
  const e = new Date(s)
  e.setMonth(e.getMonth() + 1)
  e.setDate(0)
  e.setHours(23, 59, 59, 999)
  return e
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const

function pick<T>(arr: readonly T[], i: number) {
  return arr[i % arr.length]
}

async function main() {
  console.log("Seeding ~30 challenges (weekly/monthly/featured) [seed:v1]")

  // Idempotency: remove our previous seed batch
  const del = await prisma.weeklyChallenge.deleteMany({ where: { tags: { contains: "seed:v1" } } })
  if (del.count) console.log(`Deleted ${del.count} previously seeded challenges`)

  const now = new Date()

  // 12 weekly challenges spanning 12 weeks around now
  const weeklyData = Array.from({ length: 12 }).map((_, idx) => {
    const start = startOfWeek(new Date(now.getTime() + (idx - 4) * 7 * 86400000))
    const end = endOfWeek(start)
    const difficulty = pick(DIFFICULTIES, idx)
    const targetValue = 10 + (idx % 3) * 5
    return {
      title: `Weekly: Python Practice #${idx + 1}`,
      description: `Complete ${targetValue} learning activities this week.`,
      challengeType: "weekly",
      difficulty,
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: "complete_activities",
      targetValue,
      diamondReward: 80 + (idx % 3) * 20,
      experienceReward: 150 + (idx % 3) * 50,
      category: "general",
      tags: "seed:v1,weekly",
      icon: "🏆",
      priority: 0,
    }
  })

  // 6 monthly challenges spanning 6 months around now
  const monthlyData = Array.from({ length: 6 }).map((_, idx) => {
    const base = new Date(now)
    base.setMonth(base.getMonth() + (idx - 2))
    const start = startOfMonth(base)
    const end = endOfMonth(base)
    const difficulty = pick(DIFFICULTIES, idx + 1)
    const targetValue = 30 + (idx % 3) * 10
    return {
      title: `Monthly Quest ${start.getMonth() + 1}/${start.getFullYear()}`,
      description: `Accumulate ${targetValue} activity completions this month.`,
      challengeType: "monthly",
      difficulty,
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: "complete_activities",
      targetValue,
      diamondReward: 150 + (idx % 3) * 50,
      experienceReward: 300 + (idx % 3) * 100,
      category: "general",
      tags: "seed:v1,monthly",
      icon: "📅",
      priority: 5,
    }
  })

  // 12 featured events, each ~7-10 days, staggered
  const featuredData = Array.from({ length: 12 }).map((_, idx) => {
    const start = new Date(now.getTime() + (idx - 6) * 5 * 86400000)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7 + (idx % 4))
    end.setHours(23, 59, 59, 999)
    const difficulty = pick(DIFFICULTIES, idx + 2)
    const targetValue = 8 + (idx % 4) * 4
    return {
      title: `Featured: Syntax Sprint #${idx + 1}`,
      description: `Complete ${targetValue} syntax-focused activities during the event.`,
      challengeType: "featured",
      difficulty,
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: "complete_activities",
      targetValue,
      diamondReward: 100 + (idx % 4) * 25,
      experienceReward: 200 + (idx % 4) * 50,
      category: "general",
      tags: "seed:v1,featured",
      icon: "✨",
      priority: 10 - (idx % 3),
    }
  })

  const all = [...weeklyData, ...monthlyData, ...featuredData]

  // Game-focused challenges (include all games). These rely on gameplay sessions to drive progress.
  const gameWeekly = Array.from({ length: 6 }).map((_, idx) => {
    const start = startOfWeek(new Date(now.getTime() + (idx - 2) * 7 * 86400000))
    const end = endOfWeek(start)
    const difficulty = pick(DIFFICULTIES, idx + 1)
    const targetValue = 12 + (idx % 3) * 6 // 12, 18, 24
    return {
      title: `Weekly: Play Python Games #${idx + 1}`,
      description: `Play any Python mini-game ${targetValue} times this week (all games count).`,
      challengeType: "weekly",
      difficulty,
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: JSON.stringify({ type: "game_session", gameKeys: "any", target: targetValue }),
      targetValue,
      diamondReward: 100 + (idx % 3) * 25,
      experienceReward: 220 + (idx % 3) * 60,
      category: "games",
      tags: "seed:v1,weekly,games",
      icon: "🎮",
      priority: 2,
    }
  })

  const gameMonthly = Array.from({ length: 3 }).map((_, idx) => {
    const base = new Date(now)
    base.setMonth(base.getMonth() + (idx - 1))
    const start = startOfMonth(base)
    const end = endOfMonth(base)
    const difficulty = pick(DIFFICULTIES, idx + 2)
    const targetValue = 50 + (idx % 3) * 25 // 50, 75, 100
    return {
      title: `Monthly: Python Game Marathon (${start.getMonth() + 1}/${start.getFullYear()})`,
      description: `Accumulate ${targetValue} total plays across any Python mini-games this month.`,
      challengeType: "monthly",
      difficulty,
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: JSON.stringify({ type: "game_session", gameKeys: "any", target: targetValue }),
      targetValue,
      diamondReward: 200 + (idx % 3) * 50,
      experienceReward: 400 + (idx % 3) * 120,
      category: "games",
      tags: "seed:v1,monthly,games",
      icon: "🕹️",
      priority: 6,
    }
  })

  all.push(...gameWeekly, ...gameMonthly)

  const created = await prisma.weeklyChallenge.createMany({ data: all, skipDuplicates: true })
  console.log(`Inserted ${created.count} challenges`)

  const totals = await prisma.weeklyChallenge.groupBy({
    by: ["challengeType"],
    _count: { _all: true },
    where: { tags: { contains: "seed:v1" } },
  })
  console.log("Totals by type:", totals)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

/*
  Seed: Generate weekly challenges from current week up to end of 2025
  Idempotent by tag: removes previous batch tagged with TAG within the range, then inserts fresh.
*/

import { PrismaClient } from "@prisma/client"
import {
  addWeeks,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  isBefore,
  startOfWeek,
} from "date-fns"

const prisma = new PrismaClient()

function getArg(name: string): string | undefined {
  const pref = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(pref))
  if (hit) return hit.slice(pref.length)
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith("--")) return process.argv[idx + 1]
  const envKey = name.toUpperCase().replace(/-/g, "_")
  return process.env[envKey]
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const

function pick<T>(arr: readonly T[], i: number) {
  return arr[i % arr.length]
}

async function main() {
  const now = new Date()
  const startArg = getArg("start")
  const endArg = getArg("end")
  const endYearArg = getArg("end-year")
  const endYear = endYearArg ? Number(endYearArg) : 2025
  const TAG = `seed:weekly:${endYear}`

  const rangeStart = startOfWeek(startArg ? new Date(startArg) : now)
  const rangeEnd = endArg ? new Date(endArg) : endOfYear(new Date(endYear, 11, 31))

  console.log(
    `Seeding weekly challenges from ${rangeStart.toISOString().slice(0, 10)} to ${rangeEnd.toISOString().slice(0, 10)} [ ${TAG} ]`
  )

  // Clean previous batch in-range by tag
  const del = await prisma.weeklyChallenge.deleteMany({
    where: {
      challengeType: "weekly",
      // Remove any previously seeded weekly items in range regardless of end-year tag
      tags: { contains: "seed:weekly:" },
      startDate: { gte: rangeStart },
      endDate: { lte: rangeEnd },
    },
  })
  if (del.count) console.log(`Deleted ${del.count} previous ${TAG} challenges`)

  // Determine category pool from existing non-seed weekly challenges first, then fallback to active categories table
  const existingWeeklyCats = await prisma.weeklyChallenge.findMany({
    where: { challengeType: "weekly", NOT: { tags: { contains: "seed:" } } },
    select: { category: true },
    distinct: ["category"],
  })
  let CATEGORY_POOL = existingWeeklyCats.map((c) => c.category).filter((c): c is string => Boolean(c))
  if (CATEGORY_POOL.length === 0) {
    // Fallback: derive from actual learning activities via raw SQL for robust distinct filtering
    const rows: Array<{ category: string }>= await (prisma as any).$queryRawUnsafe(
      "SELECT DISTINCT \"category\" as category FROM \"learning_activities\" WHERE \"category\" IS NOT NULL AND \"category\" <> '' ORDER BY \"category\" ASC LIMIT 100"
    )
    CATEGORY_POOL = rows.map((r) => r.category).filter((c): c is string => Boolean(c))
  }
  if (CATEGORY_POOL.length === 0) CATEGORY_POOL = ["Python Fundamentals"]

  // Build weekly items
  const data: any[] = []
  let weekStart = rangeStart
  let i = 0
  while (isBefore(weekStart, addWeeks(rangeEnd, 1))) {
    const weekEnd = endOfWeek(weekStart)
    const difficulty = pick(DIFFICULTIES, i)
    const targetValue = 12 + (i % 4) * 3 // 12,15,18,21
    const xp = 150 + (i % 3) * 50
    const diamonds = 80 + (i % 3) * 20
    const category = CATEGORY_POOL[i % CATEGORY_POOL.length]

    const req = { type: "complete_activities", scope: "lesson", category, target: targetValue }
    data.push({
      title: `Weekly: ${category} Practice (${format(weekStart, "MMM d")})`,
      description: `Complete ${targetValue} learning activities this week in ${category}.`,
      challengeType: "weekly",
      difficulty,
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true,
      requirements: JSON.stringify(req),
      targetValue,
      diamondReward: diamonds,
      experienceReward: xp,
      category,
      tags: `${TAG},weekly`,
      icon: "🏆",
      priority: 0,
    })

    weekStart = addWeeks(weekStart, 1)
    i += 1
  }

  if (!data.length) {
    console.log("No weeks to insert in range; exiting")
    return
  }

  const res = await prisma.weeklyChallenge.createMany({ data, skipDuplicates: true })
  console.log(`Inserted ${res.count} weekly challenges`)

  const totalInRange = await prisma.weeklyChallenge.count({
    where: { startDate: { gte: rangeStart }, endDate: { lte: rangeEnd } },
  })
  console.log(`Total weekly challenges in range now: ${totalInRange}`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



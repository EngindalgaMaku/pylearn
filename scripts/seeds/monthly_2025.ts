/*
  Seed: Generate monthly challenges within a date range (parametrized)
  - General monthly quest: complete_activities (scope:any)
  - Optional games monthly every 2 months: games_session
  - Idempotent via tag: seed:monthly:<year>
*/

import { PrismaClient } from "@prisma/client"
import { addMonths, endOfMonth, endOfYear, format, isBefore, startOfMonth } from "date-fns"

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

async function main() {
  const now = new Date()
  const startArg = getArg("start")
  const endArg = getArg("end")
  const endYearArg = getArg("end-year")
  const endYear = endYearArg ? Number(endYearArg) : 2025
  const TAG = `seed:monthly:${endYear}`

  const rangeStart = startOfMonth(startArg ? new Date(startArg) : now)
  const rangeEnd = endArg ? new Date(endArg) : endOfYear(new Date(endYear, 11, 31))

  console.log(`Seeding monthly challenges from ${rangeStart.toISOString().slice(0, 10)} to ${rangeEnd.toISOString().slice(0, 10)} [ ${TAG} ]`)

  // Clean previous seeded monthlies in range
  const del = await prisma.weeklyChallenge.deleteMany({
    where: {
      challengeType: "monthly",
      tags: { contains: "seed:monthly:" },
      startDate: { gte: rangeStart },
      endDate: { lte: rangeEnd },
    },
  })
  if (del.count) console.log(`Deleted ${del.count} previous ${TAG} items`)

  const data: any[] = []
  let cur = rangeStart
  let i = 0
  while (isBefore(cur, addMonths(rangeEnd, 1))) {
    const start = startOfMonth(cur)
    const end = endOfMonth(cur)
    const target = 30 + (i % 3) * 10 // 30,40,50
    const xp = 300 + (i % 3) * 100
    const diamonds = 150 + (i % 3) * 50

    const reqGeneral = { type: "complete_activities", scope: "any", category: "general", target }
    data.push({
      title: `Monthly Quest ${format(start, "M/yyyy")}`,
      description: `Accumulate ${target} activity completions this month.`,
      challengeType: "monthly",
      difficulty: ["beginner", "intermediate", "advanced"][i % 3],
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: JSON.stringify(reqGeneral),
      targetValue: target,
      diamondReward: diamonds,
      experienceReward: xp,
      category: "general",
      tags: `${TAG},monthly,general`,
      icon: "📅",
      priority: 3,
    })

    // Every 2 months add a games marathon
    if (i % 2 === 1) {
      const targetGames = 50 + (i % 3) * 25
      const reqGames = { type: "games_session", gameKeys: "any", target: targetGames }
      data.push({
        title: `Monthly: Python Game Marathon (${format(start, "M/yyyy")})`,
        description: `Accumulate ${targetGames} total plays across any Python mini-games this month.`,
        challengeType: "monthly",
        difficulty: ["beginner", "intermediate", "advanced"][(i + 1) % 3],
        startDate: start,
        endDate: end,
        isActive: true,
        requirements: JSON.stringify(reqGames),
        targetValue: targetGames,
        diamondReward: 200 + (i % 3) * 50,
        experienceReward: 400 + (i % 3) * 120,
        category: "games",
        tags: `${TAG},monthly,games`,
        icon: "🎮",
        priority: 4,
      })
    }

    cur = addMonths(cur, 1)
    i += 1
  }

  if (!data.length) {
    console.log("No monthly items to insert; exiting")
    return
  }

  const res = await prisma.weeklyChallenge.createMany({ data, skipDuplicates: true })
  console.log(`Inserted ${res.count} monthly challenges`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })




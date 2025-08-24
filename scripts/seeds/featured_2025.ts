/*
  Seed: Generate recurring featured challenges up to end of 2025
  - Creates 7-day "featured" events every 3 weeks with rotating themes
  - Idempotent via tag within date range
*/

import { PrismaClient } from "@prisma/client"
import { addWeeks, endOfWeek, endOfYear, format, isBefore, startOfWeek } from "date-fns"

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

const THEMES = [
  { key: "syntax", title: "Featured: Syntax Showdown", description: "Master Python syntax with curated activities.", icon: "✨", category: "syntax" },
  { key: "datastructures", title: "Featured: Data Structures Sprint", description: "Lists, dicts, sets and more — level up fast!", icon: "🧩", category: "data-structures" },
  { key: "algorithms", title: "Featured: Algorithm Arena", description: "Sharpen problem solving with classic patterns.", icon: "⚡", category: "algorithms" },
  { key: "games", title: "Featured: Game Jam Week", description: "Play Python games and practice skills while having fun.", icon: "🎮", category: "games" },
  { key: "quizzes", title: "Featured: Quiz Blitz", description: "Quick-fire quizzes to test and reinforce knowledge.", icon: "🧠", category: "quizzes" },
] as const

function pickTheme(i: number) {
  return THEMES[i % THEMES.length]
}

async function main() {
  const now = new Date()
  const startArg = getArg("start")
  const endArg = getArg("end")
  const endYearArg = getArg("end-year")
  const intervalArg = getArg("interval")
  const interval = intervalArg ? Number(intervalArg) : 3
  const endYear = endYearArg ? Number(endYearArg) : 2025
  const TAG = `seed:featured:${endYear}`

  const rangeStart = startOfWeek(startArg ? new Date(startArg) : now)
  const rangeEnd = endArg ? new Date(endArg) : endOfYear(new Date(endYear, 11, 31))

  console.log(
    `Seeding featured challenges from ${rangeStart.toISOString().slice(0, 10)} to ${rangeEnd.toISOString().slice(0, 10)} [ ${TAG} ]`
  )

  // Remove previous batch for idempotency
  const del = await prisma.weeklyChallenge.deleteMany({
    where: {
      challengeType: "featured",
      tags: { contains: "seed:featured:" },
      startDate: { gte: rangeStart },
      endDate: { lte: rangeEnd },
    },
  })
  if (del.count) console.log(`Deleted ${del.count} previous ${TAG} items`)

  const data: any[] = []
  let week = rangeStart
  let i = 0
  while (isBefore(week, addWeeks(rangeEnd, 1))) {
    // one featured every 3 weeks
    const start = startOfWeek(week)
    const end = endOfWeek(start)
    const theme = pickTheme(i)
    const target = 10 + (i % 3) * 5
    const xp = 250 + (i % 3) * 75
    const diamonds = 120 + (i % 3) * 30

    const req =
      theme.key === "games"
        ? { type: "games_session", gameKeys: "any", target }
        : theme.key === "quizzes"
        ? { type: "complete_activities", scope: "quiz", category: theme.category, target }
        : { type: "complete_activities", scope: "lesson", category: theme.category, target }

    data.push({
      title: `${theme.title} (${format(start, "MMM d")})`,
      description: theme.description,
      challengeType: "featured",
      difficulty: ["beginner", "intermediate", "advanced"][i % 3],
      startDate: start,
      endDate: end,
      isActive: true,
      requirements: JSON.stringify(req),
      targetValue: target,
      diamondReward: diamonds,
      experienceReward: xp,
      category: theme.category,
      tags: `${TAG},featured,${theme.key}`,
      icon: theme.icon,
      priority: 10,
    })

    week = addWeeks(week, interval)
    i += 1
  }

  if (!data.length) {
    console.log("No featured to insert; exiting")
    return
  }

  const res = await prisma.weeklyChallenge.createMany({ data, skipDuplicates: true })
  console.log(`Inserted ${res.count} featured challenges`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



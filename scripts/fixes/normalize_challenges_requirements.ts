import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function safeParse(input: any): any | null {
  if (input === null || input === undefined) return null
  if (typeof input === "object") return input
  if (typeof input !== "string") return null
  try {
    return JSON.parse(input)
  } catch {
    return { type: String(input) }
  }
}

async function main() {
  console.log("Normalizing WeeklyChallenge.requirements …")

  const rows = await prisma.weeklyChallenge.findMany({
    select: {
      id: true,
      title: true,
      challengeType: true,
      category: true,
      requirements: true,
      targetValue: true,
    },
  })

  let updated = 0
  for (const r of rows) {
    const parsed = safeParse(r.requirements)

    // Determine if needs normalization
    const isObject = parsed && typeof parsed === "object"
    const hasType = isObject && !!parsed.type
    const hasScopeOrTarget = isObject && (parsed.scope !== undefined || parsed.target !== undefined)
    const needs = !parsed || !hasType || !hasScopeOrTarget
    if (!needs && typeof r.requirements === "string") {
      // String with JSON content already fine; skip
      continue
    }

    const titleLower = (r.title || "").toLowerCase()
    const isGame = (r.category || "").toLowerCase() === "games" || titleLower.includes("game")
    const isQuiz = titleLower.includes("quiz")

    let req: any
    if (isGame) {
      req = { type: "games_session", gameKeys: "any", target: r.targetValue }
    } else if (isQuiz) {
      req = { type: "complete_activities", scope: "quiz", category: r.category || undefined, target: r.targetValue }
    } else {
      req = { type: "complete_activities", scope: "any", category: r.category || undefined, target: r.targetValue }
    }

    await prisma.weeklyChallenge.update({ where: { id: r.id }, data: { requirements: JSON.stringify(req) } })
    updated++
  }

  console.log(`Updated requirements for ${updated} challenges`)
}

main()
  .catch((e) => {
    console.error("Normalize failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })



import { prisma } from "../lib/prisma"

function summarizePairShape(obj: any) {
  if (!obj || typeof obj !== "object") return { leftKey: null, rightKey: null }
  const keys = Object.keys(obj)
  const leftKey = keys.find((k) => /^(left|term|question|prompt|code|word|a)$/i.test(k)) || null
  const rightKey = keys.find((k) => /^(right|definition|answer|output|meaning|b)$/i.test(k)) || null
  return { leftKey, rightKey }
}

function findPairsArray(parsed: any): { pairs: any[] | null; path: string | null } {
  if (!parsed) return { pairs: null, path: null }
  // 1) Direct array
  if (Array.isArray(parsed)) return { pairs: parsed, path: "(root array)" }
  // 2) Common keys
  const candidates = [
    "pairs",
    "items",
    "data",
    "matching",
    "content",
    "questions",
  ]
  for (const key of candidates) {
    const v = (parsed as any)?.[key]
    if (Array.isArray(v)) return { pairs: v, path: key }
    // nested .matching.pairs, .content.pairs, etc.
    if (v && typeof v === "object") {
      const pp = (v as any).pairs
      if (Array.isArray(pp)) return { pairs: pp, path: `${key}.pairs` }
      const items = (v as any).items
      if (Array.isArray(items)) return { pairs: items, path: `${key}.items` }
    }
  }
  // 3) Scan shallow object values for first array of objects
  if (typeof parsed === "object") {
    for (const [k, v] of Object.entries(parsed)) {
      if (Array.isArray(v) && v.length && typeof v[0] === "object") {
        return { pairs: v as any[], path: k }
      }
    }
  }
  return { pairs: null, path: null }
}

async function main() {
  const rows = await prisma.learningActivity.findMany({
    where: {
      isActive: true,
      // case-insensitive contains 'matching'
      activityType: { contains: "matching", mode: "insensitive" },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      activityType: true,
      estimatedMinutes: true,
      content: true,
    },
    orderBy: [{ createdAt: "desc" } as any],
  })

  if (!rows.length) {
    console.log("No matching activities found.")
    return
  }

  console.log(`Found ${rows.length} matching activities`) 
  for (const r of rows) {
    const info: any = {
      id: r.id,
      slug: r.slug,
      title: r.title,
      activityType: r.activityType,
      estimatedMinutes: r.estimatedMinutes,
    }

    let parsed: any = null
    let parseError: string | null = null
    if (typeof r.content === "string" && r.content.trim()) {
      try {
        parsed = JSON.parse(r.content)
      } catch (e: any) {
        parseError = e?.message || String(e)
      }
    }

    if (!parsed && !parseError) {
      info.contentType = typeof r.content
      info.hasContent = Boolean(r.content)
    }

    if (parseError) {
      info.contentJson = "invalid"
      info.error = parseError
    } else if (parsed) {
      info.contentJson = "valid"
      info.topLevelType = Array.isArray(parsed) ? "array" : typeof parsed
      info.topLevelKeys = Array.isArray(parsed) ? [] : Object.keys(parsed)
      const loc = findPairsArray(parsed)
      info.pairsPath = loc.path
      const sample = (loc.pairs && loc.pairs.length) ? loc.pairs[0] : null
      if (sample) {
        const shape = summarizePairShape(sample)
        info.samplePairKeys = Object.keys(sample)
        info.detectedLeftKey = shape.leftKey
        info.detectedRightKey = shape.rightKey
      } else {
        info.samplePairKeys = []
      }
    } else {
      info.contentJson = "empty"
    }

    console.log(JSON.stringify(info, null, 2))
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })

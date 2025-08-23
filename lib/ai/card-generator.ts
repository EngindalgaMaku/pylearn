import { prisma } from "@/lib/prisma"

// Category-themed name pools (compact but expressive). Expand as needed.
const basePrefixes = [
  "Dragon",
  "Shadow",
  "Crystal",
  "Golden",
  "Storm",
  "Lightning",
  "Arcane",
  "Mystic",
  "Phoenix",
  "Cyber",
  "Turbo",
  "Nitro",
]

const baseSuffixes = [
  "Soul",
  "Heart",
  "Blade",
  "Shield",
  "Engine",
  "Spirit",
  "Fury",
  "Strike",
  "Echo",
  "Legend",
]

const baseCharacters = [
  // Japanese/anime style
  "Akira",
  "Sakura",
  "Hiro",
  "Rin",
  "Kage",
  "Yuki",
  // Fantasy
  "Zephyr",
  "Nova",
  "Orion",
  "Luna",
  // Popular anime-like
  "Aizen",
  "Kakashi",
  "Mikasa",
  "Levi",
]

const carPrefixes = ["Turbo", "Nitro", "Racing", "Street", "Drift", "Velocity", "Chrome"]
const carSuffixes = ["Engine", "Boost", "Drive", "Gear", "Track", "Sprint", "Spec"]
const carCharacters = ["Takumi", "Ryota", "Kenji", "Akane", "Jin", "Aoi"]

const mysticPrefixes = ["Arcane", "Elder", "Ancient", "Enchanted", "Mythic", "Cursed"]
const mysticSuffixes = ["Soul", "Spell", "Sigil", "Rune", "Omen", "Whisper"]
const mysticCharacters = ["Aurora", "Onyx", "Raven", "Iris", "Sage", "Vortex"]

const techPrefixes = ["Cyber", "Quantum", "Neo", "Plasma", "Holo", "Mecha"]
const techSuffixes = ["Core", "Matrix", "Pulse", "Node", "Protocol", "Circuit"]
const techCharacters = ["Xenon", "Atlas", "Echo", "Kirin", "Ada", "Nova"]

type Pools = { prefixes: string[]; suffixes: string[]; characters: string[] }

function getPoolsByCategory(category?: string): Pools {
  const cat = (category || "anime").toLowerCase()
  if (cat.includes("car") || cat.includes("auto") || cat.includes("racing")) {
    return { prefixes: [...carPrefixes, ...basePrefixes], suffixes: [...carSuffixes, ...baseSuffixes], characters: [...carCharacters, ...baseCharacters] }
  }
  if (cat.includes("myth") || cat.includes("magic") || cat.includes("fantasy") || cat.includes("myst")) {
    return { prefixes: [...mysticPrefixes, ...basePrefixes], suffixes: [...mysticSuffixes, ...baseSuffixes], characters: [...mysticCharacters, ...baseCharacters] }
  }
  if (cat.includes("tech") || cat.includes("sci") || cat.includes("robot") || cat.includes("mecha")) {
    return { prefixes: [...techPrefixes, ...basePrefixes], suffixes: [...techSuffixes, ...baseSuffixes], characters: [...techCharacters, ...baseCharacters] }
  }
  // default anime-like
  return { prefixes: basePrefixes, suffixes: baseSuffixes, characters: baseCharacters }
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function generateUniqueCardTitle(options?: { category?: string }): Promise<string> {
  const pools = getPoolsByCategory(options?.category)

  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const prefix = pick(pools.prefixes)
    const suffix = pick(pools.suffixes)
    const character = pick(pools.characters)

    const formats = [
      `${prefix} ${character}`,
      `${character} ${suffix}`,
      `${prefix} ${suffix} ${character}`,
    ]

    const candidate = pick(formats)

    const existing = await prisma.usedCardNames.findUnique({ where: { cardTitle: candidate } as any })
    if (!existing) return candidate

    attempts++
  }

  const ts = Date.now().toString().slice(-4)
  const fallback = `${pick(pools.prefixes)} ${pick(pools.characters)} ${ts}`
  return fallback
}

export async function saveUsedCardName(cardId: string, cardTitle: string): Promise<void> {
  try {
    // If record for this card exists, update when safe; otherwise create with conflict retries
    const existingByCard = await prisma.usedCardNames.findUnique({ where: { cardId } as any })

    if (existingByCard) {
      if (existingByCard.cardTitle === cardTitle) return

      const conflict = await prisma.usedCardNames.findUnique({ where: { cardTitle } as any })
      if (conflict && conflict.cardId !== cardId) {
        // Keep existing title for this card if new one conflicts
        return
      }

      await prisma.usedCardNames.update({ where: { cardId } as any, data: { cardTitle } as any })
      return
    }

    let finalTitle = cardTitle
    let tries = 0
    const max = 10
    while (tries < max) {
      try {
        await prisma.usedCardNames.create({ data: { cardId, cardTitle: finalTitle } as any })
        return
      } catch (err: any) {
        if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
          tries++
          const ts = Date.now().toString().slice(-4)
          const rand = Math.random().toString(36).slice(2, 6)
          finalTitle = `${cardTitle}_${ts}_${rand}`
        } else {
          throw err
        }
      }
    }
  } catch (e) {
    // Log only; do not fail analysis
    console.warn("saveUsedCardName warning:", e)
  }
}

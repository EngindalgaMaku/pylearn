import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { generateImageToken } from "@/lib/imageToken"

// Map incoming category to accepted values matching anime-card-manager rules
function normalizeRequestCategory(input: string) {
  const c = (input || "").toLowerCase()
  if (c === "anime") return "anime-collection"
  if (c === "star") return "star-collection"
  if (c === "car") return "car-collection"
  return c || "anime-collection"
}

// Optional: normalize public paths (kept for debugging fields)
function normalizeImagePath(input?: string | null, fallback = "/placeholder.svg") {
  if (!input) return fallback
  let p = input.trim()
  if (!p) return fallback
  if (p.startsWith("http://") || p.startsWith("https://")) return p
  p = p.replace(/\\/g, "/")
  p = p.replace(/^public\//, "/")
  if (!p.startsWith("/")) p = "/" + p
  return p
}

function buildSecureUrls(cardId: string) {
  const thumbTok = generateImageToken(cardId, "thumbnail")
  const previewTok = generateImageToken(cardId, "preview")
  const fullTok = generateImageToken(cardId, "full")
  return {
    secureThumbnailUrl: `/api/secure-image?cardId=${cardId}&type=thumbnail&token=${thumbTok}`,
    securePreviewUrl: `/api/secure-image?cardId=${cardId}&type=preview&token=${previewTok}`,
    secureFullImageUrl: `/api/secure-image?cardId=${cardId}&type=full&token=${fullTok}`,
  }
}

// Only category constraint; default to anime-collection when category is missing or "all"
function buildWhere(categoryParam?: string) {
  const incoming = (categoryParam || "all").toLowerCase()
  const effective =
    !incoming || incoming === "all" ? "anime-collection" : normalizeRequestCategory(incoming)

  const categoryMappings: Record<string, string[]> = {
    "anime-collection": ["anime-collection", "anime"],
    "star-collection": ["star-collection", "star"],
    "car-collection": ["car-collection", "car"],
  }
  const mapped = categoryMappings[effective]
  return {
    category: mapped ? { in: mapped } : effective,
  } as any
}

/**
 * Sanitize text fields (series/character) to avoid placeholder junk like:
 * "Unknown", "Unknown Fighter", "Anime Character", "Anime Series", etc.
 * Returns an empty string if it's generic/useless.
 */
function sanitizeText(input?: string | null): string {
  if (!input) return ""
  const s = String(input).trim()
  if (!s) return ""

  const lower = s.toLowerCase()
  const generic = new Set([
    "unknown",
    "unknown fighter",
    "unknown character",
    "anime character",
    "anime series",
    "character",
    "series",
    "mystery hero",
    "n/a",
    "none",
    "-",
  ])
  if (generic.has(lower)) return ""

  // Also treat category-like values as generic (e.g., "Anime Collection")
  const catLike = lower.replace(/[_-]+/g, " ")
  if (catLike === "anime collection" || catLike === "star collection" || catLike === "car collection") {
    return ""
  }

  return s
}

/**
 * Returns empty if 'val' equals any of the others (case/space-insensitive), otherwise returns val.
 */
function dropIfSame(val: string, ...others: string[]): string {
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, " ")
  const v = norm(val)
  for (const o of others) {
    if (v && v === norm(o)) return ""
  }
  return val
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const rawCategory = (searchParams.get("category") || "all").toLowerCase()

    // Pagination
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const pageSize = Math.min(48, Math.max(1, Number(searchParams.get("pageSize") || "12")))
    const skip = (page - 1) * pageSize

    const where = buildWhere(rawCategory)

    // Query newest first. Select fields to mirror anime-card-manager shop mapping.
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        select: {
          id: true,
          cardTitle: true,
          name: true,
          fileName: true,
          series: true,
          rarity: true,
          category: true,
          diamondPrice: true,
          thumbnailUrl: true,
          imagePath: true,
          specialAbility: true,
          character: true,
          story: true,
          // Power stats and element for card "powers" UI
          attackPower: true,
          defense: true,
          speed: true,
          element: true,
        } as any,
        skip,
        take: pageSize,
        orderBy: { id: "desc" },
      }),
      prisma.card.count({ where } as any),
    ])

    const items = cards.map((c: any) => {
      const urls = buildSecureUrls(c.id)
      // Sanitize series/character and avoid duplicates across name/series/character
      const rawSeries = sanitizeText(c.series)
      const rawCharacter = sanitizeText(c.character)
      const displaySeries = dropIfSame(rawSeries, c.cardTitle || c.name || c.fileName || "", rawCharacter)
      const displayCharacter = dropIfSame(rawCharacter, c.cardTitle || c.name || c.fileName || "", rawSeries)

      return {
        id: c.id,
        name: c.cardTitle || c.name || c.fileName || "Unknown",
        // series: show if meaningful, otherwise empty
        series: displaySeries,
        rarity: c.rarity || "Common",
        category: normalizeRequestCategory(c.category || "anime-collection"),
        price: c.diamondPrice ?? 0,
        image: urls.secureThumbnailUrl,
        // Description: per request, do not use story; also skip generic placeholders
        description: displayCharacter,
        specialAbility: c.specialAbility || null,
        // Powers
        attackPower: c.attackPower ?? null,
        defense: c.defense ?? null,
        speed: c.speed ?? null,
        element: c.element ?? null,
        ...urls,
        // optional debug fields
        thumbnailPath: normalizeImagePath(c.thumbnailUrl || c.imagePath),
        imagePath: normalizeImagePath(c.imagePath),
      }
    })

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    return NextResponse.json({ items, page, pageSize, total, totalPages })
  } catch (err) {
    console.error("GET /api/cards error", err)
    return NextResponse.json({ error: "Failed to load cards" }, { status: 500 })
  }
}
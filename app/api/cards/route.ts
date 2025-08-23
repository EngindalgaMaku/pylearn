import { NextResponse } from "next/server"

// Ensure this API is always dynamic and not statically cached by Next.js
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { prisma } from "@/lib/prisma"
import { generateImageToken } from "@/lib/imageToken"

// Map incoming category to accepted values matching anime-card-manager rules
function normalizeRequestCategory(input: string) {
  const c = (input || "").toLowerCase()
  if (c === "anime") return "anime-collection"
  if (c === "star") return "star-collection"
  if (c === "car") return "car-collection"
  return c || "anime-collection"
}

// Remove timestamp/hash noise from file-derived titles
function sanitizeTitle(input?: string | null): string {
  if (!input) return "";
  let s = String(input);
  // strip upload prefix like 20250822_2110_abcd12_
  s = s.replace(/^\d{6,}[_-][0-9a-f]{4,}[_-]/i, "");
  // normalize separators first
  s = s.replace(/[_-]+/g, " ");
  // remove noisy tokens:
  // - pure long digits or hex (>=4)
  // - any token containing digits with length >= 2
  // - mixed alnum blobs length >= 8 (often hashes like 01k39fepxz...)
  // - isolated timestamps like 20250822 or 2110
  // - uuid-like fragments (groups of 4-8 hex)
  s = s
    .split(/\s+/)
    .filter((tok) => {
      const t = tok.trim();
      if (!t) return false;
      if (/^\d{4,}$/i.test(t)) return false; // numbers 4+
      if (/^[0-9a-f]{4,}$/i.test(t)) return false; // hex 4+
      if (/^[0-9a-z]{8,}$/i.test(t)) return false; // mixed alnum blobs
      if (/[0-9]/.test(t)) return false; // tokens containing digits
      if (/^\d{8}$/.test(t)) return false; // yyyymmdd-like
      if (/^\d{4}$/.test(t)) return false; // short stamp like 2110
      if (/^[0-9a-f]{3,8}$/i.test(t)) return false; // uuid small chunks
      return true;
    })
    .join(" ");
  // collapse spaces
  s = s.replace(/[0-9a-z]{10,}/gi, " ").replace(/\s+/g, " ").trim();
  // normalize repeated category prefix like "Anime Collection Anime Collection"
  s = s.replace(/\b(Anime Collection)\s+\1\b/gi, "$1");
  if (!s) return "Anime Collection";
  return s;
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
        orderBy: [
          { uploadDate: "desc" as const },
          { id: "desc" as const },
        ],
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
      // Build display name: prefer character when meaningful; else sanitized title
      const categoryWords = ["anime collection", "star collection", "car collection"]
      const stripCategoryPrefix = (t: string) => {
        const s = t.trim().replace(/^[-_]+/, "")
        const low = s.toLowerCase()
        for (const w of categoryWords) {
          if (low.startsWith(w + " ")) return s.slice(w.length).trim()
          if (low === w) return ""
        }
        return s
      }
      const baseTitle = sanitizeTitle(c.cardTitle || c.name || c.fileName || "Unknown") || "Unknown"
      const preferredName = displayCharacter && displayCharacter.trim().length > 0 ? displayCharacter : baseTitle
      const displayName = stripCategoryPrefix(preferredName)

      return {
        id: c.id,
        name: displayName || "Unknown",
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
    return NextResponse.json(
      { items, page, pageSize, total, totalPages },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (err) {
    console.error("GET /api/cards error", err)
    return NextResponse.json(
      { error: "Failed to load cards" },
      {
        status: 500,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  }
}
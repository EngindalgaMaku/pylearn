import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { generateImageToken } from "@/lib/imageToken";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Normalize category to shop categories used elsewhere
function normalizeCategory(input?: string | null) {
  const c = (input || "").toLowerCase();
  if (c === "anime") return "anime-collection";
  if (c === "star") return "star-collection";
  if (c === "car") return "car-collection";
  return c || "anime-collection";
}

function buildSecureUrls(cardId: string) {
  const previewTok = generateImageToken(cardId, "preview");
  const fullTok = generateImageToken(cardId, "full");
  const thumbTok = generateImageToken(cardId, "thumbnail");
  return {
    secureThumbnailUrl: `/api/secure-image?cardId=${cardId}&type=thumbnail&token=${thumbTok}`,
    securePreviewUrl: `/api/secure-image?cardId=${cardId}&type=preview&token=${previewTok}`,
    secureFullImageUrl: `/api/secure-image?cardId=${cardId}&type=full&token=${fullTok}`,
  };
}

// Basic rarity weight table for reward grants (percent-like weights)
const DEFAULT_WEIGHTS: Record<string, number> = {
  Common: 65,
  Uncommon: 20,
  Rare: 10,
  SuperRare: 3,
  UltraRare: 1,
  Epic: 0.8,
  Legendary: 0.18,
  Mythic: 0.02,
};

function pickWeighted<R extends string>(weights: Record<R, number>): R {
  const entries = Object.entries(weights) as [R, number][];
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  let roll = Math.random() * total;
  for (const [key, w] of entries) {
    roll -= Math.max(0, w);
    if (roll <= 0) return key;
  }
  return entries[0][0];
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json().catch(() => ({}));
    const category = normalizeCategory(body?.category);
    const sourceGame = String(body?.sourceGame || "unknown-game");

    // Enforce daily limit: max 3 granted cards per user per day (game rewards)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await prisma.cardDistributionLog.count({
      where: {
        userId,
        sourceType: "game-reward" as any,
        createdAt: { gte: startOfDay },
      } as any,
    });
    if (todayCount >= 3) {
      return NextResponse.json(
        { error: "Daily card limit reached. You can earn up to 3 cards per day." },
        { status: 429 }
      );
    }

    // 1) Choose a rarity bucket
    const chosenRarity = pickWeighted(DEFAULT_WEIGHTS);

    // 2) Build owned set to EXCLUDE user's cards from selection
    const owned = await prisma.userCard.findMany({
      where: { userId },
      select: { cardId: true },
    });
    const ownedIds = new Set(owned.map((o) => o.cardId));

    // Map category to accepted values in DB (like in /api/cards)
    const categoryMappings: Record<string, string[]> = {
      "anime-collection": ["anime-collection", "anime"],
      "star-collection": ["star-collection", "star"],
      "car-collection": ["car-collection", "car"],
    };
    const mappedCats = categoryMappings[category] || [category];

    // Helper: pick a random card with a given where filter, excluding owned
    async function pickRandom(where: any) {
      const whereExcluding = {
        ...where,
        id: { notIn: Array.from(ownedIds) },
      } as any;
      const total = await prisma.card.count({ where: whereExcluding } as any);
      if (total <= 0) return null;
      const skip = Math.floor(Math.random() * total);
      const rows = await prisma.card.findMany({
        where: whereExcluding,
        orderBy: { id: "asc" },
        skip,
        take: 1,
      } as any);
      return rows[0] || null;
    }

    // First try: unowned cards in category with the chosen rarity
    let candidate = await pickRandom({
      category: { in: mappedCats },
      rarity: { equals: chosenRarity, mode: "insensitive" as any },
      isPublic: true,
      isPurchasable: true,
    });

    // Fallback: any unowned public card in the category
    if (!candidate) {
      candidate = await pickRandom({
        category: { in: mappedCats },
        isPublic: true,
        isPurchasable: true,
      });
    }

    // Still nothing? The user owns all available cards in this category
    if (!candidate) {
      return NextResponse.json(
        { error: "No new cards available in this category. You already own them all." },
        { status: 409 }
      );
    }

    if (!candidate) {
      return NextResponse.json({ error: "No cards available for rewards" }, { status: 404 });
    }

    // Respect maxOwners if defined
    if (candidate.maxOwners != null && candidate.currentOwners >= candidate.maxOwners) {
      return NextResponse.json({ error: "Card no longer available" }, { status: 409 });
    }

    // Create ownership if not already owned (idempotency)
    let created = null as any;
    try {
      created = await prisma.userCard.create({
        data: {
          userId,
          cardId: candidate.id,
          purchasePrice: 0,
        },
      });
    } catch (e: any) {
      // Unique constraint: already owned; proceed to return
    }

    // Update currentOwners count if we successfully created
    if (created) {
      await prisma.card.update({
        where: { id: candidate.id },
        data: { currentOwners: { increment: 1 } },
      });
      // Log distribution
      try {
        await prisma.cardDistributionLog.create({
          data: {
            userId,
            ruleId: "direct-grant",
            sourceType: "game-reward",
            sourceId: sourceGame,
            cardId: candidate.id,
            rarityReceived: candidate.rarity || "Unknown",
            wasGuaranteed: false,
            attemptNumber: 1,
            rollValue: 0,
            appliedWeights: JSON.stringify(DEFAULT_WEIGHTS),
            modifiersApplied: null,
          },
        } as any);
      } catch {}
    }

    const urls = buildSecureUrls(candidate.id);

    return NextResponse.json({
      card: {
        id: candidate.id,
        name: candidate.cardTitle || candidate.name || candidate.fileName || "Mystery Card",
        rarity: candidate.rarity || "Common",
        category: candidate.category,
        image: urls.secureThumbnailUrl,
        ...urls,
      },
    });
  } catch (err) {
    console.error("POST /api/cards/grant error", err);
    return NextResponse.json({ error: "Failed to grant card" }, { status: 500 });
  }
}

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildWhere(params: URLSearchParams) {
  const difficulty = params.get("difficulty")?.toLowerCase() || undefined;
  const categorySlug = params.get("category") || params.get("categorySlug") || undefined;
  const tag = params.get("tag") || undefined;

  const where: any = {
    isActive: true,
    OR: [
      { publishDate: null },
      { publishDate: { lte: new Date() } },
    ],
  };

  if (difficulty) where.difficulty = difficulty;
  if (categorySlug) where.category = { slug: categorySlug };
  if (tag) where.tags = { contains: tag, mode: "insensitive" };

  return where;
}

// GET /api/python-tips/random - Return a random active Python tip on every request
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildWhere(searchParams);

    // Count total tips matching the filter
    const total = await prisma.pythonTip.count({ where });
    if (total === 0) {
      return NextResponse.json(
        { success: false, error: "No tips available" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Pick a random offset and fetch a single tip
    const offset = Math.floor(Math.random() * total);
    const tips = await prisma.pythonTip.findMany({
      where,
      include: {
        category: true,
        _count: { select: { interactions: true, feedback: true } },
      },
      skip: offset,
      take: 1,
    });

    const tip = tips[0];

    return NextResponse.json(
      { success: true, tip },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Random tip error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch random tip" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
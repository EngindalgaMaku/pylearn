import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/python-tips - Get all tips (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    const isAdmin =
      typeof role === "string" && role.toLowerCase().includes("admin");

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const isActive = searchParams.get("isActive") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (isActive && isActive !== "all") {
      where.isActive = isActive === "active";
    }

    const [tips, total] = await Promise.all([
      prisma.pythonTip.findMany({
        where,
        include: {
          _count: { select: { interactions: true, feedback: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pythonTip.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      tips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tips error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tips" },
      { status: 500 }
    );
  }
}

// POST /api/python-tips - Create new tip (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    const isAdmin =
      typeof role === "string" && role.toLowerCase().includes("admin");

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      codeExample,
      category,
      difficulty,
      xpReward,
      isActive,
    } = body;

    if (!title || !content || !category || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tip = await prisma.pythonTip.create({
      data: {
        title,
        content,
        codeExample: codeExample || null,
        category,
        difficulty: difficulty.toLowerCase(),
        xpReward: parseInt(xpReward) || 10,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, tip });
  } catch (error) {
    console.error("Create tip error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tip" },
      { status: 500 }
    );
  }
}

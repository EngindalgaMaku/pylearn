import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/python-tips/[id] - Get single tip (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tip = await prisma.pythonTip.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { interactions: true, feedback: true } },
      },
    });

    if (!tip) {
      return NextResponse.json(
        { success: false, error: "Tip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, tip });
  } catch (error) {
    console.error("Get tip error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tip" },
      { status: 500 }
    );
  }
}

// PUT /api/python-tips/[id] - Update tip (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tip = await prisma.pythonTip.update({
      where: { id: params.id },
      data: {
        title,
        content,
        codeExample: codeExample || null,
        category,
        difficulty: difficulty.toLowerCase(),
        xpReward: parseInt(xpReward) || 10,
        isActive: isActive !== false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, tip });
  } catch (error) {
    console.error("Update tip error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update tip" },
      { status: 500 }
    );
  }
}

// DELETE /api/python-tips/[id] - Delete tip (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await prisma.pythonTip.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tip error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tip" },
      { status: 500 }
    );
  }
}

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// PATCH /api/python-tips/[id]/toggle - Toggle tip active status (admin only)
export async function PATCH(
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

    const currentTip = await prisma.pythonTip.findUnique({
      where: { id: params.id },
      select: { isActive: true },
    });

    if (!currentTip) {
      return NextResponse.json(
        { success: false, error: "Tip not found" },
        { status: 404 }
      );
    }

    const tip = await prisma.pythonTip.update({
      where: { id: params.id },
      data: {
        isActive: !currentTip.isActive,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, tip });
  } catch (error) {
    console.error("Toggle tip error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle tip status" },
      { status: 500 }
    );
  }
}

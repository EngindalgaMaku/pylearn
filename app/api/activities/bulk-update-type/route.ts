import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  // Check authentication and admin role
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { q, category, typeGroup, newType } = await request.json();

    if (!newType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build activity type group filter (same logic as in page.tsx)
    let typeWhere: Prisma.LearningActivityWhereInput | {} = {};
    switch (typeGroup) {
      case "games":
        typeWhere = {
          OR: [
            { activityType: { contains: "game", mode: Prisma.QueryMode.insensitive } },
            { activityType: { in: ["matching", "memory_game", "drag_drop"], mode: Prisma.QueryMode.default as any } },
          ],
        } as any;
        break;
      case "lessons":
        typeWhere = { activityType: { contains: "lesson", mode: Prisma.QueryMode.insensitive } };
        break;
      case "challenges":
        typeWhere = {
          OR: [
            { activityType: { contains: "challenge", mode: Prisma.QueryMode.insensitive } },
            { activityType: { in: ["quiz"], mode: Prisma.QueryMode.default as any } },
          ],
        } as any;
        break;
      case "learning":
        typeWhere = { activityType: { in: ["interactive_demo", "coding_lab", "code_builder", "data_exploration", "algorithm_visualization"] } } as any;
        break;
      default:
        typeWhere = {};
    }

    // Build where clause
    const where: Prisma.LearningActivityWhereInput | undefined = (q || category || typeGroup)
      ? {
          AND: [
            q
              ? {
                  OR: [
                    { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                    { category: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  ],
                }
              : {},
            category ? { category } : {},
            typeWhere as any,
          ],
        }
      : {};

    // Update activities
    const result = await prisma.learningActivity.updateMany({
      where,
      data: { 
        activityType: newType,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count
    });
  } catch (error) {
    console.error("Error bulk updating activity types:", error);
    return NextResponse.json({ error: "Failed to update activity types" }, { status: 500 });
  }
}

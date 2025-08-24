import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Check authentication and admin role
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, activityType } = await request.json();

    if (!id || !activityType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update the activity type
    const updatedActivity = await prisma.learningActivity.update({
      where: { id },
      data: { 
        activityType,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        activityType: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      activity: updatedActivity 
    });
  } catch (error) {
    console.error("Error updating activity type:", error);
    return NextResponse.json({ error: "Failed to update activity type" }, { status: 500 });
  }
}

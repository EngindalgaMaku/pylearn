import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompleteBody = {
  activityId?: string;
  slug?: string;
  score?: number;
  timeSpent?: number;
  hintsUsed?: number;
  answers?: unknown;
};

/**
 * POST /api/learn/activities/complete
 * Request body:
 *  - activityId?: string
 *  - slug?: string (alternative identifier if id is unknown)
 *  - score?: number (0-100)
 *  - timeSpent?: number (seconds)
 *  - hintsUsed?: number
 *  - answers?: any (free-form JSON)
 *
 * Behavior:
 *  - Requires authentication
 *  - Upserts ActivityAttempt for (userId, activityId) and marks completed=true
 *  - Awards diamonds/XP from LearningActivity on FIRST completion only (idempotent)
 *  - Creates a DiamondTransaction record for audit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = (await request.json()) as CompleteBody | null;
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    let { activityId, slug, score, timeSpent, hintsUsed, answers } = body;

    if (!activityId && !slug) {
      return NextResponse.json(
        { success: false, error: "activityId or slug is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Find the learning activity (by id or slug/id fallback)
    const activity = await prisma.learningActivity.findFirst({
      where: activityId
        ? { id: activityId, isActive: true }
        : {
            isActive: true,
            OR: [{ slug: slug! }, { id: slug! }],
          },
      select: {
        id: true,
        title: true,
        diamondReward: true,
        experienceReward: true,
        activityType: true,
        isLocked: true,
      },
    });

    if (!activity || activity.activityType !== "lesson") {
      return NextResponse.json(
        { success: false, error: "Activity not found or not a lesson" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const aId = activity.id;

    // Existing attempt (composite unique key)
    const existingAttempt = await prisma.activityAttempt.findUnique({
      where: {
        userId_activityId: { userId, activityId: aId },
      },
    });

    const alreadyCompleted = !!existingAttempt?.completed;
    const now = new Date();

    const boundedScore =
      typeof score === "number"
        ? Math.max(0, Math.min(100, Math.round(score)))
        : existingAttempt?.score ?? 0;

    const nextTimeSpent =
      typeof timeSpent === "number"
        ? Math.max(0, Math.floor(timeSpent))
        : existingAttempt?.timeSpent ?? 0;

    const nextHints =
      typeof hintsUsed === "number"
        ? Math.max(0, Math.floor(hintsUsed))
        : existingAttempt?.hintsUsed ?? 0;

    const answersJson =
      answers === undefined || answers === null
        ? existingAttempt?.answers ?? null
        : typeof answers === "string"
        ? answers
        : JSON.stringify(answers);

    const diamonds = activity.diamondReward ?? 0;
    const xp = activity.experienceReward ?? 0;

    const result = await prisma.$transaction(async (tx) => {
      // Create or update attempt (mark completed)
      if (existingAttempt) {
        await tx.activityAttempt.update({
          where: { userId_activityId: { userId, activityId: aId } },
          data: {
            completed: true,
            completedAt: now,
            score: boundedScore,
            timeSpent: nextTimeSpent,
            hintsUsed: nextHints,
            answers: answersJson ?? existingAttempt.answers,
          },
        });
      } else {
        await tx.activityAttempt.create({
          data: {
            userId,
            activityId: aId,
            score: boundedScore,
            timeSpent: nextTimeSpent,
            hintsUsed: nextHints,
            answers: answersJson,
            completed: true,
            startedAt: now,
            completedAt: now,
          },
        });
      }

      // Award rewards only for first completion
      let rewarded = false;
      let userAfter = null as
        | {
            id: string;
            level: number;
            experience: number;
            currentDiamonds: number;
            totalDiamonds: number;
          }
        | null;

      if (!alreadyCompleted) {
        userAfter = await tx.user.update({
          where: { id: userId },
          data: {
            currentDiamonds: { increment: diamonds },
            totalDiamonds: { increment: diamonds },
            experience: { increment: xp },
          },
          select: {
            id: true,
            level: true,
            experience: true,
            currentDiamonds: true,
            totalDiamonds: true,
          },
        });

        // Log diamond transaction (XP is reflected on the user directly)
        if (diamonds > 0) {
          await tx.diamondTransaction.create({
            data: {
              userId,
              amount: diamonds,
              type: "LEARNING_ACTIVITY_COMPLETE",
              description: `${activity.title} completed${
                typeof boundedScore === "number" ? ` - Score: ${boundedScore}%` : ""
              } | +${xp} XP`,
              relatedId: aId,
              relatedType: "learning_activity",
            },
          });
        }

        rewarded = true;
      } else {
        // Snapshot for response if already completed
        userAfter = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            level: true,
            experience: true,
            currentDiamonds: true,
            totalDiamonds: true,
          },
        });
      }

      return { rewarded, userAfter };
    });

    return NextResponse.json(
      {
        success: true,
        activityId: aId,
        alreadyCompleted,
        rewards: {
          diamonds: result.rewarded ? diamonds : 0,
          experience: result.rewarded ? xp : 0,
        },
        user: result.userAfter,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Learn activity complete API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete activity" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
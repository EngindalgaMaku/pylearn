import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateChallengesProgressForEvent } from "@/lib/challengeProgress";
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
 * POST /api/activities/complete
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

    // If the activity doesn't exist, create a minimal quiz activity so attempts can persist
    let aId = activity?.id;
    let activityTitle = activity?.title || slug || "Quiz Activity";
    let diamonds = activity?.diamondReward ?? 10;
    let xp = activity?.experienceReward ?? 25;

    if (!activity && slug) {
      // Create a lightweight LearningActivity to back this quiz
      // Ensures foreign key integrity for ActivityAttempt and real reward persistence
      try {
        const created = await prisma.learningActivity.create({
          data: {
            title: activityTitle,
            slug: slug,
            activityType: "quiz",
            category: "general",
            difficulty: 1,
            diamondReward: diamonds,
            experienceReward: xp,
            content: "Auto-generated quiz activity",
            isActive: true,
            isLocked: false,
          },
          select: {
            id: true,
            title: true,
            diamondReward: true,
            experienceReward: true,
          },
        });
        aId = created.id;
        activityTitle = created.title;
        diamonds = created.diamondReward;
        xp = created.experienceReward;
        console.log(`Created LearningActivity for slug: ${slug} (id=${aId})`);
      } catch (e: any) {
        // If creation fails due to a race/unique constraint, attempt to fetch again
        console.warn("LearningActivity create failed, retrying fetch:", e?.message || e);
        const retry = await prisma.learningActivity.findFirst({
          where: { isActive: true, OR: [{ slug }, { id: slug }] },
          select: {
            id: true,
            title: true,
            diamondReward: true,
            experienceReward: true,
            activityType: true,
            isLocked: true,
          },
        });
        if (!retry) {
          return NextResponse.json(
            { success: false, error: "Failed to initialize activity for completion" },
            { status: 500, headers: { "Cache-Control": "no-store" } }
          );
        }
        aId = retry.id;
        activityTitle = retry.title || activityTitle;
        diamonds = retry.diamondReward ?? diamonds;
        xp = retry.experienceReward ?? xp;
      }
    } else if (activity && activity.activityType !== "lesson" && activity.activityType !== "quiz") {
      // Activity type is not appropriate, but continue anyway
      console.log(`Activity type is not lesson or quiz: ${activity.activityType}, continuing anyway`);
    }

    // If we still don't have an activity id, abort with error (shouldn't happen normally)
    if (!aId) {
      return NextResponse.json(
        { success: false, error: "Activity could not be resolved" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Existing attempt (composite unique key)
    const existingAttempt = aId ? await prisma.activityAttempt.findUnique({
      where: {
        userId_activityId: { userId, activityId: aId },
      },
    }) : null;

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

    const result = await prisma.$transaction(async (tx) => {
      // Create or update attempt (mark completed)
      if (existingAttempt) {
        await tx.activityAttempt.update({
          where: { userId_activityId: { userId, activityId: aId! } },
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
            activityId: aId!,
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
              description: `${activityTitle} completed${
                typeof boundedScore === "number" ? ` - Score: ${boundedScore}%` : ""
              } | +${xp} XP`,
              relatedId: aId!,
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

    // Fire-and-forget: update challenge progress according to activity type and category
    try {
      const act = await prisma.learningActivity.findUnique({ where: { id: aId }, select: { category: true, activityType: true } })
      updateChallengesProgressForEvent({
        kind: "activity_completed",
        userId,
        category: act?.category ?? null,
        activityType: act?.activityType ?? null,
      }).catch(() => {})
    } catch {}

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
    console.error("Activity complete API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete activity" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
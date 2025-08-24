import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toUTCDateOnly(d: Date): string {
  // Return YYYY-MM-DD in UTC to use consistently for daily gating
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameUTCDate(a?: Date | null, b?: Date | null): boolean {
  if (!a || !b) return false;
  return toUTCDateOnly(a) === toUTCDateOnly(b);
}

// GET /api/python-tips/complete -> returns whether today's tip is already completed
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const streak = await prisma.pythonTipStreak.findUnique({ where: { userId } });
    const today = new Date();

    const alreadyCompletedToday = isSameUTCDate(streak?.lastTipDate ?? null, today);

    return NextResponse.json(
      {
        success: true,
        alreadyCompletedToday,
        lastTipDate: streak?.lastTipDate ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Tip status API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// POST /api/python-tips/complete { tipId: string }
// - Idempotent per user per day: grants XP only once per UTC day
// - Updates PythonTipStreak and User totals. Also upserts interaction for the tip.
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

    const body = (await request.json().catch(() => null)) as { tipId?: string } | null;
    const tipId = body?.tipId;
    if (!tipId) {
      return NextResponse.json(
        { success: false, error: "tipId is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Fetch tip for reward value and existence (accept id or slug)
    const tip = await prisma.pythonTip.findFirst({
      where: { isActive: true, OR: [{ id: tipId }, { slug: tipId }] },
      select: { id: true, title: true, xpReward: true, difficulty: true },
    });

    // Allow homepage fallback daily tip (no DB record) to still grant XP
    const isFallbackDaily = !tip && (tipId === "daily-fallback" || tipId.startsWith("daily-"));
    if (!tip && !isFallbackDaily) {
      return NextResponse.json(
        { success: false, error: "Tip not found (id or slug)" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const today = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // Read or initialize streak
      const streak = await tx.pythonTipStreak.findUnique({ where: { userId } });

      const alreadyCompletedToday = isSameUTCDate(streak?.lastTipDate ?? null, today);

      // Upsert interaction only when a real tip exists
      if (tip) {
        await tx.userPythonTipInteraction.upsert({
          where: { userId_tipId: { userId, tipId: tip.id } },
          update: { hasCompleted: true, completedAt: new Date(), updatedAt: new Date() },
          create: {
            userId,
            tipId: tip.id,
            hasCompleted: true,
            completedAt: new Date(),
            hasViewed: true,
            firstViewedAt: new Date(),
          },
        });
      }

      // If already completed today, do not grant rewards; return current user snapshot
      if (alreadyCompletedToday) {
        const userSnap = await tx.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            level: true,
            experience: true,
            currentDiamonds: true,
            totalDiamonds: true,
          },
        });
        return {
          rewarded: false,
          alreadyCompletedToday: true,
          user: userSnap!,
          streak: streak ?? null,
        };
      }

      // Not completed today: compute streak progression
      const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1));
      const continuesStreak = isSameUTCDate(streak?.lastTipDate ?? null, yesterday);

      const nextCurrentStreak = continuesStreak ? (streak?.currentStreak ?? 0) + 1 : 1;
      const nextLongest = Math.max(streak?.longestStreak ?? 0, nextCurrentStreak);

      // Reward: XP only (diamonds 0) for Daily Tip
      const xp = tip ? (typeof tip.xpReward === "number" ? tip.xpReward : 10) : 15; // fallback daily grants 15 XP
      const diamonds = 0;

      const userAfter = await tx.user.update({
        where: { id: userId },
        data: {
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

      const updatedStreak = await (streak
        ? tx.pythonTipStreak.update({
            where: { userId },
            data: {
              lastTipDate: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
              currentStreak: nextCurrentStreak,
              longestStreak: nextLongest,
              totalTipsViewed: (streak.totalTipsViewed ?? 0) + 1,
              totalTipsCompleted: (streak.totalTipsCompleted ?? 0) + 1,
              totalXPEarned: (streak.totalXPEarned ?? 0) + xp,
              updatedAt: new Date(),
            },
          })
        : tx.pythonTipStreak.create({
            data: {
              userId,
              lastTipDate: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())),
              currentStreak: 1,
              longestStreak: 1,
              totalTipsViewed: 1,
              totalTipsCompleted: 1,
              totalXPEarned: xp,
              totalDiamondsEarned: 0,
            },
          }));

      return {
        rewarded: true,
        alreadyCompletedToday: false,
        rewards: { experience: xp, diamonds },
        user: userAfter,
        streak: updatedStreak,
      };
    });

    return NextResponse.json(
      {
        success: true,
        alreadyCompletedToday: result.alreadyCompletedToday === true,
        rewards: result.rewarded ? result.rewards ?? { experience: 0, diamonds: 0 } : { experience: 0, diamonds: 0 },
        user: result.user,
        streak: result.streak,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Daily tip complete API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete daily tip" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

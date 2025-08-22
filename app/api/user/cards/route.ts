import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Returns current user's owned card IDs
export async function GET(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = auth.user.id;

    const owned = await prisma.userCard.findMany({
      where: { userId },
      select: { cardId: true },
    });

    return NextResponse.json({ items: owned.map((o) => o.cardId) });
  } catch (err) {
    console.error("GET /api/user/cards error", err);
    return NextResponse.json({ error: "Failed to load owned cards" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json().catch(() => null);
    const cardId: string | undefined = body?.cardId;
    if (!cardId || typeof cardId !== "string") {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: cardId },
        select: {
          id: true,
          diamondPrice: true,
          isPurchasable: true,
          maxOwners: true,
          currentOwners: true,
          cardTitle: true,
          name: true,
        },
      });
      if (!card) {
        throw new NextResponse(JSON.stringify({ error: "Card not found" }), { status: 404 });
      }
      if (card.isPurchasable === false) {
        throw new NextResponse(JSON.stringify({ error: "This card is not purchasable" }), { status: 400 });
      }
      if (card.maxOwners != null && card.currentOwners >= card.maxOwners) {
        throw new NextResponse(JSON.stringify({ error: "Card is sold out" }), { status: 400 });
      }

      const existing = await tx.userCard.findUnique({
        where: { userId_cardId: { userId, cardId } },
      });
      if (existing) {
        throw new NextResponse(JSON.stringify({ error: "Already owned" }), { status: 409 });
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { currentDiamonds: true },
      });
      if (!user) {
        throw new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404 });
      }

      const price = card.diamondPrice ?? 0;
      if (user.currentDiamonds < price) {
        throw new NextResponse(JSON.stringify({ error: "Insufficient diamonds" }), { status: 400 });
      }

      // Create ownership
      await tx.userCard.create({
        data: {
          userId,
          cardId,
          purchasePrice: price,
        },
      });

      // Deduct diamonds
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          currentDiamonds: { decrement: price },
        },
        select: { currentDiamonds: true },
      });

      // Increment owners
      await tx.card.update({
        where: { id: cardId },
        data: {
          currentOwners: { increment: 1 },
        },
      });

      // Log transaction
      const displayName = card.cardTitle || card.name || "Card";
      await tx.diamondTransaction.create({
        data: {
          userId,
          amount: -price,
          type: "PURCHASE",
          description: `Bought ${displayName}`,
          relatedId: cardId,
          relatedType: "Card",
        },
      });

      return { currentDiamonds: updatedUser.currentDiamonds };
    });

    return NextResponse.json({ success: true, ownedCardId: cardId, currentDiamonds: result.currentDiamonds });
  } catch (err: any) {
    if (err instanceof NextResponse) return err;
    // If thrown with NextResponse above, it's handled. Otherwise log generic.
    console.error("POST /api/cards/purchase error", err);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}

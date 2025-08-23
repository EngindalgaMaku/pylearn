import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function validateUsername(u: string) {
  // letters, numbers, underscore, 3-20 chars
  return /^[a-zA-Z0-9_]{3,20}$/.test(u)
}

export async function POST(req: NextRequest) {
  try {
    const sessionAny: any = await getServerSession(authOptions as any)
    const userId = sessionAny?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { newUsername } = await req.json()
    if (!newUsername || typeof newUsername !== "string") {
      return NextResponse.json({ error: "newUsername is required" }, { status: 400 })
    }
    if (!validateUsername(newUsername)) {
      return NextResponse.json({ error: "Username must be 3-20 chars, letters/numbers/underscore only" }, { status: 400 })
    }

    // Enforce weekly limit via diamond_transactions log with type=username_change
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const lastChange = await prisma.diamondTransaction.findFirst({
      where: { userId, type: "username_change", createdAt: { gt: oneWeekAgo } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })
    if (lastChange) {
      const remainingMs = 7 * 24 * 60 * 60 * 1000 - (Date.now() - lastChange.createdAt.getTime())
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000))
      const nextAllowedAt = new Date(lastChange.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      return NextResponse.json({ error: `Username can only be changed once per week. Try again in ${remainingDays} day(s).`, nextAllowedAt }, { status: 429 })
    }

    // Check uniqueness
    const exists = await prisma.user.findUnique({ where: { username: newUsername }, select: { id: true } })
    if (exists) return NextResponse.json({ error: "Username is already taken" }, { status: 400 })

    // Update and log
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { username: newUsername } })
      await tx.diamondTransaction.create({
        data: {
          userId,
          amount: 0,
          type: "username_change",
          description: `Username changed to ${newUsername}`,
          relatedType: "profile",
        },
      })
    })

    const nextAllowedAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    return NextResponse.json({ success: true, username: newUsername, nextAllowedAt })
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sessionAny: any = await getServerSession(authOptions as any)
    const userId = sessionAny?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const last = await prisma.diamondTransaction.findFirst({
      where: { userId, type: "username_change" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })
    if (!last) return NextResponse.json({ allowed: true, lastChangeAt: null, nextAllowedAt: new Date() })

    const nextAllowedAt = new Date(last.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    const allowed = Date.now() >= nextAllowedAt.getTime()
    return NextResponse.json({ allowed, lastChangeAt: last.createdAt, nextAllowedAt })
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message }, { status: 500 })
  }
}

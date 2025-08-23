import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const sessionAny: any = await getServerSession(authOptions as any)
    const userId = sessionAny?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "currentPassword and newPassword are required" }, { status: 400 })
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Password cannot be changed for this account" }, { status: 400 })
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed } })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message }, { status: 500 })
  }
}

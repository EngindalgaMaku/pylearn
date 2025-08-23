import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token is required" }, { status: 400 })
    }
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } })
    if (!record) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    if (record.expires.getTime() < Date.now()) {
      // Clean up expired token
      await prisma.passwordResetToken.delete({ where: { token } })
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: record.userId }, select: { id: true } })
    if (!user) {
      await prisma.passwordResetToken.delete({ where: { token } })
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash: hashed } })
      // Invalidate existing sessions
      await tx.session.deleteMany({ where: { userId: user.id } })
      // Remove the used token
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } })
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message }, { status: 500 })
  }
}

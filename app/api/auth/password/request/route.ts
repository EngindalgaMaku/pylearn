import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendMail, getAppBaseUrl } from "@/lib/mail"
import { resetPasswordEmailHTML } from "@/lib/emailTemplates"
import crypto from "node:crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 })
    }

    // Try to find the user, but don't reveal whether they exist
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })

    if (user) {
      // Clean previous tokens for this user
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })
      const token = crypto.randomUUID()
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      await prisma.passwordResetToken.create({ data: { userId: user.id, token, expires } })

      const base = getAppBaseUrl()
      const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`
      const html = resetPasswordEmailHTML({
        resetUrl,
        siteName: "PyLearn",
        slogan: "Learn Python. Play. Progress.",
        // logoUrl defaults to `${base}/brand-snake.svg` inside the template
        supportEmail: process.env.CONTACT_TO || "info@pylearn.net",
      })
      // Send email but don't fail the request even if SMTP errors out
      try {
        await sendMail({ to: user.email, subject: "Reset your PyLearn password", html })
      } catch (err) {
        console.warn("password reset email send failed", err)
      }
    }

    // Always respond with success to avoid user enumeration
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    // Do not expose internal errors; return a generic success to avoid user enumeration
    console.warn("password reset request error", e?.message)
    return NextResponse.json({ ok: true })
  }
}

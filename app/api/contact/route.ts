import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"

export const runtime = "nodejs"

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
  // Simple honeypot
  website: z.string().optional().default("")
})

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => null)
    const parsed = schema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
    }
    const { firstName, lastName, email, subject, message, website } = parsed.data

    // Honeypot: if filled, ignore
    if (website && website.trim().length > 0) {
      return NextResponse.json({ success: true })
    }

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      console.error("SMTP env vars missing")
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const to = process.env.CONTACT_TO || "info@pylearn.net"
    const from = process.env.CONTACT_FROM || `PyLearn <${user}>`

    const text = `New contact form submission\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`

    await transporter.sendMail({
      to,
      from,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      text,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

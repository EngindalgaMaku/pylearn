import "server-only"
import nodemailer from "nodemailer"
import { welcomeEmailHTML } from "./emailTemplates"

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
// Prefer explicit SMTP_FROM, else CONTACT_FROM, else EMAIL_FROM
const SMTP_FROM = process.env.SMTP_FROM || process.env.CONTACT_FROM || process.env.EMAIL_FROM

export function getAppBaseUrl() {
  // Prefer NEXTAUTH_URL if set, else VERCEL_URL, else APP_URL
  const fromEnv = process.env.NEXTAUTH_URL || process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  return fromEnv || "http://localhost:3000"
}

export async function sendWelcomeEmailSafe(opts: {
  to: string
  userName?: string
  siteName?: string
  dashboardUrl?: string
}) {
  try {
    const html = welcomeEmailHTML({
      userName: opts.userName,
      siteName: opts.siteName,
      dashboardUrl: opts.dashboardUrl,
    })
    await sendMail({
      to: opts.to,
      subject: `Welcome to ${opts.siteName || "PyLearn"}!`,
      html,
    })
    return { ok: true }
  } catch (err) {
    console.warn("Welcome email failed to send (swallowed)", err)
    return { ok: false, error: String(err) }
  }
}

export async function sendMail(options: { to: string; subject: string; html: string; text?: string }) {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.warn("SMTP env vars are not fully configured. Skipping email send.")
    return { skipped: true }
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for others
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  await transporter.sendMail({
    from: SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })

  return { ok: true }
}

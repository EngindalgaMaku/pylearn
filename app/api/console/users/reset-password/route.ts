import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendMail, getAppBaseUrl } from "@/lib/mail";
import { resetPasswordEmailHTML } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await (prisma as any).passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  });

  const base = getAppBaseUrl();
  const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: user.email,
    subject: "Reset your password",
    html: resetPasswordEmailHTML({ resetUrl }),
  });

  return NextResponse.json({ ok: true });
}

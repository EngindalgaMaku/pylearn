import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getAppBaseUrl, sendWelcomeEmailSafe } from "@/lib/mail";

function isValidEmail(email: string) {
  // Simple email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const email: string = body?.email?.trim();
    const password: string = body?.password;
    let username: string | undefined = body?.username?.trim();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check existing by email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    // Derive username if missing and ensure uniqueness
    if (!username || username.length < 3) {
      const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/gi, "_");
      username = base || "user";
    }
    let finalUsername = username;
    let counter = 1;
    while (
      await prisma.user.findUnique({
        where: { username: finalUsername },
        select: { id: true },
      })
    ) {
      finalUsername = `${username}_${counter++}`;
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with initial gamification defaults
    const user = await prisma.user.create({
      data: {
        email,
        username: finalUsername,
        passwordHash,
        currentDiamonds: 100,
        totalDiamonds: 100,
        loginStreak: 0,
        maxLoginStreak: 0,
        isActive: true,
        role: "user",
        level: 1,
        experience: 0,
        isPremium: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    // Fire-and-forget welcome email (do not block or fail registration)
    try {
      const baseUrl = getAppBaseUrl();
      void sendWelcomeEmailSafe({
        to: user.email,
        userName: user.username,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME || "PyLearn",
        dashboardUrl: `${baseUrl}/dashboard`,
      }).catch((e) => console.warn("Welcome email send error (register route)", e));
    } catch (e) {
      console.warn("Failed to trigger welcome email (swallowed)", e);
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
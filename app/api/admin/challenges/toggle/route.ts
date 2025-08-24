import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    const role = (session?.user as any)?.role as string | undefined;
    const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || (await req.formData()).get("id")?.toString();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const item = await prisma.weeklyChallenge.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.weeklyChallenge.update({ where: { id }, data: { isActive: !item.isActive } });
    return NextResponse.redirect(new URL("/console/challenges", req.url));
  } catch (e: any) {
    console.error("/api/admin/challenges/toggle POST error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}




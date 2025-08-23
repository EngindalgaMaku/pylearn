import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, role: newRole, isActive } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const data: any = {};
  if (typeof newRole === "string") data.role = newRole;
  if (typeof isActive === "boolean") data.isActive = isActive;

  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true, user });
}

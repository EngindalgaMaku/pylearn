import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any
  const role = (session?.user as any)?.role as string | undefined
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin")
  if (!isAdmin) return new NextResponse("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || ""
  const scope = searchParams.get("scope") || ""
  const category = searchParams.get("category") || ""
  const from = searchParams.get("from") || ""
  const to = searchParams.get("to") || ""

  const whereProgress: any = {}
  if (from) whereProgress.AND = [...(whereProgress.AND || []), { lastProgressAt: { gte: new Date(from) } }]
  if (to) whereProgress.AND = [...(whereProgress.AND || []), { lastProgressAt: { lte: new Date(to) } }]

  const rows = await prisma.userChallengeProgress.findMany({
    where: whereProgress,
    include: { user: true, challenge: true },
    orderBy: { lastProgressAt: "desc" },
    take: 5000,
  })

  const csv: string[] = []
  csv.push(["user", "email", "challenge", "type", "requirements", "current", "target", "updated"].join(","))
  for (const r of rows) {
    const req = (() => {
      try {
        return typeof (r.challenge as any).requirements === "string" ? JSON.parse((r.challenge as any).requirements) : (r.challenge as any).requirements
      } catch {
        return null
      }
    })()
    const t = (req?.type as string) || r.challenge.challengeType || ""
    const sc = (req?.scope as string) || (t === "games_session" ? "game" : "any")
    const cat = (req?.category as string) || ""

    if (type && t !== type) continue
    if (scope && sc !== scope) continue
    if (category && cat.toLowerCase().indexOf(category.toLowerCase()) === -1) continue

    csv.push([
      (r.user.username || r.user.email || "").replaceAll(",", " "),
      (r.user.email || "").replaceAll(",", " "),
      (r.challenge.title || "").replaceAll(",", " "),
      t,
      JSON.stringify(req || {}),
      String(r.currentValue),
      String(r.challenge.targetValue),
      new Date(r.lastProgressAt).toISOString(),
    ].join(","))
  }

  const blob = csv.join("\n")
  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=progress_log.csv`,
    },
  })
}




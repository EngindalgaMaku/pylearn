import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function DailyChallengesPage({ searchParams }: { searchParams?: any }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role as string | undefined
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin")
  if (!isAdmin) redirect("/")

  const spRaw: any = typeof (searchParams as any)?.then === "function" ? await (searchParams as any) : (searchParams ?? {})
  const sp = spRaw instanceof URLSearchParams ? spRaw : new URLSearchParams(spRaw as Record<string, string>)
  const getParam = (k: string, d = "") => {
    const v = sp.get(k)
    return typeof v === "string" && v.length > 0 ? v : d
  }

  const page = Math.max(1, Number(getParam("page", "1")))
  const size = Math.min(100, Math.max(5, Number(getParam("size", "20"))))
  const skip = (page - 1) * size

  // Today's runtime daily preview (idempotently ensure DB row exists)
  function startOfDay(date = new Date()) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }
  function endOfDay(date = new Date()) {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }
  const games = [
    { key: "syntax-puzzle", title: "Syntax Puzzle Daily", description: "Solve 5 syntax puzzles in under 10 minutes", path: "/games/syntax-puzzle", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
    { key: "code-match", title: "Code Match Daily", description: "Match code to output — 5 rounds", path: "/games/code-match", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
    { key: "variable-naming", title: "Variable Naming Daily", description: "Name variables correctly 5 times", path: "/games/variable-naming", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
    { key: "data-types", title: "Data Types Daily", description: "Identify correct Python data types — 5 questions", path: "/games/data-types", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
    { key: "loop-runner", title: "Loop Runner Daily", description: "Predict loop outputs — 5 rounds", path: "/games/loop-runner", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
    { key: "function-calls", title: "Function Calls Daily", description: "Predict function call outputs — 5 rounds", path: "/games/function-calls", baseXP: 25, baseDiamonds: 15, difficulty: 1 },
  ] as const
  const idx = new Date().getDate() % games.length
  const pick = games[idx]
  const requirement = { type: "game_session", target: 5, timeLimitSec: 600 }
  const todayStart = startOfDay()
  const todayEnd = endOfDay()
  const existingToday = await prisma.dailyMiniQuiz.findFirst({ where: { date: { gte: todayStart, lte: todayEnd }, title: pick.title } })
  if (!existingToday) {
    try {
      await prisma.dailyMiniQuiz.create({
        data: {
          date: todayStart,
          questions: JSON.stringify({ gameKey: pick.key, requirement }),
          difficulty: pick.difficulty,
          category: "games",
          diamondReward: pick.baseDiamonds,
          experienceReward: pick.baseXP,
          title: pick.title,
          isActive: true,
          description: pick.description,
        },
      })
    } catch {}
  }

  const [total, items] = await Promise.all([
    prisma.dailyMiniQuiz.count(),
    prisma.dailyMiniQuiz.findMany({ orderBy: { date: "desc" }, skip, take: size }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / size))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Daily Challenges</h1>

      {/* Today's runtime daily preview */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-violet-600/90 via-fuchsia-600/90 to-pink-600/90 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Today's Daily</div>
            <div className="text-xs opacity-90">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <div className="p-4 grid gap-2 text-sm">
          <div className="font-medium">{pick.title}</div>
          <div className="text-muted-foreground">{pick.description}</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center rounded-full border px-2 py-0.5">difficulty: {pick.difficulty}</span>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5">XP: {pick.baseXP}</span>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5">Diamonds: {pick.baseDiamonds}</span>
            <span className="inline-flex items-center rounded-full border px-2 py-0.5">path: {pick.path}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-fuchsia-600/90 via-pink-600/90 to-rose-600/90 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Daily Mini Quizzes</div>
            <div className="text-xs opacity-90">{total.toString()} total</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-3 w-[40px] font-semibold">#</th>
              <th className="text-left px-3 py-3 font-semibold">Date</th>
              <th className="text-left px-3 py-3 font-semibold">Title</th>
              <th className="text-left px-3 py-3 font-semibold">Difficulty</th>
              <th className="text-left px-3 py-3 font-semibold">XP</th>
              <th className="text-left px-3 py-3 font-semibold">Diamonds</th>
              <th className="text-left px-3 py-3 font-semibold">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d, idx) => (
              <tr key={d.id} className={idx % 2 ? "bg-muted/20" : "bg-white hover:bg-muted/10 transition-colors"}>
                <td className="px-3 py-2">{(skip + idx + 1).toString()}</td>
                <td className="px-3 py-2">{new Date(d.date).toLocaleDateString()}</td>
                <td className="px-3 py-2">{d.title}</td>
                <td className="px-3 py-2">{d.difficulty}</td>
                <td className="px-3 py-2">{d.experienceReward}</td>
                <td className="px-3 py-2">{d.diamondReward}</td>
                <td className="px-3 py-2">{d.isActive ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          Showing {(skip + 1).toString()}-{Math.min(skip + size, total).toString()} of {total.toString()}
        </div>
        <div className="flex items-center gap-2">
          <a className="rounded border px-2 py-1" href={`?page=${Math.max(1, page - 1)}&size=${size}`}>Prev</a>
          <span>Page {page.toString()} / {totalPages.toString()}</span>
          <a className="rounded border px-2 py-1" href={`?page=${Math.min(totalPages, page + 1)}&size=${size}`}>Next</a>
        </div>
      </div>
    </div>
  )
}



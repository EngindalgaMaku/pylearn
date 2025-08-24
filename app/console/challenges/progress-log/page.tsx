import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ChallengeProgressLogPage({ searchParams }: { searchParams?: any }) {
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
  const size = Math.min(100, Math.max(5, Number(getParam("size", "25"))))
  const q = getParam("q", "")
  const type = getParam("type", "") // complete_activities | games_session | quiz_correct
  const scope = getParam("scope", "") // lesson | quiz | interactive | any
  const category = getParam("category", "")
  const from = getParam("from", "")
  const to = getParam("to", "")

  const skip = (page - 1) * size

  // We don't have an explicit progress log table; reconstruct from user_challenge_progress last updates, joined with challenge and user
  const whereChallenge: any = {}
  if (type) whereChallenge.AND = [...(whereChallenge.AND || []), { requirements: { contains: type } }]
  if (category) whereChallenge.AND = [...(whereChallenge.AND || []), { category: { contains: category, mode: "insensitive" } }]

  const whereProgress: any = {}
  if (from) whereProgress.AND = [...(whereProgress.AND || []), { lastProgressAt: { gte: new Date(from) } }]
  if (to) whereProgress.AND = [...(whereProgress.AND || []), { lastProgressAt: { lte: new Date(to) } }]

  const [total, rows] = await Promise.all([
    prisma.userChallengeProgress.count({ where: whereProgress }),
    prisma.userChallengeProgress.findMany({
      where: whereProgress,
      include: { user: true, challenge: { include: { } } },
      orderBy: { lastProgressAt: "desc" },
      skip,
      take: size,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / size))
  const makeHref = (params: Record<string, string | number>) => {
    const usp = new URLSearchParams({ q, size: String(size), page: String(page) })
    Object.entries(params).forEach(([k, v]) => usp.set(k, String(v)))
    return `?${usp.toString()}`
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-muted-foreground">Total Progress Records</div>
          <div className="text-2xl font-semibold">{total.toString()}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-muted-foreground">Page Size</div>
          <div className="text-2xl font-semibold">{size.toString()}</div>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <div className="text-xs text-muted-foreground">Current Page</div>
          <div className="text-2xl font-semibold">{page.toString()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Challenge Progress Log</h1>
        <form method="get" className="flex items-center gap-2 flex-wrap">
          <input name="q" defaultValue={q} placeholder="Search (user/challenge)" className="h-9 w-60 rounded border px-3" />
          <select name="type" defaultValue={type} className="h-9 rounded border px-2">
            <option value="">Any type</option>
            <option value="complete_activities">complete_activities</option>
            <option value="games_session">games_session</option>
            <option value="quiz_correct">quiz_correct</option>
          </select>
          <select name="scope" defaultValue={scope} className="h-9 rounded border px-2">
            <option value="">Any scope</option>
            <option value="lesson">lesson</option>
            <option value="quiz">quiz</option>
            <option value="interactive">interactive</option>
          </select>
          <input name="category" defaultValue={category} placeholder="Category" className="h-9 w-40 rounded border px-3" />
          <input type="date" name="from" defaultValue={from} className="h-9 rounded border px-2" />
          <input type="date" name="to" defaultValue={to} className="h-9 rounded border px-2" />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="size" value={String(size)} />
          <button type="submit" className="h-9 rounded border px-3">Filter</button>
          <a href={`/api/admin/challenges/progress/export?type=${encodeURIComponent(type)}&scope=${encodeURIComponent(scope)}&category=${encodeURIComponent(category)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`} className="h-9 rounded border px-3">Export CSV</a>
        </form>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-sky-600/90 via-blue-600/90 to-indigo-600/90 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Latest Updates</div>
            <div className="text-xs opacity-90">{total.toString()} records</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-3 w-[40px] font-semibold">#</th>
              <th className="text-left px-3 py-3 font-semibold">User</th>
              <th className="text-left px-3 py-3 font-semibold">Challenge</th>
              <th className="text-left px-3 py-3 font-semibold">Progress</th>
              <th className="text-left px-3 py-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} className={idx % 2 ? "bg-muted/20" : "bg-white hover:bg-muted/10 transition-colors"}>
                <td className="px-3 py-2">{(skip + idx + 1).toString()}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.user.username ?? r.user.email}</div>
                  <div className="text-xs text-muted-foreground">{r.user.email}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{r.challenge.title}</div>
                  <div className="text-xs text-muted-foreground">{r.challenge.challengeType}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="w-40 h-2 bg-muted rounded">
                    <div
                      className="h-2 bg-sky-500 rounded"
                      style={{ width: `${Math.min(100, Math.round((r.currentValue / Math.max(1, r.challenge.targetValue)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.currentValue}/{r.challenge.targetValue}
                  </div>
                </td>
                <td className="px-3 py-2">{new Date(r.lastProgressAt).toLocaleString()}</td>
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
          <a className="rounded border px-2 py-1" href={makeHref({ page: Math.max(1, page - 1) })}>Prev</a>
          <span>Page {page.toString()} / {totalPages.toString()}</span>
          <a className="rounded border px-2 py-1" href={makeHref({ page: Math.min(totalPages, page + 1) })}>Next</a>
        </div>
      </div>
    </div>
  )
}



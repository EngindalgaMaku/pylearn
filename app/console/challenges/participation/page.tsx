import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChallengeParticipationPage({ searchParams }: { searchParams?: any }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) redirect("/");

  const spRaw: any = typeof (searchParams as any)?.then === "function" ? await (searchParams as any) : (searchParams ?? {});
  const sp = spRaw instanceof URLSearchParams ? spRaw : new URLSearchParams(spRaw as Record<string, string>);
  const getParam = (k: string, def = "") => {
    const v = sp.get(k);
    return typeof v === "string" && v.length > 0 ? v : def;
  };

  const page = Math.max(1, Number(getParam("page", "1")));
  const size = Math.min(100, Math.max(5, Number(getParam("size", "25"))));
  const q = getParam("q", "");
  const sort = getParam("sort", "completedAt");
  const dir = getParam("dir", "desc");

  const where: any = q
    ? {
        OR: [
          { user: { username: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { challenge: { title: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const orderBy: any = { [sort]: dir === "asc" ? "asc" : "desc" };
  const skip = (page - 1) * size;

  const [total, rows] = await Promise.all([
    prisma.userChallengeProgress.count({ where }),
    prisma.userChallengeProgress.findMany({
      where,
      include: { user: true, challenge: true },
      orderBy,
      skip,
      take: size,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / size));

  const makeHref = (params: Record<string, string | number>) => {
    const usp = new URLSearchParams({ q, sort, dir, size: String(size), page: String(page) });
    Object.entries(params).forEach(([k, v]) => usp.set(k, String(v)));
    return `?${usp.toString()}`;
  };

  const th = (label: string, key: string) => (
    <th className="text-left px-3 py-2">
      <a
        className="inline-flex items-center gap-1 hover:underline"
        href={makeHref({ sort: key, dir: sort === key && dir === "asc" ? "desc" : "asc", page: 1 })}
      >
        {label} {sort === key ? (dir === "asc" ? "▲" : "▼") : ""}
      </a>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Challenge Participation</h1>
        <form method="get" className="flex items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by user or challenge..."
            className="h-9 w-72 rounded border px-3"
          />
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="size" value={String(size)} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
          <button type="submit" className="h-9 rounded border px-3">Search</button>
        </form>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-cyan-600/90 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Challenge Participation</div>
            <div className="text-xs opacity-90">{total.toString()} records</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-3 w-[40px] font-semibold">#</th>
              {th("User", "userId")}
              {th("Challenge", "challengeId")}
              {th("Scope", "challenge.requirements")}
              {th("Progress", "currentValue")}
              {th("Target", "challenge.targetValue")}
              {th("Completed", "isCompleted")}
              {th("Claimed", "rewardsClaimed")}
              {th("XP", "challenge.experienceReward")}
              {th("Diamonds", "challenge.diamondReward")}
              {th("Updated", "lastProgressAt")}
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
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {(() => {
                    try {
                      const req = typeof (r.challenge as any).requirements === 'string' ? JSON.parse((r.challenge as any).requirements) : (r.challenge as any).requirements
                      const scope = req?.scope || (req?.type === 'games_session' ? 'game' : 'any')
                      const cat = req?.category ? ` • ${req.category}` : ''
                      return `${req?.type || 'n/a'} • ${scope}${cat}`
                    } catch {
                      return 'n/a'
                    }
                  })()}
                </td>
                <td className="px-3 py-2">
                  <div className="w-40 h-2 bg-muted rounded">
                    <div
                      className="h-2 bg-emerald-500 rounded"
                      style={{ width: `${Math.min(100, Math.round((r.currentValue / Math.max(1, r.challenge.targetValue)) * 100))}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.currentValue}/{r.challenge.targetValue}
                  </div>
                </td>
                <td className="px-3 py-2">{r.challenge.targetValue}</td>
                <td className="px-3 py-2">{r.isCompleted ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{r.rewardsClaimed ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{r.challenge.experienceReward}</td>
                <td className="px-3 py-2">{r.challenge.diamondReward}</td>
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
          <span>
            Page {page.toString()} / {totalPages.toString()}
          </span>
          <a className="rounded border px-2 py-1" href={makeHref({ page: Math.min(totalPages, page + 1) })}>Next</a>
        </div>
      </div>
    </div>
  );
}



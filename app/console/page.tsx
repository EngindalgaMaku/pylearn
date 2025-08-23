import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ConsolePage({ searchParams }: { searchParams?: any }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) {
    redirect("/");
  }

  // Normalize Next.js dynamic searchParams: it may be a Promise<URLSearchParams> in newer versions
  const spRaw: any = typeof (searchParams as any)?.then === "function" ? await (searchParams as any) : (searchParams ?? {});
  const sp = spRaw instanceof URLSearchParams ? spRaw : new URLSearchParams(spRaw as Record<string, string>);
  const getParam = (k: string, def = "") => {
    const v = sp.get(k);
    return typeof v === "string" && v.length > 0 ? v : def;
  };
  // Per-section pagination
  const aPage = Math.max(1, Number(getParam("aPage", "1")));
  const aSize = Math.min(50, Math.max(3, Number(getParam("aSize", "5"))));
  const uPage = Math.max(1, Number(getParam("uPage", "1")));
  const uSize = Math.min(50, Math.max(3, Number(getParam("uSize", "5"))));
  const rPage = Math.max(1, Number(getParam("rPage", "1")));
  const rSize = Math.min(100, Math.max(5, Number(getParam("rSize", "10"))));

  const [userCount, activityCount, attemptCount] = await Promise.all([
    prisma.user.count(),
    prisma.learningActivity.count(),
    prisma.activityAttempt.count(),
  ]);

  // Top activities by attempts (paginated)
  const aSkip = (aPage - 1) * aSize;
  const grouped = await prisma.activityAttempt.groupBy({
    by: ["activityId"],
    _count: { activityId: true },
    orderBy: { _count: { activityId: "desc" } },
    skip: aSkip,
    take: aSize,
  });
  const aIds = grouped.map((g) => g.activityId);
  const aEntities = aIds.length
    ? await prisma.learningActivity.findMany({
        where: { id: { in: aIds } },
        select: { id: true, title: true, category: true, difficulty: true, createdAt: true, activityType: true },
      })
    : [];
  const aMap = new Map(aEntities.map((e) => [e.id, e]));
  const topActivities = grouped.map((g) => ({
    count: g._count.activityId,
    activity: aMap.get(g.activityId),
  }));
  const totalTopActivities = (await prisma.activityAttempt.findMany({ distinct: ["activityId"], select: { activityId: true } })).length;
  const aTotalPages = Math.max(1, Math.ceil(totalTopActivities / aSize));

  // Recent signups (paginated)
  const uSkip = (uPage - 1) * uSize;
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: uSkip,
    take: uSize,
    select: { id: true, email: true, username: true, createdAt: true, role: true, isActive: true },
  });
  const uTotalPages = Math.max(1, Math.ceil(userCount / uSize));

  // Recent activity attempts (paginated)
  const rSkip = (rPage - 1) * rSize;
  const recentAttempts = await prisma.activityAttempt.findMany({
    orderBy: { startedAt: "desc" },
    skip: rSkip,
    take: rSize,
    include: { user: true, activity: true },
  });
  const rTotalPages = Math.max(1, Math.ceil(attemptCount / rSize));

  function buildHref(nextParams: Record<string, string | number>) {
    const params = new URLSearchParams();
    // keep existing
    const keys = ["aPage","aSize","uPage","uSize","rPage","rSize"] as const;
    for (const k of keys) {
      const v = getParam(k);
      if (v) params.set(k, v);
    }
    for (const [k,v] of Object.entries(nextParams)) params.set(k, String(v));
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  function typeLabel(t?: string | null) {
    if (!t) return "";
    return t.toLowerCase() === "lesson" ? "lesson" : t.charAt(0).toUpperCase() + t.slice(1);
  }
  function typeBadgeClass(t?: string | null) {
    const key = (t ?? "").toLowerCase();
    switch (key) {
      case "lesson":
        return "bg-amber-500 text-white";
      case "game":
        return "bg-indigo-600 text-white";
      case "quiz":
        return "bg-emerald-600 text-white";
      case "challenge":
        return "bg-rose-600 text-white";
      default:
        return "bg-slate-600 text-white";
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-work-sans)]">Control Center</h1>
          <p className="text-muted-foreground text-sm">Operational overview of users and activities</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Users</CardTitle>
              <CardDescription>Total registered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activities</CardTitle>
              <CardDescription>Active learning items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activityCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attempts</CardTitle>
              <CardDescription>Total attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attemptCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Activities + Recent Signups side-by-side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="rounded-t-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow">
            <CardTitle className="text-base">Top Activities</CardTitle>
            <CardDescription className="text-white/80">Most attempted activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topActivities.length === 0 && <div className="text-sm text-muted-foreground">No activity attempts yet.</div>}
            {topActivities.map((row, idx) => (
              <div key={(row.activity?.id ?? `row-${idx}`)} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{row.activity?.title || "(deleted activity)"}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {row.activity?.category && (
                      <Badge variant="outline" className="text-xs">{row.activity.category}</Badge>
                    )}
                    {row.activity?.activityType && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${typeBadgeClass(row.activity.activityType)}`}>
                        {typeLabel(row.activity.activityType)}
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">Difficulty {row.activity?.difficulty ?? "-"}</span>
                  </div>
                </div>
                <div className="text-xs inline-flex items-center gap-2">
                  <Badge variant="default">{row.count} attempts</Badge>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">Page {aPage} of {aTotalPages}</div>
              <div className="flex items-center gap-2">
                <a aria-disabled={aPage <= 1} className={`px-3 py-1 rounded border text-sm ${aPage <= 1 ? "pointer-events-none opacity-50" : ""}`} href={buildHref({ aPage: Math.max(1, aPage - 1) })}>Prev</a>
                <a aria-disabled={aPage >= aTotalPages} className={`px-3 py-1 rounded border text-sm ${aPage >= aTotalPages ? "pointer-events-none opacity-50" : ""}`} href={buildHref({ aPage: Math.min(aTotalPages, aPage + 1) })}>Next</a>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Recent Signups */}
        <Card>
          <CardHeader className="rounded-t-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow">
            <CardTitle className="text-base">Recent Signups</CardTitle>
            <CardDescription className="text-white/80">Latest registered users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentUsers.length === 0 && <div className="text-sm text-muted-foreground">No users yet.</div>}
            {recentUsers.map((u) => (
              <div key={u.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{u.username || u.email}</div>
                  <div className="text-muted-foreground text-xs">{u.email} • {u.role} • {u.isActive ? "Active" : "Inactive"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">Page {uPage} of {uTotalPages}</div>
              <div className="flex items-center gap-2">
                <a aria-disabled={uPage <= 1} className={`px-3 py-1 rounded border text-sm ${uPage <= 1 ? "pointer-events-none opacity-50" : ""}`} href={buildHref({ uPage: Math.max(1, uPage - 1) })}>Prev</a>
                <a aria-disabled={uPage >= uTotalPages} className={`px-3 py-1 rounded border text-sm ${uPage >= uTotalPages ? "pointer-events-none opacity-50" : ""}`} href={buildHref({ uPage: Math.min(uTotalPages, uPage + 1) })}>Next</a>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        {/* Activity monitoring */}
        <Card>
          <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white shadow">
            <CardTitle className="text-base">Recent Activity Attempts</CardTitle>
            <CardDescription className="text-white/80">Latest attempts with status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.length === 0 && (
              <div className="text-sm text-muted-foreground">No attempts found.</div>
            )}
            {recentAttempts.map((a) => (
              <div key={a.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{a.user?.username || a.user?.email}</div>
                  <div className="text-muted-foreground text-xs">{a.activity?.title} • Score {a.score}/{a.maxScore} • {a.completed ? "Completed" : "In progress"}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {a.activity?.category && (
                      <Badge variant="outline" className="text-[11px]">{a.activity.category}</Badge>
                    )}
                    {a.activity?.activityType && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${typeBadgeClass(a.activity.activityType)}`}>
                        {typeLabel(a.activity.activityType)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(a.startedAt).toLocaleString()}</div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">Page {rPage} of {rTotalPages}</div>
              <div className="flex items-center gap-2">
                <a aria-disabled={rPage <= 1} className={`px-3 py-1 rounded border text-sm ${rPage <= 1 ? "pointer-events-none opacity-50" : ""}`} href={buildHref({ rPage: Math.max(1, rPage - 1) })}>Prev</a>
                <a aria-disabled={rPage >= rTotalPages} className={`px-3 py-1 rounded border text-sm ${rPage >= rTotalPages ? "pointer-events-none opacity-50" : ""}`} href={buildHref({ rPage: Math.min(rTotalPages, rPage + 1) })}>Next</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

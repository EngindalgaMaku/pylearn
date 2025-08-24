import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, TrendingUp, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsolePage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin =
    typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) {
    redirect("/");
  }

  // Normalize Next.js dynamic searchParams: it may be a Promise<URLSearchParams> in newer versions
  const spRaw: any =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as any)
      : searchParams ?? {};
  const sp =
    spRaw instanceof URLSearchParams
      ? spRaw
      : new URLSearchParams(spRaw as Record<string, string>);
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
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          createdAt: true,
          activityType: true,
        },
      })
    : [];
  const aMap = new Map(aEntities.map((e) => [e.id, e]));
  const topActivities = grouped.map((g) => ({
    count: g._count.activityId,
    activity: aMap.get(g.activityId),
  }));
  const totalTopActivities = (
    await prisma.activityAttempt.findMany({
      distinct: ["activityId"],
      select: { activityId: true },
    })
  ).length;
  const aTotalPages = Math.max(1, Math.ceil(totalTopActivities / aSize));

  // Recent signups (paginated)
  const uSkip = (uPage - 1) * uSize;
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: uSkip,
    take: uSize,
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      role: true,
      isActive: true,
    },
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
    const keys = [
      "aPage",
      "aSize",
      "uPage",
      "uSize",
      "rPage",
      "rSize",
    ] as const;
    for (const k of keys) {
      const v = getParam(k);
      if (v) params.set(k, v);
    }
    for (const [k, v] of Object.entries(nextParams)) params.set(k, String(v));
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  function typeLabel(t?: string | null) {
    if (!t) return "";
    return t.toLowerCase() === "lesson"
      ? "lesson"
      : t.charAt(0).toUpperCase() + t.slice(1);
  }
  function typeBadgeClass(t?: string | null) {
    const key = (t ?? "").toLowerCase();
    switch (key) {
      case "lesson":
        return "bg-blue-500 text-white";
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
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <div className="text-3xl font-bold mt-2">
                  {userCount.toLocaleString()}
                </div>
                <p className="text-blue-100 text-xs mt-1">
                  Registered learners
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  Active Learning
                </p>
                <div className="text-3xl font-bold mt-2">
                  {activityCount.toLocaleString()}
                </div>
                <p className="text-emerald-100 text-xs mt-1">
                  Total activities
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Total Attempts
                </p>
                <div className="text-3xl font-bold mt-2">
                  {attemptCount.toLocaleString()}
                </div>
                <p className="text-purple-100 text-xs mt-1">
                  Learning sessions
                </p>
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Activities + Recent Signups side-by-side on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-sm border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100">
          <CardHeader className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 border-b border-blue-200 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">
                  Top Activities
                </CardTitle>
                <CardDescription>
                  Most attempted learning content
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {topActivities.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No activity attempts yet</p>
                </div>
              )}
              {topActivities.map((row, idx) => (
                <div
                  key={row.activity?.id ?? `row-${idx}`}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 mb-2">
                      {row.activity?.title || "(deleted activity)"}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.activity?.category && (
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-200"
                        >
                          {row.activity.category}
                        </Badge>
                      )}
                      {row.activity?.activityType && (
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${typeBadgeClass(
                            row.activity.activityType
                          )}`}
                        >
                          {typeLabel(row.activity.activityType)}
                        </span>
                      )}
                      <span className="text-slate-500 text-xs">
                        Level {row.activity?.difficulty ?? "-"}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-slate-900">
                        {row.count}
                      </div>
                      <div className="text-xs text-slate-500">attempts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {topActivities.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  Page {aPage} of {aTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={buildHref({ aPage: Math.max(1, aPage - 1) })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      aPage <= 1
                        ? "pointer-events-none opacity-50 bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Previous
                  </a>
                  <a
                    href={buildHref({
                      aPage: Math.min(aTotalPages, aPage + 1),
                    })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      aPage >= aTotalPages
                        ? "pointer-events-none opacity-50 bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Next
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100">
          <CardHeader className="bg-gradient-to-r from-emerald-100 via-teal-100 to-green-100 border-b border-emerald-200 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-900">
                  Recent Signups
                </CardTitle>
                <CardDescription>Latest registered users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentUsers.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No users yet</p>
                </div>
              )}
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl hover:bg-gradient-to-r hover:from-emerald-100 hover:to-teal-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {(u.username || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {u.username || u.email}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span>{u.email}</span>
                        <span>•</span>
                        <Badge
                          variant={u.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            {recentUsers.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <div className="text-sm text-slate-500">
                  Page {uPage} of {uTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={buildHref({ uPage: Math.max(1, uPage - 1) })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      uPage <= 1
                        ? "pointer-events-none opacity-50 bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Previous
                  </a>
                  <a
                    href={buildHref({
                      uPage: Math.min(uTotalPages, uPage + 1),
                    })}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      uPage >= uTotalPages
                        ? "pointer-events-none opacity-50 bg-slate-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    Next
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Activity monitoring */}
      <Card className="shadow-sm border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100">
        <CardHeader className="bg-gradient-to-r from-violet-100 via-purple-100 to-fuchsia-100 border-b border-violet-200 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900">
                Recent Activity Attempts
              </CardTitle>
              <CardDescription>
                Latest learning sessions with progress
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {recentAttempts.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No attempts found</p>
              </div>
            )}
            {recentAttempts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl hover:bg-gradient-to-r hover:from-violet-100 hover:to-purple-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(a.user?.username || a.user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      {a.user?.username || a.user?.email}
                    </div>
                    <div className="text-sm text-slate-500">
                      {a.activity?.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs bg-slate-200 px-2 py-0.5 rounded">
                        Score: {a.score}/{a.maxScore}
                      </div>
                      <Badge
                        variant={a.completed ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {a.completed ? "Completed" : "In Progress"}
                      </Badge>
                      {a.activity?.category && (
                        <Badge
                          variant="outline"
                          className="text-xs border-slate-200"
                        >
                          {a.activity.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  {new Date(a.startedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          {recentAttempts.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <div className="text-sm text-slate-500">
                Page {rPage} of {rTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={buildHref({ rPage: Math.max(1, rPage - 1) })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    rPage <= 1
                      ? "pointer-events-none opacity-50 bg-slate-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  Previous
                </a>
                <a
                  href={buildHref({ rPage: Math.min(rTotalPages, rPage + 1) })}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    rPage >= rTotalPages
                      ? "pointer-events-none opacity-50 bg-slate-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  Next
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

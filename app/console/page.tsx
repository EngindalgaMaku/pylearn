import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) {
    redirect("/");
  }

  const [userCount, activityCount, attemptCount, purchases, recentAttempts] = await Promise.all([
    prisma.user.count(),
    prisma.learningActivity.count(),
    prisma.activityAttempt.count(),
    prisma.diamondPurchase.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: true } }),
    prisma.activityAttempt.findMany({ orderBy: { startedAt: "desc" }, take: 10, include: { user: true, activity: true } }),
  ]);

  const pending = purchases.filter(p => p.status === "PENDING").length;
  const completed = purchases.filter(p => p.status === "COMPLETED").length;
  const failed = purchases.filter(p => p.status === "FAILED").length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-work-sans)]">Control Center</h1>
          <p className="text-muted-foreground text-sm">Operational overview of users, activities, and shop</p>
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

        {/* Shop checking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shop Status</CardTitle>
            <CardDescription>Recent diamond purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">Pending: {pending}</Badge>
              <Badge variant="default">Completed: {completed}</Badge>
              <Badge variant="secondary">Failed: {failed}</Badge>
              <Link href="/shop" className="ml-auto text-primary underline">Go to Shop</Link>
            </div>
            <div className="space-y-2">
              {purchases.length === 0 && (
                <div className="text-sm text-muted-foreground">No purchases yet.</div>
              )}
              {purchases.map((p) => (
                <div key={p.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{p.user?.username || p.user?.email}</div>
                    <div className="text-muted-foreground text-xs">{p.packageName} • {p.diamonds}💎 • {p.price} {p.currency}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant={p.status === "COMPLETED" ? "default" : p.status === "FAILED" ? "secondary" : "outline"}>{p.status}</Badge>
                    {p.shopierOrderId && <span className="text-muted-foreground">Order: {p.shopierOrderId}</span>}
                    {p.shopierPaymentId && <span className="text-muted-foreground">PayID: {p.shopierPaymentId}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity Attempts</CardTitle>
            <CardDescription>Latest 10 attempts</CardDescription>
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
                </div>
                <div className="text-xs text-muted-foreground">{new Date(a.startedAt).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

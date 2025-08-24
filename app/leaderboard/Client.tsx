"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Crown, Trophy, Medal, Star } from "lucide-react";
import Link from "next/link";

export type InitialAuth = {
  status: "authenticated" | "unauthenticated";
  user?: any;
} | null;

type LeaderboardItem = {
  rank: number;
  name: string;
  xp: number;
  avatar?: string;
  streak?: number;
  level?: number;
  you?: boolean;
};

type CurrentUser = {
  userId: string;
  name: string;
  level: number;
  streak: number;
  xp: number;
  rank: number;
} | null;

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Trophy className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
          #{rank}
        </span>
      );
  }
};

export default function LeaderboardClient({
  initialAuth,
}: {
  initialAuth?: InitialAuth;
}) {
  const [activeTab, setActiveTab] = useState("weekly");
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const period = activeTab === "weekly" ? "weekly" : "monthly";
        const res = await fetch(`/api/leaderboard?period=${period}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success)
          throw new Error("Failed to load leaderboard");
        if (cancelled) return;
        const mapped: LeaderboardItem[] = (data.items || []).map((u: any) => ({
          rank: u.rank,
          name: u.name,
          xp: u.xp,
          avatar: u.avatar || "🐍",
          streak: u.streak || 0,
          level: u.level || 1,
          you: !!u.you,
        }));
        setItems(mapped);
        setCurrentUser(data.currentUser || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-slate-50/30 to-purple-50/30 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-card via-purple-50/80 to-blue-50/80 border-b border-border/60 px-4 py-6 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">
              Leaderboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Compete with other Python learners
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Desktop Header */}
        <div className="hidden md:block text-center mb-8">
          <h1 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete with fellow Python learners and climb the ranks
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main leaderboard column */}
          <section className="md:col-span-2 space-y-6">
            {/* Tabs + list */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:w-auto">
                <TabsTrigger value="weekly">This Week</TabsTrigger>
                <TabsTrigger value="monthly">This Month</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly" className="space-y-3 mt-6">
                {loading && (
                  <div className="text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading &&
                  !error &&
                  items.map((user, index) => (
                    <Card
                      key={index}
                      className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        user.you
                          ? "bg-gradient-to-r from-primary/10 via-blue-50/80 to-purple-50/80 border-2 border-primary/40 shadow-md shadow-primary/20"
                          : user.rank <= 3
                          ? `bg-gradient-to-r ${
                              user.rank === 1
                                ? "from-yellow-50/90 via-amber-50/80 to-orange-50/90 border-yellow-300/60 shadow-md shadow-yellow-200/30"
                                : user.rank === 2
                                ? "from-slate-50/90 via-gray-50/80 to-zinc-50/90 border-slate-300/60 shadow-md shadow-slate-200/30"
                                : "from-amber-50/90 via-orange-50/80 to-yellow-50/90 border-amber-300/60 shadow-md shadow-amber-200/30"
                            }`
                          : "bg-gradient-to-r from-slate-50/60 via-white to-blue-50/40 shadow-md hover:shadow-blue-200/30"
                      } backdrop-blur-sm`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="flex items-center justify-center w-8">
                              {getRankIcon(user.rank)}
                            </div>
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center md:w-12 md:h-12">
                              <span className="text-lg md:text-xl">
                                {user.avatar}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm md:text-base">
                                {user.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                                <span>{user.xp} XP</span>
                                <span>•</span>
                                <span>{user.streak ?? 0} day streak</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">
                            Level {user.level ?? 1}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="monthly" className="space-y-3 mt-6">
                {loading && (
                  <div className="text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading &&
                  !error &&
                  items.map((user, index) => (
                    <Card
                      key={index}
                      className={`transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        user.you
                          ? "bg-gradient-to-r from-primary/10 via-blue-50/80 to-purple-50/80 border-2 border-primary/40 shadow-md shadow-primary/20"
                          : user.rank <= 3
                          ? `bg-gradient-to-r ${
                              user.rank === 1
                                ? "from-yellow-50/90 via-amber-50/80 to-orange-50/90 border-yellow-300/60 shadow-md shadow-yellow-200/30"
                                : user.rank === 2
                                ? "from-slate-50/90 via-gray-50/80 to-zinc-50/90 border-slate-300/60 shadow-md shadow-slate-200/30"
                                : "from-amber-50/90 via-orange-50/80 to-yellow-50/90 border-amber-300/60 shadow-md shadow-amber-200/30"
                            }`
                          : "bg-gradient-to-r from-slate-50/60 via-white to-blue-50/40 shadow-md hover:shadow-blue-200/30"
                      } backdrop-blur-sm`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="flex items-center justify-center w-8">
                              {getRankIcon(user.rank)}
                            </div>
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center md:w-12 md:h-12">
                              <span className="text-lg md:text-xl">
                                {user.avatar}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm md:text-base">
                                {user.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground md:text-sm">
                                <span>{user.xp} XP</span>
                                <span>•</span>
                                <span>{user.streak ?? 0} day streak</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">
                            Level {user.level ?? 1}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Your Rank Card */}
            <Card className="bg-gradient-to-br from-purple-100/90 via-blue-100/80 to-indigo-100/90 border-purple-300/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-work-sans)]">
                  Your Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center md:w-14 md:h-14">
                      <span className="text-2xl md:text-3xl">🐍</span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {currentUser
                          ? `#${currentUser.rank} This ${
                              activeTab === "weekly" ? "Week" : "Month"
                            }`
                          : "Not ranked yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentUser
                          ? `${currentUser.xp} XP`
                          : "Complete activities to rank"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    Level {currentUser?.level ?? 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Challenge */}
            <Card className="bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-teal-50/80 border-green-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base font-[family-name:var(--font-work-sans)] flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary" />
                  Weekly Challenge
                </CardTitle>
                <CardDescription>
                  Complete to earn bonus XP and climb the leaderboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Complete 15 learning activities</span>
                    <span className="font-medium">7/15</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full"
                      style={{ width: "47%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">+200 Bonus XP</Badge>
                    <span className="text-xs text-muted-foreground">
                      3 days left
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

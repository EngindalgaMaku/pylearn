"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Clock, Star, Zap } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Keep prop for SSR seeding, even if not used yet
export type InitialAuth = {
  status: "authenticated" | "unauthenticated"
  user?: any
} | null

type DailyData = {
  id: string
  title: string
  description: string | null
  rewardXP: number
  rewardDiamonds: number
  difficulty: number
  expiresInSec: number
}

type WeeklyData = {
  id: string
  title: string
  description: string
  rewardXP: number
  rewardDiamonds: number
  difficulty: string
  targetValue: number
  expiresInSec: number
}

type RotatingChallenge = {
  id: string
  title: string
  description: string
  difficulty: string
  startDate: string | Date
  endDate: string | Date
  experienceReward: number
  diamondReward: number
  targetValue: number
  expiresInSec: number
}

const achievements = [
  { title: "First Challenge", description: "Complete your first daily challenge", icon: "🎯", earned: true, rarity: "Common" },
  { title: "Speed Demon", description: "Complete a challenge in record time", icon: "⚡", earned: true, rarity: "Rare" },
  { title: "Consistency King", description: "Complete daily challenges for 7 days straight", icon: "👑", earned: false, rarity: "Epic" },
  { title: "Challenge Master", description: "Complete 50 challenges total", icon: "🏆", earned: false, rarity: "Legendary" },
]

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function ChallengesClient({ initialAuth }: { initialAuth?: InitialAuth }) {
  const { data: session, update, status } = useSession()
  const [activeTab, setActiveTab] = useState("challenges")
  const [daily, setDaily] = useState<DailyData | null>(null)
  const [dailyProgress, setDailyProgress] = useState<{ attempted: boolean; score?: number; completed?: boolean } | null>(null)
  const [weekly, setWeekly] = useState<WeeklyData | null>(null)
  const [weeklyProgress, setWeeklyProgress] = useState<{ currentValue: number; isCompleted: boolean; rewardsClaimed?: boolean } | null>(null)
  const [monthly, setMonthly] = useState<RotatingChallenge | null>(null)
  const [monthlyProgress, setMonthlyProgress] = useState<{ currentValue: number; isCompleted: boolean; rewardsClaimed?: boolean } | null>(null)
  const [featured, setFeatured] = useState<RotatingChallenge | null>(null)
  const [featuredProgress, setFeaturedProgress] = useState<{ currentValue: number; isCompleted: boolean; rewardsClaimed?: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progressOpen, setProgressOpen] = useState(false)
  const [progressKind, setProgressKind] = useState<"weekly" | "monthly" | "featured">("weekly")
  const { toast } = useToast()

  function openProgress(kind: "weekly" | "monthly" | "featured") {
    setProgressKind(kind)
    setProgressOpen(true)
  }

  async function claimReward(challengeId?: string, kind: "weekly" | "monthly" | "featured" = "weekly") {
    if (!challengeId) return
    try {
      const res = await fetch("/api/challenges/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      })
      let data: any = null
      try { data = await res.json() } catch {}

      if (!res.ok) {
        const code = data?.code
        if (code === "ALREADY_CLAIMED") {
          if (kind === "weekly") setWeeklyProgress((p) => (p ? { ...p, rewardsClaimed: true } : p))
          if (kind === "monthly") setMonthlyProgress((p) => (p ? { ...p, rewardsClaimed: true } : p))
          if (kind === "featured") setFeaturedProgress((p) => (p ? { ...p, rewardsClaimed: true } : p))
          toast({ title: "Already claimed", description: "You've already claimed this challenge reward." })
          return
        }
        toast({ title: "Claim failed", description: data?.error || `Status ${res.status}`, variant: "destructive" })
        return
      }

      const xp = data?.reward?.xp ?? 0
      const diamonds = data?.reward?.diamonds ?? 0
      toast({ title: "Rewards claimed", description: `+${xp} XP, +${diamonds} 💎` })

      if (kind === "weekly") setWeeklyProgress((p) => (p ? { ...p, rewardsClaimed: true } : p))
      if (kind === "monthly") setMonthlyProgress((p) => (p ? { ...p, rewardsClaimed: true } : p))
      if (kind === "featured") setFeaturedProgress((p) => (p ? { ...p, rewardsClaimed: true } : p))

      const user = data?.user
      if (user && update) {
        try {
          await update({ experience: user.experience, currentDiamonds: user.currentDiamonds, level: user.level })
        } catch (e) {
          console.warn("Session update after claim failed", e)
        }
      }
    } catch (e) {
      console.error("claim failed", e)
      toast({ title: "Error", description: "Could not claim rewards", variant: "destructive" })
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [dRes, wRes, mRes, fRes] = await Promise.all([
          fetch("/api/challenges/daily", { cache: "no-store" }),
          fetch("/api/challenges/weekly", { cache: "no-store" }),
          fetch("/api/challenges/monthly", { cache: "no-store" }),
          fetch("/api/challenges/featured", { cache: "no-store" }),
        ])
        if (!dRes.ok || !wRes.ok || !mRes.ok || !fRes.ok) throw new Error("Failed to load challenges")
        const dJson = await dRes.json()
        const wJson = await wRes.json()
        const mJson = await mRes.json()
        const fJson = await fRes.json()
        if (cancelled) return
        setDaily(dJson.quiz)
        setDailyProgress(dJson.progress)
        setWeekly(wJson.weekly)
        setWeeklyProgress(wJson.progress ?? null)
        setMonthly(mJson.monthly)
        setMonthlyProgress(mJson.progress ?? null)
        setFeatured(fJson.featured)
        setFeaturedProgress(fJson.progress ?? null)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Load error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Challenges</h1>
          </div>
          <p className="text-muted-foreground text-sm">Take on special challenges for bonus rewards</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
          {/* Main Column */}
          <div className="space-y-6 md:col-span-2">
            {/* Daily Challenge */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <CardTitle className="font-[family-name:var(--font-work-sans)]">Daily Challenge</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    {loading ? "Loading..." : daily ? `Expires in ${formatDuration(daily.expiresInSec)}` : "Unavailable"}
                  </Badge>
                </div>
                <CardDescription>{loading ? "Loading..." : daily?.title ?? ""}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{loading ? "" : daily?.description ?? ""}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {dailyProgress?.attempted ? 5 : 0}/5
                    </span>
                  </div>
                  <Progress value={(dailyProgress?.attempted ? 100 : 0)} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">{daily ? `D${daily.difficulty}` : "-"}</Badge>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                      +{daily?.rewardXP ?? 0} XP
                    </Badge>
                  </div>
                  <Button size="sm" disabled={!daily || loading}>Continue</Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Challenge */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-secondary" />
                    <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">Weekly Challenge</CardTitle>
                  </div>
                  <Badge variant="outline">
                    {loading ? "Loading..." : weekly ? `Expires in ${formatDuration(weekly.expiresInSec)}` : "Unavailable"}
                  </Badge>
                </div>
                <CardDescription>{loading ? "Loading..." : weekly?.title ?? ""}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{loading ? "" : weekly?.description ?? ""}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">
                      {weeklyProgress?.currentValue ?? 0}/{weekly?.targetValue ?? 0}
                    </span>
                  </div>
                  <Progress value={weekly && weeklyProgress ? (weeklyProgress.currentValue / weekly.targetValue) * 100 : 0} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="destructive">{weekly?.difficulty ?? "-"}</Badge>
                    <Badge className="bg-primary/10 text-primary border-primary/20">+{weekly?.rewardXP ?? 0} XP</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                  {weeklyProgress?.isCompleted ? (
                    weeklyProgress?.rewardsClaimed ? (
                      <Badge variant="outline">Claimed</Badge>
                    ) : (
                      <Button size="sm" onClick={() => claimReward(weekly?.id, "weekly")} disabled={Boolean(weekly && weekly.expiresInSec <= 0)}>Claim Reward</Button>
                    )
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => openProgress("weekly")}>View Progress</Button>
                  )}
                </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Challenges (dynamic) */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Featured Challenges</h2>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{loading ? "Loading..." : featured?.title ?? "No featured challenge"}</h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20">+{featured?.experienceReward ?? 0} XP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{loading ? "" : featured?.description ?? ""}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{loading ? "" : featured ? `Expires in ${formatDuration(featured.expiresInSec)}` : ""}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {featured ? featured.difficulty : "-"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 bg-secondary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{loading ? "Loading..." : monthly?.title ?? "No monthly challenge"}</h3>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20">+{monthly?.experienceReward ?? 0} XP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{loading ? "" : monthly?.description ?? ""}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{loading ? "" : monthly ? `Expires in ${formatDuration(monthly.expiresInSec)}` : ""}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {monthly ? monthly.difficulty : "-"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                {featuredProgress?.isCompleted && !featuredProgress?.rewardsClaimed && (
                  <Button size="sm" onClick={() => claimReward(featured?.id, "featured")} disabled={Boolean(featured && featured.expiresInSec <= 0)}>Claim Featured</Button>
                )}
                {monthlyProgress?.isCompleted && !monthlyProgress?.rewardsClaimed && (
                  <Button size="sm" variant="secondary" onClick={() => claimReward(monthly?.id, "monthly")} disabled={Boolean(monthly && monthly.expiresInSec <= 0)}>Claim Monthly</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openProgress("featured")}>View Featured</Button>
                <Button size="sm" variant="ghost" onClick={() => openProgress("monthly")}>View Monthly</Button>
              </div>
            </div>
          
          {/* Progress Modal */}
          <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{progressKind === "weekly" ? weekly?.title : progressKind === "monthly" ? monthly?.title : featured?.title}</DialogTitle>
                <DialogDescription>
                  {progressKind === "weekly" ? weekly?.description : progressKind === "monthly" ? monthly?.description : featured?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const ch = progressKind === "weekly" ? weekly : progressKind === "monthly" ? monthly : featured
                    const pr = progressKind === "weekly" ? weeklyProgress : progressKind === "monthly" ? monthlyProgress : featuredProgress
                    const cur = pr?.currentValue ?? 0
                    const target = ch?.targetValue ?? 0
                    return `Progress: ${cur}/${target} (${target > 0 ? Math.round((cur / target) * 100) : 0}%)`
                  })()}
                </div>
                <div className="text-sm">
                  {(() => {
                    if (progressKind === "weekly" && weekly) {
                      return `Rewards: +${weekly.rewardXP} XP, +${weekly.rewardDiamonds} 💎`
                    }
                    if (progressKind === "monthly" && monthly) {
                      return `Rewards: +${monthly.experienceReward} XP, +${monthly.diamondReward} 💎`
                    }
                    if (progressKind === "featured" && featured) {
                      return `Rewards: +${featured.experienceReward} XP, +${featured.diamondReward} 💎`
                    }
                    return null
                  })()}
                </div>
                {/* Controls removed: progress is updated via gameplay sessions. */}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProgressOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 md:sticky md:top-6 h-fit">
            {/* Special Events (dynamic) */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Special Events</h2>
              <Card className="border-secondary/20 bg-secondary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{loading ? "Loading..." : featured?.title ?? "No featured challenge"}</h3>
                    <Badge variant="secondary">{featured ? "Active" : "Unavailable"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{loading ? "" : featured?.description ?? ""}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{loading ? "" : featured ? `Expires in ${formatDuration(featured.expiresInSec)}` : ""}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Featured</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{loading ? "Loading..." : monthly?.title ?? "No monthly challenge"}</h3>
                    <Badge variant="outline">{monthly ? "Active" : "Unavailable"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{loading ? "" : monthly?.description ?? ""}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{loading ? "" : monthly ? `Expires in ${formatDuration(monthly.expiresInSec)}` : ""}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Monthly</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pro Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-[family-name:var(--font-work-sans)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-secondary" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                  <p className="text-sm font-medium">Daily Consistency</p>
                  <p className="text-xs text-muted-foreground">Complete daily challenges to maintain your streak and earn bonus XP</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium">Time Management</p>
                  <p className="text-xs text-muted-foreground">Some challenges are timed - practice regularly to improve your speed</p>
                </div>
              </CardContent>
            </Card>

            {/* Challenge Achievements */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Challenge Achievements</h2>
              <div className="space-y-4 max-h-[50vh] overflow-auto pr-1">
                {achievements.map((achievement, index) => (
                  <Card key={index} className={achievement.earned ? "bg-primary/5 border-primary/20" : "opacity-60"}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${achievement.earned ? "bg-primary/10" : "bg-muted"}`}>
                          <span className="text-2xl">{achievement.earned ? achievement.icon : "🔒"}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{achievement.title}</h3>
                            <Badge variant="outline" className={`text-xs ${achievement.rarity === "Legendary" ? "border-yellow-500 text-yellow-600" : achievement.rarity === "Epic" ? "border-purple-500 text-purple-600" : achievement.rarity === "Rare" ? "border-blue-500 text-blue-600" : "border-gray-500 text-gray-600"}`}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

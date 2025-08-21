"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Crown, Trophy, Medal, Star } from "lucide-react"
import Link from "next/link"

const weeklyLeaderboard = [
  { rank: 1, name: "Alex Chen", xp: 2450, avatar: "🧑‍💻", streak: 12, level: 5 },
  { rank: 2, name: "Sarah Kim", xp: 2380, avatar: "👩‍🎓", streak: 8, level: 5 },
  { rank: 3, name: "You", xp: 1250, avatar: "🐍", streak: 7, level: 3, isCurrentUser: true },
  { rank: 4, name: "Mike Johnson", xp: 1180, avatar: "👨‍💼", streak: 5, level: 3 },
  { rank: 5, name: "Emma Davis", xp: 1050, avatar: "👩‍🔬", streak: 9, level: 3 },
  { rank: 6, name: "David Wilson", xp: 980, avatar: "👨‍🎨", streak: 4, level: 2 },
  { rank: 7, name: "Lisa Brown", xp: 920, avatar: "👩‍🏫", streak: 6, level: 2 },
  { rank: 8, name: "Tom Garcia", xp: 850, avatar: "👨‍🚀", streak: 3, level: 2 },
]

const allTimeLeaderboard = [
  { rank: 1, name: "Sarah Kim", xp: 15420, avatar: "👩‍🎓", streak: 45, level: 8 },
  { rank: 2, name: "Alex Chen", xp: 14850, avatar: "🧑‍💻", streak: 32, level: 8 },
  { rank: 3, name: "Mike Johnson", xp: 12680, avatar: "👨‍💼", streak: 28, level: 7 },
  { rank: 4, name: "Emma Davis", xp: 11250, avatar: "👩‍🔬", streak: 41, level: 7 },
  { rank: 5, name: "David Wilson", xp: 9840, avatar: "👨‍🎨", streak: 15, level: 6 },
  { rank: 6, name: "You", xp: 8750, avatar: "🐍", streak: 7, level: 5, isCurrentUser: true },
  { rank: 7, name: "Lisa Brown", xp: 8420, avatar: "👩‍🏫", streak: 22, level: 5 },
  { rank: 8, name: "Tom Garcia", xp: 7950, avatar: "👨‍🚀", streak: 18, level: 5 },
]

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-500" />
    case 2:
      return <Trophy className="w-5 h-5 text-gray-400" />
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />
    default:
      return (
        <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
          #{rank}
        </span>
      )
  }
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("weekly")

  const currentLeaderboard = activeTab === "weekly" ? weeklyLeaderboard : allTimeLeaderboard

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-[family-name:var(--font-work-sans)]">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">Compete with other Python learners</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Your Rank Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-work-sans)]">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🐍</span>
                </div>
                <div>
                  <p className="font-medium">
                    #{activeTab === "weekly" ? 3 : 6} This {activeTab === "weekly" ? "Week" : "All Time"}
                  </p>
                  <p className="text-sm text-muted-foreground">{activeTab === "weekly" ? 1250 : 8750} XP</p>
                </div>
              </div>
              <Badge variant="secondary">Level 3</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-3 mt-6">
            {weeklyLeaderboard.map((user, index) => (
              <Card
                key={index}
                className={`${
                  user.isCurrentUser ? "bg-primary/5 border-primary/20" : "hover:shadow-sm transition-shadow"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-lg">{user.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{user.xp} XP</span>
                          <span>•</span>
                          <span>{user.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Level {user.level}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="alltime" className="space-y-3 mt-6">
            {allTimeLeaderboard.map((user, index) => (
              <Card
                key={index}
                className={`${
                  user.isCurrentUser ? "bg-primary/5 border-primary/20" : "hover:shadow-sm transition-shadow"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8">{getRankIcon(user.rank)}</div>
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-lg">{user.avatar}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{user.xp.toLocaleString()} XP</span>
                          <span>•</span>
                          <span>{user.streak} day streak</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Level {user.level}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Weekly Challenge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-[family-name:var(--font-work-sans)] flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" />
              Weekly Challenge
            </CardTitle>
            <CardDescription>Complete to earn bonus XP and climb the leaderboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Complete 15 learning activities</span>
                <span className="font-medium">7/15</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: "47%" }} />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">+200 Bonus XP</Badge>
                <span className="text-xs text-muted-foreground">3 days left</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

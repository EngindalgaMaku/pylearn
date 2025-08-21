"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MobilePageHeader } from "@/components/mobile-page-header"

const games = [
  {
    id: "code-match",
    title: "Code Match",
    description: "Match Python code with its output",
    difficulty: "Beginner",
    icon: "🧩",
    timeEstimate: "3 min",
    xpReward: 50,
  },
  {
    id: "syntax-puzzle",
    title: "Syntax Puzzle",
    description: "Arrange code blocks in the correct order",
    difficulty: "Beginner",
    icon: "🔧",
    timeEstimate: "5 min",
    xpReward: 75,
  },
  {
    id: "variable-naming",
    title: "Variable Detective",
    description: "Find valid Python variable names",
    difficulty: "Beginner",
    icon: "🕵️",
    timeEstimate: "4 min",
    xpReward: 60,
  },
]

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header (standardized like Shop page) */}
      <MobilePageHeader title="Learning Games" subtitle="Learn Python through fun interactive games" />

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Featured Game */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <CardTitle className="font-[family-name:var(--font-work-sans)]">Daily Challenge</CardTitle>
                <CardDescription>Complete today's special challenge</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="secondary">+100 XP</Badge>
                <Badge variant="outline">Bonus Reward</Badge>
              </div>
              <Button size="sm">Play Now</Button>
            </div>
          </CardContent>
        </Card>

        {/* Games List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Available Games</h2>

          {games.map((game) => (
            <Card key={game.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{game.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium font-[family-name:var(--font-work-sans)]">{game.title}</h3>
                      <p className="text-sm text-muted-foreground">{game.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{game.difficulty}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{game.timeEstimate}</span>
                    <span>+{game.xpReward} XP</span>
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <Button size="sm">Play</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">Coming Soon</h2>

          <Card className="opacity-60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏃</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Code Runner</h3>
                    <p className="text-sm text-muted-foreground">Race against time to fix code bugs</p>
                  </div>
                </div>
                <Badge variant="secondary">Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

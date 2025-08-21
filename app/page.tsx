import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuizCard } from "@/components/quiz-card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Mobile Brand Header */}
      <div className="md:hidden sticky top-0 z-30 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-primary font-[family-name:var(--font-work-sans)]">PyLearn 🐍</span>
            <span className="text-xs text-muted-foreground">Master Python through fun and games</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-4 py-8 space-y-8 md:space-y-10">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="font-[family-name:var(--font-work-sans)] text-foreground md:text-xl lg:text-2xl">
              Welcome Back!
            </CardTitle>
            <CardDescription className="md:text-base lg:text-lg">
              Ready to continue your Python journey?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm md:text-base lg:text-lg">
                <span>Overall Progress</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2 md:h-3 lg:h-4" />
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs md:text-sm lg:text-base">
                  Level 3
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm lg:text-base">
                  850 XP
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenge Banner */}
            <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-secondary/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg md:text-xl lg:text-2xl">🎯</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base lg:text-lg">Daily Challenge</p>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground">3/5 completed • +100 XP</p>
                    </div>
                  </div>
                  <Link href="/challenges">
                    <Button size="sm" variant="secondary" className="md:size-default lg:px-6">
                      Continue
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Featured Lesson */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                  Continue Learning
                </h2>
                <Link href="/learn">
                  <Button variant="ghost" size="sm" className="text-xs md:text-sm lg:text-base">
                    View All Lessons
                  </Button>
                </Link>
              </div>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-5 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-xl md:text-2xl lg:text-3xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-medium md:text-lg lg:text-xl">Lists and Indexing</h3>
                        <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Next lesson • 25 min</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Beginner
                          </Badge>
                          <span className="text-xs text-muted-foreground">+70 XP, +15 💎</span>
                        </div>
                      </div>
                    </div>
                    <Link href="/learn/3">
                      <Button className="md:text-base lg:text-lg">Start Lesson</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <Link href="/learn">
                <Button
                  size="lg"
                  className="h-20 md:h-24 lg:h-28 flex-col gap-2 font-[family-name:var(--font-work-sans)] w-full"
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">📚</span>
                  <span className="md:text-base lg:text-lg">Learn</span>
                </Button>
              </Link>
              <Link href="/quiz">
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-20 md:h-24 lg:h-28 flex-col gap-2 font-[family-name:var(--font-work-sans)] w-full"
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">📝</span>
                  <span className="md:text-base lg:text-lg">Take Quiz</span>
                </Button>
              </Link>
            </div>

            {/* Learning Modules */}
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                Learning Modules
              </h2>

              <div className="space-y-3 lg:space-y-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg md:text-xl lg:text-2xl">🔤</span>
                        </div>
                        <div>
                          <h3 className="font-medium md:text-lg lg:text-xl">Python Basics</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                            Variables & Data Types
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 lg:text-base">8/12</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-5 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <span className="text-lg md:text-xl lg:text-2xl">🔄</span>
                        </div>
                        <div>
                          <h3 className="font-medium md:text-lg lg:text-xl">Control Flow</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Loops & Conditions</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="lg:text-base">
                        3/10
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-60">
                  <CardContent className="p-4 md:p-5 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-lg md:text-xl lg:text-2xl">📦</span>
                        </div>
                        <div>
                          <h3 className="font-medium md:text-lg lg:text-xl">Functions</h3>
                          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">Coming Soon</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="lg:text-base">
                        Locked
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Featured Quizzes */}
            <div className="space-y-4 lg:space-y-6">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)] md:text-xl lg:text-2xl">
                Featured Quizzes
              </h2>

              <QuizCard
                title="Python Basics"
                description="Variables, data types, and basic operations"
                difficulty="Beginner"
                questions={5}
                timeEstimate="5 min"
                icon="🔤"
                href="/quiz"
              />
            </div>

            {/* Recent Achievements */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base md:text-lg lg:text-xl font-[family-name:var(--font-work-sans)]">
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm md:text-base lg:text-lg">🏆</span>
                  </div>
                  <div>
                    <p className="text-sm md:text-base lg:text-lg font-medium">Quiz Master</p>
                    <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                      Completed 5 quizzes in a row
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm md:text-base lg:text-lg">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm md:text-base lg:text-lg font-medium">Speed Learner</p>
                    <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
                      Answered 10 questions in under 2 minutes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Leaderboard Preview */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg lg:text-xl font-[family-name:var(--font-work-sans)]">
                Weekly Leaderboard
              </CardTitle>
              <Link href="/leaderboard">
                <Button variant="ghost" size="sm" className="lg:text-base">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <span className="text-lg md:text-xl lg:text-2xl">👑</span>
                <div>
                  <p className="text-sm md:text-base lg:text-lg font-medium">Alex Chen</p>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground">2,450 XP</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 lg:text-base">#1</Badge>
            </div>
            <div className="flex items-center justify-between p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <span className="text-lg md:text-xl lg:text-2xl">🐍</span>
                <div>
                  <p className="text-sm md:text-base lg:text-lg font-medium">You</p>
                  <p className="text-xs md:text-sm lg:text-base text-muted-foreground">1,250 XP</p>
                </div>
              </div>
              <Badge variant="secondary" className="lg:text-base">
                #3
              </Badge>
            </div>
          </CardContent>
        </Card>
      </main>



    </div>
  )
}

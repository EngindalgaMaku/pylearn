import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface QuizCardProps {
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  questions: number
  timeEstimate: string
  icon: string
  href: string
}

export function QuizCard({ title, description, difficulty, questions, timeEstimate, icon, href }: QuizCardProps) {
  const difficultyColor = {
    Beginner: "bg-green-100 text-green-800 border-green-200",
    Intermediate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Advanced: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{icon}</span>
            </div>
            <div>
              <CardTitle className="text-base font-[family-name:var(--font-work-sans)]">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <Badge className={difficultyColor[difficulty]}>{difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>{questions} questions</span>
          <span>{timeEstimate}</span>
        </div>
        <Link href={href}>
          <Button className="w-full">Start Quiz</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

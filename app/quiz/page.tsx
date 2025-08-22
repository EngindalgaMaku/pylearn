import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import QuizRunner from "@/components/quiz/QuizRunner"

type QuizQuestion = {
  id: string | number
  question: string
  type: "multiple-choice" | "true-false"
  options: string[]
  correctAnswer: number
  explanation?: string
}

export default async function QuizPage() {
  // Fetch the most recent active quiz
  const quiz = await prisma.quiz.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  })

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-screen-md mx-auto px-4 py-10">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold">No quiz available</h1>
            <p className="text-muted-foreground">
              Please check back later. There is currently no active quiz.
            </p>
          </div>
        </main>
      </div>
    )
  }

  let questions: QuizQuestion[] = []
  try {
    const parsed = JSON.parse(quiz.questions)
    if (Array.isArray(parsed)) questions = parsed as QuizQuestion[]
  } catch (e) {
    // fall back to empty
  }

  // Shuffle questions: create a permutation order and apply it
  const order = questions.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const shuffled = order.map((idx) => questions[idx])

  // Fetch user's best score for this quiz, if logged in
  const session = (await getServerSession(authOptions as any)) as any
  let bestScore: number | null = null
  const userId = session?.user?.id as string | undefined
  if (userId) {
    const best = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id },
      orderBy: { score: "desc" },
      select: { score: true },
    })
    bestScore = best?.score ?? null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto px-4 py-6 w-full max-w-screen-md lg:max-w-screen-lg">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-work-sans)]">
            {quiz.title}
          </h1>
          {quiz.description ? (
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{quiz.description}</p>
          ) : null}
        </div>
        <QuizRunner
          quizId={quiz.id}
          experienceReward={quiz.experienceReward}
          diamondReward={quiz.diamondReward}
          timeLimit={quiz.timeLimit ?? 300}
          questions={shuffled}
          order={order}
          bestScore={bestScore ?? undefined}
        />
      </main>
    </div>
  )
}

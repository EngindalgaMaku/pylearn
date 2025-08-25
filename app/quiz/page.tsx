import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QuizRunner from "@/components/quiz/QuizRunner";
import type { Metadata } from "next";
import Script from "next/script";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Python Quiz - Test Your Knowledge | PyLearn",
  description:
    "Challenge yourself with interactive Python quizzes. Test your programming skills, earn XP and diamonds, and track your progress. Perfect for beginners to intermediate Python developers.",
  keywords: [
    "python quiz",
    "programming quiz",
    "python test",
    "coding quiz",
    "python practice",
    "programming assessment",
    "python knowledge test",
    "interactive quiz",
    "python learning",
    "coding challenge",
  ],
  openGraph: {
    title: "Python Quiz - Test Your Knowledge",
    description:
      "Challenge yourself with interactive Python quizzes and earn rewards",
    type: "website",
    url: "/quiz",
  },
};

type QuizQuestion = {
  id: string | number;
  question: string;
  type: "multiple-choice" | "true-false";
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export default async function QuizPage() {
  // Fetch the most recent active quiz
  const quiz = await prisma.quiz.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!quiz) {
    return (
      <>
        <div className="min-h-screen bg-background">
          <main className="max-w-screen-md mx-auto px-4 py-10">
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold">
                  No Quiz Available Right Now
                </h1>
                <p className="text-muted-foreground text-base">
                  Please check back later. There is currently no active quiz.
                </p>
              </div>

              {/* SEO Content */}
              <div className="mt-12 max-w-2xl mx-auto text-left space-y-6">
                <section>
                  <h2 className="text-xl font-semibold mb-3">
                    About Python Quizzes
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    PyLearn offers interactive Python quizzes designed to test
                    and improve your programming knowledge. Our quizzes cover
                    fundamental Python concepts, from basic syntax to advanced
                    topics like object-oriented programming.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">
                    What You'll Learn
                  </h2>
                  <ul className="text-muted-foreground space-y-2">
                    <li>• Python syntax and fundamentals</li>
                    <li>• Data types and variables</li>
                    <li>• Control flow and loops</li>
                    <li>• Functions and modules</li>
                    <li>• Object-oriented programming concepts</li>
                    <li>• Error handling and debugging</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-3">Quiz Features</h2>
                  <ul className="text-muted-foreground space-y-2">
                    <li>• Timed challenges to test your speed</li>
                    <li>• Immediate feedback on your answers</li>
                    <li>• Detailed explanations for each question</li>
                    <li>• Progress tracking and statistics</li>
                    <li>• Earn XP and diamonds for correct answers</li>
                    <li>• Mobile-friendly interface</li>
                  </ul>
                </section>
              </div>
            </div>
          </main>
        </div>

        <Script
          id="ld-quiz-page"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Quiz",
            name: "Python Programming Quiz",
            description:
              "Interactive Python quiz to test programming knowledge and skills",
            educationalLevel: "Beginner to Intermediate",
            about: {
              "@type": "Thing",
              name: "Python Programming",
            },
            provider: {
              "@type": "Organization",
              name: "PyLearn",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net",
            },
          })}
        </Script>
      </>
    );
  }

  let questions: QuizQuestion[] = [];
  try {
    const parsed = JSON.parse(quiz.questions);
    if (Array.isArray(parsed)) questions = parsed as QuizQuestion[];
  } catch (e) {
    // fall back to empty
  }

  // Shuffle questions: create a permutation order and apply it
  const order = questions.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const shuffled = order.map((idx) => questions[idx]);

  // Fetch user's best score for this quiz, if logged in
  const session = (await getServerSession(authOptions as any)) as any;
  let bestScore: number | null = null;
  const userId = session?.user?.id as string | undefined;
  if (userId) {
    const best = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: quiz.id },
      orderBy: { score: "desc" },
      select: { score: true },
    });
    bestScore = best?.score ?? null;
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <main className="mx-auto px-4 py-6 w-full max-w-screen-md lg:max-w-screen-lg">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-work-sans)]">
              {quiz.title}
            </h1>
            {quiz.description ? (
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {quiz.description}
              </p>
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

      <Script
        id="ld-quiz-active"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: quiz.title,
          description:
            quiz.description || "Interactive Python programming quiz",
          educationalLevel: "Beginner to Intermediate",
          timeRequired: `PT${Math.floor((quiz.timeLimit ?? 300) / 60)}M`,
          about: {
            "@type": "Thing",
            name: "Python Programming",
          },
          provider: {
            "@type": "Organization",
            name: "PyLearn",
            url: process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net",
          },
          hasPart: questions.map((q, i) => ({
            "@type": "Question",
            name: `Question ${i + 1}`,
            text: q.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: q.options[q.correctAnswer],
            },
          })),
        })}
      </Script>
    </>
  );
}

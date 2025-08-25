"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type QuizQuestion = {
  id: string | number;
  question: string;
  type: "multiple-choice" | "true-false";
  options: string[];
  correctAnswer: number;
  explanation?: string;
};

export default function QuizRunner({
  quizId,
  questions,
  timeLimit,
  experienceReward,
  diamondReward,
  order,
  bestScore,
}: {
  quizId: string;
  questions: QuizQuestion[];
  timeLimit: number;
  experienceReward: number;
  diamondReward: number;
  order: number[];
  bestScore?: number;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timeLimit);
  const [submitting, setSubmitting] = useState(false);
  const [navLocked, setNavLocked] = useState(false);
  const { toast } = useToast();

  // Stats from API
  const [stats, setStats] = useState<{
    attemptsCount: number;
    totalCorrect: number;
    averageScore: number;
    bestScore: number | null;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Milestone rewards just awarded in this submission
  const [milestoneRewards, setMilestoneRewards] = useState<
    Array<{ milestone: number; diamonds: number; xp: number }>
  >([]);

  const question = questions[currentQuestion];
  const progress = useMemo(
    () => ((currentQuestion + 1) / Math.max(1, questions.length)) * 100,
    [currentQuestion, questions.length]
  );

  // Fetch per-quiz stats for sidebar
  useEffect(() => {
    let active = true;
    async function load() {
      setStatsLoading(true);
      try {
        const res = await fetch(
          `/api/quiz/stats?quizId=${encodeURIComponent(quizId)}`
        );
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as {
          attemptsCount: number;
          totalCorrect: number;
          averageScore: number;
          bestScore: number | null;
        };
        if (active) setStats(data);
      } catch (_) {
        if (active) setStats(null);
      } finally {
        if (active) setStatsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [quizId]);

  useEffect(() => {
    if (quizCompleted) return;
    if (secondsLeft <= 0) {
      // On timeout, record current (or no) answer and move to next question or finish
      if (currentQuestion < questions.length - 1) {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = selectedAnswer ?? -1;
        setAnswers(newAnswers);
        setSelectedAnswer(null);
        setShowResult(false);
        setCurrentQuestion((q) => q + 1);
        setSecondsLeft(timeLimit);
      } else {
        finishQuiz();
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [
    secondsLeft,
    quizCompleted,
    currentQuestion,
    questions.length,
    selectedAnswer,
    answers,
    timeLimit,
  ]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    // Set selection
    setSelectedAnswer(answerIndex);
    // Lock backward navigation after the first answer
    if (!navLocked) setNavLocked(true);
    // Auto-submit immediately
    if (!question) return;
    setShowResult(true);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    const isCorrect = answerIndex === question.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setTimeout(() => {
        finishQuiz();
      }, 1200);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !question) return;
    setShowResult(true);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      // Wrong answer: reveal result briefly, then end the quiz
      // Give the user a moment to see the correct answer highlight
      setTimeout(() => {
        finishQuiz();
      }, 1200);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setSelectedAnswer(answers[currentQuestion + 1] ?? null);
      setShowResult(Boolean(answers[currentQuestion + 1] !== undefined));
      setSecondsLeft(timeLimit);
    } else {
      finishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
      setSelectedAnswer(answers[currentQuestion - 1] ?? null);
      setShowResult(Boolean(answers[currentQuestion - 1] !== undefined));
      setSecondsLeft(timeLimit);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
    setSecondsLeft(timeLimit);
    setMilestoneRewards([]);
  };

  async function finishQuiz() {
    if (quizCompleted) return;
    setQuizCompleted(true);
    setShowResult(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId,
          answers,
          order,
          timeSpent: timeLimit - secondsLeft,
        }),
      });
      const data = await res.json().catch(() => null);
      // Handle milestone toasts
      if (data && Array.isArray(data.awarded) && data.awarded.length) {
        setMilestoneRewards(data.awarded);
        // Aggregate toast
        const totalD = data.awarded.reduce(
          (s: number, a: any) => s + (a.diamonds || 0),
          0
        );
        const totalX = data.awarded.reduce(
          (s: number, a: any) => s + (a.xp || 0),
          0
        );
        const milestones = data.awarded
          .map((a: any) => a.milestone)
          .sort((a: number, b: number) => a - b);
        toast({
          title: "Milestones unlocked!",
          description: `Reached ${milestones.join(
            ", "
          )} correct answers. +${totalD} 💎 · +${totalX} XP`,
        });
      } else {
        setMilestoneRewards([]);
      }
    } catch (_) {
      // ignore network errors for now
    } finally {
      setSubmitting(false);
    }
  }

  if (!questions.length) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No questions available for this quiz.
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round(
      (score / Math.max(1, questions.length)) * 100
    );
    const baseXP = score * experienceReward;
    const baseDiamonds = score * diamondReward;
    const bonusXP = milestoneRewards.reduce((s, m) => s + m.xp, 0);
    const bonusDiamonds = milestoneRewards.reduce((s, m) => s + m.diamonds, 0);
    const totalXP = baseXP + bonusXP;
    const totalDiamonds = baseDiamonds + bonusDiamonds;
    return (
      <div>
        <Card className="text-center relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-200/30 shadow-lg">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-600/15 to-teal-600/20 opacity-50" />
          <CardHeader className="relative">
            <div className="w-20 h-20 mx-auto bg-white/90 border-2 border-green-200/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <span className="text-4xl">🎉</span>
            </div>
            <CardTitle className="font-[family-name:var(--font-work-sans)] text-gray-900">
              Great Job!
            </CardTitle>
            <CardDescription className="text-gray-600">
              You completed the quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                {percentage}%
              </div>
              <div className="text-sm text-muted-foreground">
                {score} out of {questions.length} correct
              </div>
            </div>

            <div className="space-y-2">
              <Badge
                variant={
                  percentage >= 80
                    ? "default"
                    : percentage >= 60
                    ? "secondary"
                    : "outline"
                }
                className="text-sm px-3 py-1"
              >
                {percentage >= 80
                  ? "Excellent!"
                  : percentage >= 60
                  ? "Good Job!"
                  : "Keep Learning!"}
              </Badge>
              <div className="text-xs text-muted-foreground">
                +{baseXP} XP · +{baseDiamonds} 💎
              </div>
            </div>

            {/* Rewards Summary */}
            <div className="rounded-lg border p-4 text-left">
              <div className="text-sm font-medium mb-2">Rewards</div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Base (per correct)</span>
                  <span>
                    +{baseXP} XP · +{baseDiamonds} 💎
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Milestones</span>
                  <span>
                    +{bonusXP} XP · +{bonusDiamonds} 💎
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Earned</span>
                  <span>
                    +{totalXP} XP · +{totalDiamonds} 💎
                  </span>
                </div>
              </div>
              {milestoneRewards.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  New milestones:{" "}
                  {milestoneRewards
                    .map((m) => m.milestone)
                    .sort((a, b) => a - b)
                    .join(", ")}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={restartQuiz}
                variant="outline"
                className="flex-1 bg-white/80 text-gray-700 border-green-200/50 hover:bg-white/90"
                disabled={submitting}
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.history.back()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                disabled={submitting}
              >
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/30 rounded-lg px-4 py-4 sm:py-5 mb-4 backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-purple-600/15 opacity-40" />
        <div className="max-w-full mx-auto relative">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-700 hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                <span>
                  {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, "0")}
                </span>
              </div>
              <Badge variant="outline">
                {currentQuestion + 1} of {questions.length}
              </Badge>
              {typeof bestScore === "number" && (
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex bg-white/80 text-gray-700 border-blue-200/50"
                >
                  Best: {bestScore}%
                </Badge>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 border-violet-200/30 shadow-md">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/15 via-purple-600/10 to-pink-600/15 opacity-40" />
            <CardHeader className="relative">
              <CardTitle className="text-lg sm:text-xl font-[family-name:var(--font-work-sans)] leading-relaxed text-gray-900">
                {question?.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative">
              {question?.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    selectedAnswer === index
                      ? showResult
                        ? index === question.correctAnswer
                          ? "default"
                          : "destructive"
                        : "secondary"
                      : "outline"
                  }
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                      {showResult && index === question.correctAnswer ? (
                        <CheckCircle className="w-4 h-4 text-primary-foreground" />
                      ) : showResult &&
                        selectedAnswer === index &&
                        index !== question.correctAnswer ? (
                        <XCircle className="w-4 h-4 text-destructive-foreground" />
                      ) : (
                        <span className="text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </Button>
              ))}

              {showResult && question?.explanation && (
                <div className="mt-4 p-4 bg-white/60 border border-violet-200/30 rounded-lg backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-violet-100/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">💡</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 text-gray-900">
                        Explanation
                      </p>
                      <p className="text-sm text-gray-600">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0 || navLocked}
              className="bg-white/80 text-gray-700 border-violet-200/50 hover:bg-white/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {showResult ? (
              <Button
                onClick={handleNextQuestion}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
              >
                {currentQuestion === questions.length - 1
                  ? "Finish Quiz"
                  : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>

        {/* Sidebar Summary (visible on lg+) */}
        <aside className="hidden lg:block">
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-200/30 shadow-md">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-600/15 via-orange-600/10 to-red-600/15 opacity-40" />
            <CardHeader className="relative">
              <CardTitle className="text-base text-gray-900">Summary</CardTitle>
              <CardDescription className="text-gray-600">
                Track your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm relative">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Questions</span>
                  <span>{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Correct</span>
                  <span>{score}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining</span>
                  <span>{questions.length - (currentQuestion + 1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time left</span>
                  <span>
                    {Math.floor(secondsLeft / 60)}:
                    {String(secondsLeft % 60).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  Your Stats
                </div>
                {statsLoading ? (
                  <div className="text-xs text-muted-foreground">
                    Loading...
                  </div>
                ) : stats ? (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Attempts</span>
                      <span>{stats.attemptsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total correct</span>
                      <span>{stats.totalCorrect}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average score</span>
                      <span>{stats.averageScore}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    No stats available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

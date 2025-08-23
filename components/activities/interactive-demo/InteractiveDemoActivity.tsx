"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Star,
  Code,
  Diamond,
  Award,
} from "lucide-react";

interface DemoStep {
  title: string;
  content: string;
  code?: string;
  explanation?: string;
}

interface InteractiveDemoContent {
  title: string;
  description: string;
  steps: DemoStep[];
}

interface LearningActivity {
  id: string;
  slug: string;
  title: string;
  description: string;
  activityType: string;
  difficulty: number;
  category: string;
  diamondReward: number;
  experienceReward: number;
  estimatedMinutes: number;
  content: InteractiveDemoContent;
  settings?: any;
  tags: string[];
}

interface InteractiveDemoActivityProps {
  activity: LearningActivity;
  onComplete?: (score: number, maxScore: number, success: boolean) => void;
}

export default function InteractiveDemoActivity({
  activity,
  onComplete,
}: InteractiveDemoActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showAlreadyClaimedDialog, setShowAlreadyClaimedDialog] = useState(false);
  const [awardedDiamonds, setAwardedDiamonds] = useState<number>(activity.diamondReward || 0);
  const [awardedXP, setAwardedXP] = useState<number>(activity.experienceReward || 0);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        const userSession =
          localStorage.getItem("user") ||
          sessionStorage.getItem("user") ||
          localStorage.getItem("next-auth.session-token") ||
          document.cookie.includes("next-auth.session-token");
        setIsAuthenticated(!!userSession);
      }
    };
    checkAuth();
  }, []);

  // Normalize content to support both classic and seed schemas
  const raw: any = activity?.content ?? {};
  const title: string =
    typeof raw.title === "string" ? raw.title : activity.title;
  const description: string =
    typeof raw.description === "string"
      ? raw.description
      : activity.description;

  const stepsRaw: any[] = Array.isArray(raw.steps) ? raw.steps : [];
  const normalizedSteps: {
    title: string;
    content: string;
    code?: string;
    explanation?: string;
  }[] = stepsRaw.map((s: any) => ({
    title: String(s?.title ?? "Step"),
    // Seed steps often use "description" instead of "content"
    content:
      typeof s?.content === "string" && s.content.trim() !== ""
        ? s.content
        : String(s?.description ?? ""),
    code: typeof s?.code === "string" ? s.code : undefined,
    explanation: typeof s?.explanation === "string" ? s.explanation : undefined,
  }));

  // (Intro screen moved below hooks/effects to keep hooks order stable)

  const nextStep = () => {
    if (currentStep < normalizedSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (!isCompleted) {
      setIsCompleted(true);
      setEndTime(new Date());
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runCode = async () => {
    const currentStepData = normalizedSteps[currentStep];
    if (!currentStepData.code) return;

    setIsRunning(true);
    setCodeOutput("");

    try {
      // Simulate code execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock output based on code content
      let mockOutput = "";
      if (currentStepData.code.includes("print")) {
        // Extract print statements and simulate output
        const printMatches = currentStepData.code.match(/print\([^)]*\)/g);
        if (printMatches) {
          printMatches.forEach((printStatement) => {
            const content = printStatement.match(/print\((.+)\)/)?.[1] || "";
            // Simple evaluation for demo purposes
            if (content.includes('"') || content.includes("'")) {
              mockOutput += content.replace(/['"]/g, "") + "\n";
            } else if (content.includes("fruits")) {
              mockOutput += "['apple', 'banana', 'orange', 'grape']\n";
            } else if (content.includes("len(")) {
              mockOutput += "4\n";
            } else {
              mockOutput += "Output: " + content + "\n";
            }
          });
        }
      } else {
        mockOutput = "Code executed successfully!";
      }

      setCodeOutput(mockOutput.trim());
    } catch (error) {
      setCodeOutput(`Error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Claim rewards using the same standard flow as QuizRunner
  const handleClaimRewards = async () => {
    try {
      setCompleting(true);
      const backParams = new URLSearchParams();
      const category = searchParams?.get("category") || "";
      const type = searchParams?.get("type") || "";
      if (category) backParams.set("category", category);
      if (type) backParams.set("type", type);
      const backHref = backParams.toString() ? `/activities?${backParams.toString()}` : "/activities";

      // If not authenticated, show toast and bail (server will also enforce)
      // We still call the API; if 401, show toast

      const pct = 85; // fixed demo score
      const tSpent = startTime && endTime ? Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000)) : undefined;

      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: activity.slug,
          score: pct,
          timeSpent: tSpent,
        }),
        cache: "no-store",
      });

      if (res.status === 401) {
        toast({
          title: "Login required",
          description: "You must log in to claim your rewards.",
        });
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Activity could not be completed (HTTP ${res.status})`);
      }

      const diamonds = data.rewards?.diamonds ?? activity.diamondReward ?? 0;
      const experience = data.rewards?.experience ?? activity.experienceReward ?? 0;
      setAwardedDiamonds(diamonds);
      setAwardedXP(experience);
      const already = data.alreadyCompleted === true;
      setCompleted(true);

      if (already) {
        setShowAlreadyClaimedDialog(true);
      } else {
        setShowRewardDialog(true);
      }

      // Fallback redirect
      setTimeout(() => {
        window.location.href = backHref;
      }, 3000);
    } catch (error) {
      console.error("Interactive demo completion error:", error);
      toast({
        title: "Error",
        description: "An error occurred while completing the activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  // Build backHref and modals once hooks are declared
  const backHref = (() => {
    const category = searchParams?.get("category") || "";
    const type = searchParams?.get("type") || "";
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (type) qs.set("type", type);
    const s = qs.toString();
    return s ? `/activities?${s}` : "/activities";
  })();

  // Auto-redirect when modals show
  useEffect(() => {
    if (showRewardDialog || showAlreadyClaimedDialog) {
      const timer = setTimeout(() => {
        router.push(backHref);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRewardDialog, showAlreadyClaimedDialog, router, backHref]);

  const rewardModal = (
    <Dialog open={showRewardDialog} onOpenChange={(open) => {
      setShowRewardDialog(open);
      if (!open) router.push(backHref);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Congratulations! 🎉</DialogTitle>
          <DialogDescription className="text-center">
            You have successfully completed the activity and earned your rewards.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Diamond className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{awardedDiamonds}</div>
              <div className="text-sm text-muted-foreground">Diamonds</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-bold">{awardedXP}</div>
              <div className="text-sm text-muted-foreground">Experience</div>
            </div>
          </div>
          <p className="text-center text-muted-foreground mt-2">Redirecting to activities page in 3 seconds...</p>
        </div>
        <DialogFooter className="flex justify-center">
          <Button onClick={() => { setShowRewardDialog(false); router.push(backHref); }}>Back to Activities</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const alreadyClaimedModal = (
    <Dialog open={showAlreadyClaimedDialog} onOpenChange={(open) => {
      setShowAlreadyClaimedDialog(open);
      if (!open) router.push(backHref);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Already Completed</DialogTitle>
          <DialogDescription className="text-center">
            You have already completed this activity and claimed your rewards.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-center text-muted-foreground">No additional rewards will be given for completing the same activity multiple times.</p>
          <p className="text-center text-muted-foreground mt-2">Redirecting to activities page in 3 seconds...</p>
        </div>
        <DialogFooter className="flex justify-center">
          <Button onClick={() => { setShowAlreadyClaimedDialog(false); router.push(backHref); }}>Back to Activities</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isCompleted) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        {rewardModal}
        {alreadyClaimedModal}
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Trophy className="h-10 w-10" />
          </div>

          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Demo Complete!
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            You've successfully explored {title} through our interactive
            demonstration!
          </p>

          <div className="mb-8 rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-4xl font-bold text-gray-900">85%</div>
            <div className="text-lg font-semibold text-green-600">
              Knowledge Acquired!
            </div>
          </div>

          {isAuthenticated ? (
            <Button onClick={handleClaimRewards} disabled={completing || completed} className="px-6">
              {completing ? "Processing..." : completed ? "Completed" : "Claim Rewards"}
            </Button>
          ) : (
            <Button onClick={() => router.push(backHref)} className="px-6">
              Finish and Go to List
            </Button>
          )}
        </div>

        {/* Reward Animation */}
        {showRewardAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative rounded-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 p-8 text-center shadow-2xl">
              <h3 className="mb-4 text-3xl font-bold text-white">
                🎉 Demo Mastered! 🎉
              </h3>
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-center space-x-3 rounded-lg bg-yellow-500/20 p-3">
                  <span className="text-xl font-semibold text-yellow-300">
                    +{activity.diamondReward || 30} Diamonds
                  </span>
                </div>
                <div className="flex items-center justify-center space-x-3 rounded-lg bg-blue-500/20 p-3">
                  <Star className="h-8 w-8 text-blue-400" />
                  <span className="text-xl font-semibold text-blue-300">
                    +{activity.experienceReward || 45} Experience
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Intro screen (placed after hooks/effects to keep hook order stable)
  if (!started) {
    const stepCount = normalizedSteps?.length || 0;
    const canStart = stepCount > 0;
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-lg bg-amber-50 p-8 text-center">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-200 text-amber-700">
            <Play className="h-8 w-8" />
          </div>

          {/* Title/description removed: handled by page-level header */}

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Steps</div>
              <div className="text-2xl font-semibold text-gray-900">{stepCount}</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Estimated Time</div>
              <div className="text-2xl font-semibold text-gray-900">{activity.estimatedMinutes} min</div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Rewards</div>
              <div className="text-base font-medium text-gray-900">+{activity.diamondReward} Diamonds · +{activity.experienceReward} XP</div>
            </div>
          </div>

          {!canStart && (
            <div className="mx-auto mb-6 max-w-xl rounded-md bg-yellow-100 p-3 text-sm text-yellow-900">
              This interactive demo has no steps configured yet.
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => {
                if (!canStart) return;
                setStarted(true);
                setStartTime(new Date());
              }}
              disabled={!canStart}
              className="px-6"
            >
              {canStart ? "Start Demo" : "No Steps Available"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = normalizedSteps[currentStep];
  const progress = ((currentStep + 1) / (normalizedSteps.length || 1)) * 100;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Title/description removed: handled by page-level header */}

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {normalizedSteps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Content Panel */}
        <div>
          <div className="rounded-lg bg-blue-50 p-6">
            <h3 className="mb-4 text-2xl font-semibold text-blue-900">
              {currentStepData.title}
            </h3>
            <div className="prose prose-blue max-w-none text-blue-800">
              {currentStepData.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {currentStepData.explanation && (
              <div className="mt-6 rounded-lg bg-blue-100 p-4">
                <h4 className="mb-2 font-semibold text-blue-900">
                  💡 Explanation:
                </h4>
                <p className="text-blue-800">{currentStepData.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Code Panel */}
        <div>
          {currentStepData.code ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Interactive Code
                </h3>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>{isRunning ? "Running..." : "Run Code"}</span>
                </button>
              </div>

              <div className="mb-4 rounded-lg bg-gray-900 p-4">
                <pre className="overflow-x-auto text-sm text-green-400">
                  <code>{currentStepData.code}</code>
                </pre>
              </div>

              {/* Output */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                  Output:
                </h4>
                <div className="min-h-20 rounded-lg bg-black p-4 font-mono text-sm text-green-400">
                  {isRunning ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent"></div>
                      <span>Executing code...</span>
                    </div>
                  ) : codeOutput ? (
                    <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                  ) : (
                    <div className="text-gray-500">
                      Click "Run Code" to see output...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-6">
              <div className="flex h-64 items-center justify-center text-gray-500">
                <div className="text-center">
                  <Code className="mx-auto mb-4 h-12 w-12" />
                  <p>No code example for this step</p>
                  <p className="text-sm">Focus on the concept explanation</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center space-x-2 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        {/* Step Indicators */}
        <div className="flex items-center space-x-2">
          {normalizedSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-3 w-3 rounded-full transition-all ${
                index === currentStep
                  ? "bg-blue-600"
                  : index < currentStep
                  ? "bg-blue-300"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextStep}
          className="flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          <span>
            {currentStep === normalizedSteps.length - 1
              ? "Complete Demo"
              : "Next Step"}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

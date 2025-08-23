"use client";

import { useState, useEffect, useRef } from "react";
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
import { Play, Pause, RotateCcw, Trophy, Star, ChevronRight, Volume2, VolumeX, Diamond, Award } from "lucide-react";

interface VisualizationStep {
  id: number;
  description: string;
  data: number[];
  highlights?: number[];
  comparison?: number[];
  action: string;
}

interface AlgorithmVisualizationContent {
  algorithm: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  steps: VisualizationStep[];
}

interface LearningActivity {
  id: string;
  slug?: string;
  title: string;
  description: string;
  activityType: string;
  difficulty: number;
  category: string;
  diamondReward: number;
  experienceReward: number;
  estimatedMinutes: number;
  content: AlgorithmVisualizationContent | any;
  settings?: any;
  tags: string[];
}

interface AlgorithmVisualizationActivityProps {
  activity: LearningActivity;
  onComplete?: (score: number, maxScore: number, success: boolean) => void;
}

export default function AlgorithmVisualizationActivity({ activity, onComplete }: AlgorithmVisualizationActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showAlreadyClaimedDialog, setShowAlreadyClaimedDialog] = useState(false);
  const [awardedDiamonds, setAwardedDiamonds] = useState<number>(activity.diamondReward || 0);
  const [awardedXP, setAwardedXP] = useState<number>(activity.experienceReward || 0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check auth (best effort)
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
          (typeof document !== "undefined" && document.cookie.includes("next-auth.session-token"));
        setIsAuthenticated(!!userSession);
      }
    };
    checkAuth();
  }, []);

  // Init audio + speech
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        synthRef.current = window.speechSynthesis;

        const initAudio = async () => {
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            try {
              await audioContextRef.current.resume();
            } catch {}
          }
        };

        document.addEventListener("click", initAudio, { once: true });
        document.addEventListener("keydown", initAudio, { once: true });
        return () => {
          document.removeEventListener("click", initAudio);
          document.removeEventListener("keydown", initAudio);
        };
      } catch {}
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio helpers
  const playBeep = async (frequency: number = 440, duration: number = 200, type: OscillatorType = "sine") => {
    if (isMuted || !audioContextRef.current) return;

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration / 1000);
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch {}
  };

  const playStepSound = async (stepData: VisualizationStep) => {
    if (isMuted) return;
    const action = stepData.action?.toLowerCase() || "";
    if (action.includes("swap") || action.includes("exchange")) {
      await playBeep(600, 150);
      setTimeout(() => playBeep(400, 150), 100);
    } else if (action.includes("found") || action.includes("match") || action.includes("success")) {
      await playBeep(523, 200);
      setTimeout(() => playBeep(659, 200), 100);
      setTimeout(() => playBeep(784, 300), 200);
    } else if (action.includes("compare") || action.includes("check")) {
      await playBeep(800, 100);
    } else if (action.includes("minimum") || action.includes("maximum")) {
      await playBeep(700, 200);
      setTimeout(() => playBeep(500, 200), 150);
    } else {
      await playBeep(440, 150, "triangle");
    }
  };

  const speakDescription = (text: string) => {
    if (isMuted || !synthRef.current || !text) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = volume;
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(
      (voice) => voice.lang.includes("en") && (voice.name.includes("Google") || voice.name.includes("Alex") || voice.name.includes("Samantha"))
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    synthRef.current.speak(utterance);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && synthRef.current) synthRef.current.cancel();
  };

  // Normalize content
  const contentAny: any = activity.content || {};
  // Dev aid: surface the incoming shape once
  if (typeof window !== "undefined" && !(window as any).__algoVizLogged) {
    (window as any).__algoVizLogged = true;
    try { console.debug("[AlgoViz] incoming content shape", { keys: Object.keys(contentAny || {}), contentAny }); } catch {}
  }
  const alg: any = contentAny.algorithm || {};
  const rawSteps: any[] =
    Array.isArray(contentAny.steps) ? contentAny.steps :
    Array.isArray(contentAny?.visualization?.steps) ? contentAny.visualization.steps :
    Array.isArray(alg.steps) ? alg.steps :
    Array.isArray(alg?.visualization?.steps) ? alg.visualization.steps :
    Array.isArray(contentAny.algorithmVisualization?.steps) ? contentAny.algorithmVisualization.steps :
    Array.isArray(contentAny.stepList) ? contentAny.stepList :
    [];

  const algorithm: string = (typeof alg.name === "string" && alg.name) || (typeof contentAny.algorithm === "string" ? contentAny.algorithm : undefined) || "Algorithm";
  const description: string = (typeof contentAny.description === "string" && contentAny.description) || (typeof contentAny.title === "string" && contentAny.title) || "No description available";
  const timeComplexity: string = (alg?.complexity?.time as string) || (alg?.complexity?.Time as string) || "Unknown";
  const spaceComplexity: string = (alg?.complexity?.space as string) || (alg?.complexity?.Space as string) || "Unknown";
  const explanation: string = (typeof contentAny.explanation === "string" && contentAny.explanation) || (typeof contentAny.description === "string" && contentAny.description) || "No explanation available";

  const normalizedSteps: VisualizationStep[] = Array.isArray(rawSteps)
    ? rawSteps.map((s: any, idx: number) => {
        const viz: any = s?.visualization || {};
        let data: number[] = [];
        if (Array.isArray(viz.data) && viz.data.every((n: any) => typeof n === "number")) {
          data = viz.data as number[];
        } else if (Array.isArray(s?.data) && s.data.every((n: any) => typeof n === "number")) {
          data = s.data as number[];
        } else if (Array.isArray(viz.list_data)) {
          data = viz.list_data.map((x: any, i: number) => (typeof x === "number" ? x : Array.isArray(x) ? x.length : i + 1));
        } else if (Array.isArray(viz.values) && viz.values.every((n: any) => typeof n === "number")) {
          data = viz.values as number[];
        } else if (Array.isArray(viz.array) && viz.array.every((n: any) => typeof n === "number")) {
          data = viz.array as number[];
        } else if (Array.isArray(viz.bars) && viz.bars.every((n: any) => typeof n === "number")) {
          data = viz.bars as number[];
        } else if (typeof viz.data === "string") {
          data = (viz.data as string).split("").map((_, i) => i + 1);
        } else {
          data = [1, 2, 3, 4, 5];
        }
        const highlights: number[] = Array.isArray(viz.comparing)
          ? (viz.comparing as number[])
          : Array.isArray(viz.highlight)
          ? (viz.highlight as number[])
          : Array.isArray(s?.highlights)
          ? (s.highlights as number[])
          : Array.isArray(viz.highlightIndices)
          ? (viz.highlightIndices as number[])
          : [];
        return {
          id: typeof s?.id === "number" ? s.id : idx,
          description: (s?.description as string) || (s?.title as string) || (s?.action as string) || "Step",
          data,
          highlights,
          comparison: [],
          action: (s?.action as string) || (s?.title as string) || (s?.description as string) || "Step",
        } as VisualizationStep;
      })
    : [];

  // Start timer when component mounts
  useEffect(() => {
    if (!startTime) setStartTime(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoplay
  useEffect(() => {
    const safeStepsLength = Array.isArray(normalizedSteps) ? normalizedSteps.length : 1;
    if (isPlaying && currentStep < safeStepsLength - 1) {
      const t = setTimeout(() => setCurrentStep((s) => s + 1), 2500);
      return () => clearTimeout(t);
    } else if (isPlaying && currentStep === safeStepsLength - 1) {
      setIsPlaying(false);
      if (!isCompleted) {
        setIsCompleted(true);
        setEndTime(new Date());
        handleActivityCompletion();
      }
    }
  }, [isPlaying, currentStep, normalizedSteps, isCompleted]);

  // On step change
  useEffect(() => {
    if (currentStep >= 0 && normalizedSteps.length > 0) {
      const stepData = normalizedSteps[currentStep];
      if (stepData) {
        playStepSound(stepData);
        setTimeout(() => speakDescription(stepData.description), 400);
      }
    }
  }, [currentStep, normalizedSteps, isMuted, volume]);

  const handleActivityCompletion = async () => {
    try {
      setCompleting(true);

      const backParams = new URLSearchParams();
      const category = searchParams?.get("category") || "";
      const type = searchParams?.get("type") || "";
      if (category) backParams.set("category", category);
      if (type) backParams.set("type", type);
      const backHref = backParams.toString() ? `/activities?${backParams.toString()}` : "/activities";

      const pct = 85; // fixed demo score for visualization
      const tSpent = startTime && endTime ? Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000)) : undefined;

      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: (activity as any).slug,
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
      console.error("Algorithm visualization completion error:", error);
      toast({
        title: "Error",
        description: "An error occurred while completing the activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const playPause = () => setIsPlaying((p) => !p);
  const reset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setIsCompleted(false);
  };
  const nextStep = () => {
    const safeStepsLength = Array.isArray(normalizedSteps) ? normalizedSteps.length : 1;
    if (currentStep < safeStepsLength - 1) {
      setCurrentStep((s) => s + 1);
    } else if (!isCompleted) {
      setIsCompleted(true);
      setEndTime(new Date());
      handleActivityCompletion();
      if (!isMuted) {
        setTimeout(() => {
          playBeep(523, 200);
          setTimeout(() => playBeep(659, 200), 200);
          setTimeout(() => playBeep(784, 200), 400);
          setTimeout(() => playBeep(1047, 400), 600);
        }, 100);
      }
    }
  };
  const prevStep = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  const getBarColor = (index: number) => {
    const step = normalizedSteps[currentStep];
    if (!step) return "bg-blue-500";
    if (Array.isArray(step.highlights) && step.highlights.includes(index)) return "bg-yellow-500";
    if (Array.isArray(step.comparison) && step.comparison.includes(index)) return "bg-red-500";
    return "bg-blue-500";
  };

  const safeSteps: VisualizationStep[] = normalizedSteps.length > 0 ? normalizedSteps : [{ id: 0, description: "No visualization data available", data: [1,2,3,4,5], action: "Sample data" }];
  const currentStepData = safeSteps[currentStep] || safeSteps[0];
  const safeData = Array.isArray(currentStepData?.data) ? currentStepData.data : [1,2,3,4,5];
  const maxValue = Math.max(...safeData);

  // Build backHref and modals
  const backHref = (() => {
    const category = searchParams?.get("category") || "";
    const type = searchParams?.get("type") || "";
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (type) qs.set("type", type);
    const s = qs.toString();
    return s ? `/activities?${s}` : "/activities";
  })();

  useEffect(() => {
    if (showRewardDialog || showAlreadyClaimedDialog) {
      const timer = setTimeout(() => {
        router.push(backHref);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRewardDialog, showAlreadyClaimedDialog, router, backHref]);

  const rewardModal = (
    <Dialog
      open={showRewardDialog}
      onOpenChange={(open) => {
        setShowRewardDialog(open);
        if (!open) router.push(backHref);
      }}
    >
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
    <Dialog
      open={showAlreadyClaimedDialog}
      onOpenChange={(open) => {
        setShowAlreadyClaimedDialog(open);
        if (!open) router.push(backHref);
      }}
    >
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

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Title/description removed: handled by page-level header */}

      {/* Algorithm Info */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-purple-50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-purple-900">{algorithm}</h3>
          <p className="mb-4 text-purple-800">{description}</p>
          <div className="space-y-2 text-sm">
            <div><strong>Time Complexity:</strong> {timeComplexity}</div>
            <div><strong>Space Complexity:</strong> {spaceComplexity}</div>
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 p-6">
          <h3 className="mb-4 text-xl font-semibold text-blue-900">How it Works</h3>
          <p className="text-blue-800">{explanation}</p>
        </div>
      </div>

      {/* Visualization */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Algorithm Visualization</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {Array.isArray(normalizedSteps) ? normalizedSteps.length : 1}</span>
            <div className="flex items-center space-x-2">
              <button onClick={toggleMute} className={`rounded-lg p-2 transition-colors ${isMuted ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`} title={isMuted ? "Unmute audio" : "Mute audio"}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              {!isMuted && (
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="h-2 w-16 cursor-pointer rounded-lg bg-gray-200" title="Volume" />
              )}
              <button onClick={reset} className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200" title="Reset to beginning">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={playPause} className="rounded-lg bg-purple-600 p-2 text-white hover:bg-purple-700" title={isPlaying ? "Pause animation" : "Play animation"}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-purple-600 transition-all duration-300" style={{ width: `${((currentStep + 1) / (Array.isArray(normalizedSteps) ? normalizedSteps.length : 1)) * 100}%` }} />
          </div>
        </div>

        {/* Array Visualization */}
        <div className="mb-6">
          <div className="flex items-end justify-center space-x-2" style={{ height: "200px" }}>
            {safeData.map((value, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className={`w-12 transition-all duration-500 ${getBarColor(index)}`} style={{ height: `${(value / maxValue) * 150 + 20}px` }} />
                <div className="mt-2 text-xs text-gray-600">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Description */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-2 font-semibold text-gray-900">{currentStepData?.description || "No description available"}</div>
          <div className="text-sm text-gray-600"><strong>Action:</strong> {currentStepData?.action || "No action available"}</div>
          {!isMuted && audioContextRef.current && (
            <div className="mt-2 flex items-center text-xs text-green-600">🎵 Audio enabled - Listen for step sounds and descriptions</div>
          )}
          {isMuted && (
            <div className="mt-2 flex items-center text-xs text-red-600">🔇 Audio muted - Click volume button to enable sounds</div>
          )}
          {!audioContextRef.current && (
            <div className="mt-2 flex items-center text-xs text-orange-600">⚠️ Audio not supported in this browser</div>
          )}
        </div>

        {/* Navigation */}
        {!isCompleted && (
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => prevStep()} disabled={currentStep === 0} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <div className="flex items-center space-x-2">
              {(Array.isArray(normalizedSteps) ? normalizedSteps : [{}]).map((_, index) => (
                <button key={index} onClick={() => setCurrentStep(index)} className={`h-3 w-3 rounded-full transition-all ${index === currentStep ? "bg-purple-600" : index < currentStep ? "bg-purple-300" : "bg-gray-200"}`} />
              ))}
            </div>
            <button onClick={() => nextStep()} className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Completion */}
      {isCompleted && (
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Trophy className="h-10 w-10" />
          </div>
          <h3 className="mb-4 text-2xl font-bold text-gray-900">Visualization Complete!</h3>
          <p className="mb-6 text-gray-600">You've successfully learned how the {algorithm} algorithm works!</p>
          {isAuthenticated ? (
            <Button onClick={handleActivityCompletion} disabled={completing || completed} className="px-6">
              {completing ? "Processing..." : completed ? "Completed" : "Claim Rewards"}
            </Button>
          ) : (
            <Button onClick={() => router.push(backHref)} className="px-6">
              Finish and Go to List
            </Button>
          )}
        </div>
      )}

      {/* Reward Animation */
      }
      {showRewardAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative rounded-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 p-8 text-center shadow-2xl">
            <h3 className="mb-4 text-3xl font-bold text-white">🎉 Algorithm Mastered! 🎉</h3>
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-center space-x-3 rounded-lg bg-yellow-500/20 p-3">
                <span className="text-xl font-semibold text-yellow-300">+{activity.diamondReward || 30} Diamonds</span>
              </div>
              <div className="flex items-center justify-center space-x-3 rounded-lg bg-blue-500/20 p-3">
                <Star className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-semibold text-blue-300">+{activity.experienceReward || 50} Experience</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rewards Modals */}
      {rewardModal}
      {alreadyClaimedModal}
    </div>
  );
}

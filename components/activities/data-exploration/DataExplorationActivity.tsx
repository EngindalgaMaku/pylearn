"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, TrendingUp, Trophy, XCircle, Star } from "lucide-react";

type Task = { id: number; task: string; points: number; correctAnswers?: string[]; hint?: string };

type StructuredDataset = {
  name?: string;
  columns?: string[];
  data?: any[][];
};

type SeedQuestion = {
  id?: string | number;
  question?: string;
  points?: number;
  answer?: string | string[];
  correctAnswer?: string | string[];
  answers?: string[];
  hint?: string;
};

type SeedSchema = {
  title?: string;
  instructions?: string;
  dataset?: any[]; // array of objects
  questions?: SeedQuestion[];
  hints?: string[];
};

type StructuredSchema = {
  instructions?: string;
  dataset?: StructuredDataset;
  tasks?: Array<{ id?: number; task: string; points: number; answer?: string | string[]; answers?: string[]; expectedAnswer?: string | string[]; hint?: string }>;
  hints?: string[];
};

type Activity = {
  id: string;
  title: string;
  description?: string;
  activityType: string;
  diamondReward?: number;
  experienceReward?: number;
  content?: any; // parsed object preferred
};

export default function DataExplorationActivity({ activity }: { activity: Activity }) {
  const raw: any = activity?.content ?? {};

  const instructions: string =
    typeof raw.instructions === "string" && raw.instructions.trim() !== ""
      ? raw.instructions
      : "Explore the dataset below and complete the analysis tasks.";

  const hints = Array.isArray(raw.hints) ? raw.hints.filter((h: any) => typeof h === "string") : [];

  // Determine schema type
  const isSeed = Array.isArray(raw?.dataset);

  let datasetName: string =
    typeof raw?.title === "string" && raw.title.trim() !== "" ? raw.title : "Dataset";
  let columns: string[] = [];
  let dataRows: any[][] = [];
  let tasks: Task[] = [];

  if (isSeed) {
    // Seed schema: dataset: Array<object>, questions: Array<{question, points?}>
    const records: any[] = Array.isArray(raw.dataset) ? raw.dataset : [];
    const colSet = new Set<string>();
    for (const rec of records) {
      if (rec && typeof rec === "object") Object.keys(rec).forEach((k) => colSet.add(k));
    }
    columns = Array.from(colSet);
    dataRows = records.map((rec) => columns.map((c) => (rec ? rec[c] : undefined)));

    const qs: SeedQuestion[] = Array.isArray(raw.questions) ? (raw.questions as SeedQuestion[]) : [];
    tasks = qs.map((q, i): Task => {
      const id = Number.isFinite(q?.id as any) ? Number(q!.id) : i + 1;
      const taskText = String(q?.question ?? `Question ${i + 1}`);
      const points = Number.isFinite(q?.points) ? Number(q!.points) : 10;
      const rawAns = (q?.answer ?? q?.correctAnswer ?? q?.answers) as string | string[] | undefined;
      const correctAnswers = Array.isArray(rawAns)
        ? rawAns.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
        : typeof rawAns === "string"
        ? [rawAns.trim().toLowerCase()].filter(Boolean)
        : undefined;
      const hint = typeof q?.hint === "string" ? q!.hint : undefined;
      return { id, task: taskText, points, correctAnswers, hint };
    });
  } else {
    // Structured schema
    const ds: StructuredDataset = raw?.dataset ?? {};
    datasetName = typeof ds?.name === "string" && ds.name.trim() !== "" ? ds.name : datasetName;
    columns = Array.isArray(ds?.columns) ? (ds.columns as string[]) : [];
    dataRows = Array.isArray(ds?.data) ? (ds.data as any[][]) : [];

    const ts: any[] = Array.isArray(raw?.tasks) ? raw.tasks : [];
    tasks = ts
      .filter((t) => t && typeof t.task === "string" && t.points !== undefined)
      .map((t: any, i: number): Task => {
        const id = Number.isFinite(t?.id) ? Number(t.id) : i + 1;
        const rawAns = (t?.answer ?? t?.answers ?? t?.expectedAnswer) as string | string[] | undefined;
        const correctAnswers = Array.isArray(rawAns)
          ? rawAns.map((s) => String(s).trim().toLowerCase()).filter(Boolean)
          : typeof rawAns === "string"
          ? [rawAns.trim().toLowerCase()].filter(Boolean)
          : undefined;
        const hint = typeof t?.hint === "string" ? t.hint : undefined;
        return { id, task: String(t.task), points: Number(t.points) || 10, correctAnswers, hint };
      });
  }

  // UI state
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [correctMap, setCorrectMap] = useState<Record<number, boolean>>({});
  const [showResults, setShowResults] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [hintRevealed, setHintRevealed] = useState<Record<number, number>>({});
  const rawTimeLimit = (raw?.timeLimitSec ?? raw?.timeLimit ?? raw?.settings?.timeLimit) as number | undefined;
  const initialTime = useMemo(() => {
    if (typeof rawTimeLimit === "number" && rawTimeLimit > 0) {
      // If likely minutes (small number), convert to seconds
      return rawTimeLimit > 60 ? Math.floor(rawTimeLimit) : Math.floor(rawTimeLimit * 60);
    }
    return 0;
  }, [rawTimeLimit]);
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch("/api/auth/session");
        const s = await r.json();
        setIsAuthed(!!s?.user);
      } catch {
        setIsAuthed(false);
      }
    };
    check();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (showResults || !timeLeft || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          // Auto-submit when timer hits zero
          setTimeout(() => submit(), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft, showResults]);

  const handleTaskAnswer = (id: number, val: string) => setAnswers((prev) => ({ ...prev, [id]: val }));
  const completeTask = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    const userAns = (answers[id] || "").trim().toLowerCase();
    let isCorrect = false;
    if (task?.correctAnswers && task.correctAnswers.length > 0) {
      isCorrect = task.correctAnswers.includes(userAns);
    } else {
      // If no correct answers provided, consider any non-empty answer as completion but not necessarily correct
      isCorrect = userAns.length > 0;
    }
    setCorrectMap((m) => ({ ...m, [id]: isCorrect }));
    setCompleted((prev) => new Set(prev).add(id));
  };

  const submit = async () => {
    setShowResults(true);

    // Compute earned using correctness
    const total = tasks.reduce((s, t) => s + (t?.points || 0), 0);
    const earned = tasks.reduce((sum, t) => sum + ((correctMap[t.id] ? t.points : 0) || 0), 0);
    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    const success = score >= 70;

    if (success && isAuthed) {
      try {
        const res = await fetch("/api/learning-activities/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: "data_exploration",
            activityId: activity.id,
            activityTitle: activity.title,
            score: Math.max(70, score),
            timeSpent: 600,
            success: true,
            diamondReward: activity.diamondReward || 60,
            experienceReward: activity.experienceReward || 90,
          }),
        });
        if (res.ok) {
          setShowRewardAnimation(true);
          setTimeout(() => setShowRewardAnimation(false), 3000);
        }
      } catch {
        // ignore
      }
    }
  };

  // Validation guard
  if (!columns.length || !dataRows.length || !tasks.length) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <div className="mb-2 text-lg font-semibold text-red-500">Data Exploration Activity Error</div>
          <p className="text-gray-600">This activity doesn't have a valid dataset and tasks.</p>
        </div>
      </div>
    );
  }

  const computeStats = (colIdx: number) => {
    try {
      const vals = dataRows
        .map((r) => r?.[colIdx])
        .filter((v) => typeof v === "number" && !Number.isNaN(v)) as number[];
      if (vals.length === 0) return null;
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = sum / vals.length;
      return { min: Math.min(...vals), max: Math.max(...vals), avg: avg.toFixed(2) };
    } catch {
      return null;
    }
  };

  const Results = () => {
    const total = tasks.reduce((s, t) => s + (t?.points || 0), 0);
    const earned = tasks.reduce((sum, t) => sum + ((correctMap[t.id] ? t.points : 0) || 0), 0);
    const score = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passed = score >= 70;

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <div className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
          </div>
          <h2 className="mb-2 text-3xl font-bold text-gray-900">{passed ? "Data Analysis Complete!" : "Keep Exploring!"}</h2>
          <p className="mb-8 text-lg text-gray-600">You completed {completed.size} out of {tasks.length} analysis tasks</p>
          <div className="mb-8 rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-4xl font-bold text-gray-900">{score}%</div>
            <div className={`text-lg font-semibold ${passed ? "text-green-600" : "text-red-600"}`}>{passed ? "Data Scientist!" : "More Analysis Needed"}</div>
          </div>
          <div className="mx-auto mb-8 max-w-3xl text-left">
            <h4 className="mb-3 font-semibold text-gray-900">Detailed Report</h4>
            <div className="space-y-3">
              {tasks.map((t) => {
                const user = answers[t.id] || "";
                const corr = correctMap[t.id] || false;
                const corrText = (t.correctAnswers || []).join(", ");
                return (
                  <div key={t.id} className="rounded-md border border-gray-200 p-3">
                    <div className="mb-1 font-medium text-gray-900">{t.task}</div>
                    <div className="text-sm text-gray-700">Your answer: <span className="font-medium">{user || "(empty)"}</span></div>
                    <div className="text-sm {corr ? 'text-green-600' : 'text-red-600'}">{corr ? 'Correct' : 'Incorrect'}</div>
                    {t.correctAnswers && t.correctAnswers.length > 0 && (
                      <div className="text-sm text-gray-700">Expected: <span className="font-mono">{corrText}</span></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {showRewardAnimation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="relative rounded-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 p-8 text-center shadow-2xl">
                <h3 className="mb-4 text-3xl font-bold text-white">🎉 Data Scientist! 🎉</h3>
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-center space-x-3 rounded-lg bg-yellow-500/20 p-3">
                    <span className="text-xl font-semibold text-yellow-300">+{activity.diamondReward || 60} Diamonds</span>
                  </div>
                  <div className="flex items-center justify-center space-x-3 rounded-lg bg-blue-500/20 p-3">
                    <Star className="h-8 w-8 text-blue-400" />
                    <span className="text-xl font-semibold text-blue-300">+{activity.experienceReward || 90} Experience</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (showResults) return <Results />;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">{activity.title}</h2>
        {activity.description && <p className="text-lg text-gray-600">{activity.description}</p>}
      </div>

      <div className="mb-8 rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 text-xl font-semibold text-blue-900">Instructions</h3>
        <p className="text-blue-800">{instructions}</p>
        {initialTime > 0 && (
          <div className="mt-2 text-sm text-blue-900">Time left: <span className="font-semibold">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span></div>
        )}
        {hints.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setShowHints((s) => !s)} className="text-sm text-blue-600 hover:text-blue-800">
              {showHints ? "Hide" : "Show"} hints
            </button>
            {showHints && (
              <div className="mt-2 space-y-1">
                {hints.map((h: string, i: number) => (
                  <div key={i} className="text-sm text-blue-700">• {h}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">📊 Dataset: {datasetName}</h3>
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((c, i) => (
                      <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {dataRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                          {typeof cell === "object" && cell !== null ? JSON.stringify(cell) : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 font-semibold text-gray-900">📈 Quick Stats</h4>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div>Rows: {dataRows.length}</div>
              <div>Columns: {columns.length}</div>
              {columns.map((col, idx) => {
                const s = computeStats(idx);
                return s ? (
                  <div key={idx} className="col-span-2">
                    <strong>{col}:</strong> Avg: {s.avg}, Min: {s.min}, Max: {s.max}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">🎯 Analysis Tasks</h3>
          <div className="space-y-4">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{t.task}</div>
                    <div className="text-sm text-gray-600">Worth {t.points} points</div>
                    {t.hint && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => setHintRevealed((m) => ({ ...m, [t.id]: (m[t.id] || 0) + 1 }))}
                      >
                        Reveal hint ({hintRevealed[t.id] || 0})
                      </button>
                    )}
                    {t.hint && (hintRevealed[t.id] || 0) > 0 && (
                      <div className="mt-1 text-xs text-blue-700">Hint: {t.hint}</div>
                    )}
                  </div>
                  <div className={`rounded-full p-1 ${completed.has(t.id) ? (correctMap[t.id] ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600") : "bg-gray-100 text-gray-400"}`}>
                    {completed.has(t.id) ? (correctMap[t.id] ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />) : <TrendingUp className="h-5 w-5" />}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter your answer..."
                    value={answers[t.id] || ""}
                    onChange={(e) => handleTaskAnswer(t.id, e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => completeTask(t.id)}
                    disabled={!answers[t.id] || completed.has(t.id)}
                    className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {completed.has(t.id) ? "✓" : "Submit"}
                  </button>
                </div>
                {completed.has(t.id) && t.correctAnswers && t.correctAnswers.length > 0 && (
                  <div className="mt-2 text-xs text-gray-700">Expected: <span className="font-mono">{t.correctAnswers.join(", ")}</span></div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Progress</span>
              <span className="text-sm text-blue-700">{completed.size}/{tasks.length} tasks completed</span>
            </div>
            <div className="h-2 w-full rounded-full bg-blue-200">
              <div className="h-2 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${tasks.length > 0 ? (completed.size / tasks.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button onClick={submit} disabled={completed.size === 0} className="rounded-lg bg-green-600 px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">Submit Data Analysis</button>
      </div>
    </div>
  );
}

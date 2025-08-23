"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, Trophy, Move } from "lucide-react";

interface CodeBlock {
  id: number;
  code: string;
  type: string;
}

interface CodeBuilderContent {
  instructions: string;
  codeBlocks: CodeBlock[];
  correctOrder: number[];
  explanation?: string;
  // seed-compatible fields
  availableBlocks?: { code: string; type?: string }[];
  solution?: string[];
  allowBlockReuse?: boolean;
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
  content: CodeBuilderContent;
  settings?: any;
  tags: string[];
}

interface CodeBuilderActivityProps {
  activity: LearningActivity;
  onComplete?: (score: number, maxScore: number, success: boolean) => void;
}

export default function CodeBuilderActivity({ activity, onComplete = () => {} }: CodeBuilderActivityProps) {
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [arrangedBlocks, setArrangedBlocks] = useState<CodeBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<CodeBlock | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // internal counter to create unique instance IDs when reusing blocks (ref to avoid re-render loops)
  const instanceCounterRef = useRef(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build back href preserving filters
  const backParams = new URLSearchParams();
  const cat = searchParams?.get("category") || "";
  const typ = searchParams?.get("type") || "";
  if (cat) backParams.set("category", cat);
  if (typ) backParams.set("type", typ);
  const backHref = backParams.toString() ? `/activities?${backParams.toString()}` : "/activities";

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
          (typeof document !== "undefined" && document.cookie.includes("next-auth.session-token"));
        setIsAuthenticated(!!userSession);
      }
    };
    checkAuth();
  }, []);

  // Normalize content to support both classic schema (codeBlocks + correctOrder)
  // and seed schema (availableBlocks + solution)
  const raw: any = activity?.content ?? {};
  // Feature flag: allow block reuse (available blocks "loop" - infinite copies)
  const allowBlockReuse: boolean = !!(raw?.allowBlockReuse ?? false);
  // Key to detect content changes reliably for memoization
  const rawKey = JSON.stringify(raw);

  const instructions: string =
    typeof raw.instructions === "string" && raw.instructions.trim() !== ""
      ? raw.instructions
      : "Build the program using the code blocks in the correct order";

  const explanation: string | undefined =
    typeof raw.explanation === "string" ? raw.explanation : undefined;

  // Classic schema
  const classicBlocks: any[] = Array.isArray(raw.codeBlocks) ? raw.codeBlocks : [];
  const classicOrder: any[] = Array.isArray(raw.correctOrder) ? raw.correctOrder : [];

  // Seed schema (from repository seeds)
  const seedBlocksRaw: any[] = Array.isArray(raw.availableBlocks) ? raw.availableBlocks : [];
  const seedSolution: string[] = Array.isArray(raw.solution) ? raw.solution : [];

  // Build normalized blocks and correct order (memoized to prevent re-render loops)
  const { codeBlocks, correctOrder } = useMemo(() => {
    let cb: CodeBlock[] = [];
    let order: number[] = [];

    if (classicBlocks.length > 0 && classicOrder.length > 0) {
      // Use classic directly (ensure types)
      cb = classicBlocks.map((b: any) => ({
        id: Number(b?.id),
        code: String(b?.code ?? ""),
        type: String(b?.type ?? "block"),
      }));
      order = classicOrder.map((id: any) => Number(id));
    } else if (seedBlocksRaw.length > 0 && seedSolution.length > 0) {
      // Map seed availableBlocks -> numeric ids
      cb = seedBlocksRaw.map((b: any, i: number) => ({
        id: i + 1,
        code: String(b?.code ?? ""),
        type: String(b?.type ?? "block"),
      }));

      // Build code -> id map (by trimmed code)
      const codeToId = new Map<string, number>();
      cb.forEach((blk) => {
        const key = blk.code.trim();
        // Only set if not already, to keep first occurrence for duplicates
        if (!codeToId.has(key)) codeToId.set(key, blk.id);
      });

      // Create correct order by matching solution's code strings
      order = seedSolution
        .map((line) => {
          const id = codeToId.get(String(line).trim());
          return typeof id === "number" ? id : undefined;
        })
        .filter((id): id is number => typeof id === "number");

      // If for any reason mapping failed (sizes differ), fall back to sequential order
      if (order.length !== seedSolution.length) {
        order = cb.map((b) => b.id);
      }
    } else {
      // Fallback: leave empty; UI will still render safely
      cb = [];
      order = [];
    }

    return { codeBlocks: cb, correctOrder: order };
  }, [rawKey]);

  // Initialize blocks in random order
  useEffect(() => {
    const shuffledBlocks = [...codeBlocks].sort(() => Math.random() - 0.5);
    setBlocks(shuffledBlocks);
  }, [codeBlocks]);

  const handleDragStart = (block: CodeBlock) => {
    setDraggedBlock(block);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropToArranged = (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedBlock) return;

    // When reuse is enabled, we CLONE the dragged block for arranged area
    // so the available list retains the original.
    // Otherwise, we move it (remove from available).
    let blockToPlace: CodeBlock = draggedBlock;

    if (allowBlockReuse) {
      // make a unique clone: keep code/type, assign a unique negative id for keying
      const uniqueId = -instanceCounterRef.current++;
      blockToPlace = {
        ...draggedBlock,
        id: uniqueId,
      };
      // Ensure we DON'T remove from available blocks when reusing
    } else {
      // Remove from blocks (move semantics)
      setBlocks(blocks.filter((b) => b.id !== draggedBlock.id));
    }

    // Add to arranged blocks at specified position
    if (insertIndex !== undefined) {
      const newArranged = [...arrangedBlocks];
      newArranged.splice(insertIndex, 0, blockToPlace);
      setArrangedBlocks(newArranged);
    } else {
      setArrangedBlocks([...arrangedBlocks, blockToPlace]);
    }

    setDraggedBlock(null);
  };

  const handleDropToBlocks = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedBlock) return;

    // Remove from arranged blocks (always allowed)
    setArrangedBlocks(arrangedBlocks.filter((b) => b.id !== draggedBlock.id));

    if (!allowBlockReuse) {
      // Only add back to available when we were doing move semantics
      setBlocks([...blocks, draggedBlock]);
    }
    // If reuse was enabled, the available list already has the original; do nothing

    setDraggedBlock(null);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newArranged = [...arrangedBlocks];
    const [movedBlock] = newArranged.splice(fromIndex, 1);
    newArranged.splice(toIndex, 0, movedBlock);
    setArrangedBlocks(newArranged);
  };

  const checkOrder = () => {
    setShowResults(true);

    // Build user order mapped back to ORIGINAL block IDs by matching code text.
    // This keeps scoring compatible when allowBlockReuse created cloned IDs.
    const arrangedCodes = arrangedBlocks.map((b) => b.code.trim());

    // Build an ordered list of original blocks corresponding to the correctOrder
    const originalIdToCode = new Map<number, string>();
    codeBlocks.forEach((b) => originalIdToCode.set(b.id, b.code.trim()));

    // Convert correct order into required code sequence
    const requiredCodes = correctOrder.map((id) => originalIdToCode.get(id) ?? "");

    // Compare by code text positionally
    const correctMatches = arrangedCodes.filter((code, index) => code === requiredCodes[index]).length;

    const score = Math.round((correctMatches / (requiredCodes.length || 1)) * 100);
    const success = score >= 70;

    // For authenticated users, allow claiming after showing results; unauth users get Finish button
  };

  const claimRewards = async (score: number) => {
    try {
      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: activity.slug,
          score: Math.max(70, score),
          timeSpent: activity.estimatedMinutes ? activity.estimatedMinutes * 60 : undefined,
        }),
        cache: "no-store",
      });
      // Regardless of already completed or newly completed, redirect back after a short delay
      setTimeout(() => {
        router.push(backHref);
      }, 1200);
    } catch (e) {
      // On error, still navigate back to list to keep UX consistent
      router.push(backHref);
    }
  };

  const reset = () => {
    const shuffledBlocks = [...codeBlocks].sort(() => Math.random() - 0.5);
    setBlocks(shuffledBlocks);
    setArrangedBlocks([]);
    setShowResults(false);
  };

  if (showResults) {
    // For results view, compute by code match (compatible with reuse)
    const arrangedCodes = arrangedBlocks.map((b) => b.code.trim());
    const originalIdToCode = new Map<number, string>();
    codeBlocks.forEach((b) => originalIdToCode.set(b.id, b.code.trim()));
    const requiredCodes = correctOrder.map((id) => originalIdToCode.get(id) ?? "");

    const correctMatches = arrangedCodes.filter((code, index) => code === requiredCodes[index]).length;
    const score = Math.round((correctMatches / (requiredCodes.length || 1)) * 100);
    const passed = score >= 70;

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center">
          <div
            className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${
              passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            {passed ? (
              <Trophy className="h-10 w-10" />
            ) : (
              <XCircle className="h-10 w-10" />
            )}
          </div>

          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            {passed ? "Code Built Successfully!" : "Keep Building!"}
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            You got {arrangedCodes.filter((code, index) => code === requiredCodes[index]).length} out of {correctOrder.length} blocks in the
            correct order
          </p>

          <div className="mb-8 rounded-lg bg-gray-50 p-6">
            <div className="mb-2 text-4xl font-bold text-gray-900">{score}%</div>
            <div className={`text-lg font-semibold ${passed ? "text-green-600" : "text-red-600"}`}>
              {passed ? "Perfect Structure!" : "Review the Code Structure"}
            </div>
          </div>

          {explanation && (
            <div className="mb-8 rounded-lg bg-blue-50 p-6 text-left">
              <h3 className="mb-4 text-xl font-semibold text-blue-900">Code Explanation</h3>
              <p className="text-blue-800">{explanation}</p>
            </div>
          )}

          <div className="mb-8 space-y-4 text-left">
            <h3 className="text-xl font-semibold text-gray-900">Correct Order:</h3>
            <div className="rounded-lg bg-gray-900 p-4">
              {correctOrder.map((id, index) => {
                const block = codeBlocks.find((b) => b.id === id);
                const requiredCode = block?.code?.trim() ?? "";
                const userCode = arrangedBlocks[index]?.code?.trim();
                const isCorrect = userCode === requiredCode;
                return (
                  <div
                    key={`${id}-${index}`}
                    className={`mb-2 rounded bg-gray-800 p-3 font-mono text-sm ${
                      isCorrect ? "border-l-4 border-green-500" : "border-l-4 border-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-green-400">{requiredCode}</span>
                      <span className={`text-xs ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button onClick={reset} className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50">
              Try Again
            </button>
            {!passed ? null : (
              isAuthenticated ? (
                <button
                  onClick={() => claimRewards(score)}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Claim rewards
                </button>
              ) : (
                <Link href={backHref} className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700">
                  Finish & Go to List
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 text-xl font-semibold text-blue-900">Instructions</h3>
        <p className="text-blue-800">{instructions}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Available Blocks */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Available Code Blocks</h3>
          <div className="min-h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4" onDragOver={handleDragOver} onDrop={handleDropToBlocks}>
            {blocks.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-gray-500">All blocks used! Drop here to return blocks.</div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block)}
                    className="cursor-move rounded-lg bg-white p-3 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <Move className="h-4 w-4 text-gray-400" />
                      <code className="text-sm text-gray-800">{block.code}</code>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{block.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Code Construction Area */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Build Your Code</h3>
          <div className="min-h-40 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-4" onDragOver={handleDragOver} onDrop={(e) => handleDropToArranged(e)}>
            {arrangedBlocks.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-blue-600">Drag code blocks here to build your program</div>
            ) : (
              <div className="rounded-lg bg-gray-900 p-4">
                {arrangedBlocks.map((block, index) => (
                  <div key={`${block.id}-${index}`} className="group relative">
                    <div draggable onDragStart={() => handleDragStart(block)} className="mb-2 cursor-move rounded bg-gray-800 p-3 transition-all hover:bg-gray-700">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-400">{index + 1}.</span>
                        <code className="text-sm text-green-400">{block.code}</code>
                      </div>
                    </div>

                    {/* Drop zone between blocks */}
                    <div className="absolute -bottom-1 left-0 right-0 h-2 opacity-0 hover:opacity-100" onDragOver={handleDragOver} onDrop={(e) => handleDropToArranged(e, index + 1)}>
                      <div className="h-1 rounded bg-blue-400"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="mb-4 text-sm text-gray-600">
          {allowBlockReuse ? (
            <>Blocks placed: {arrangedBlocks.length}</>
          ) : (
            <>Progress: {arrangedBlocks.length}/{codeBlocks.length} blocks placed</>
          )}
        </div>
        <button
          onClick={checkOrder}
          disabled={allowBlockReuse ? arrangedBlocks.length === 0 || arrangedBlocks.length !== correctOrder.length : arrangedBlocks.length !== codeBlocks.length}
          className="mr-4 rounded-lg bg-green-600 px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Check Code Structure
        </button>
        <button onClick={reset} className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50">
          Reset
        </button>
      </div>
    </div>
  );
}

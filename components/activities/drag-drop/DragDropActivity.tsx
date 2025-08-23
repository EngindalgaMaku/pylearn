"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  RotateCcw,
  Target,
  Lightbulb,
  Trophy,
  Star,
  Diamond,
  Award,
  Gift,
  Sparkles,
  LogIn,
  X,
} from "lucide-react";

// ===== Types =====
interface Block {
  id: number;
  code: string;
  type: string;
}

interface ClassifyItem {
  id: number;
  value: string;
  type: string; // category id
}

interface ClassifyCategory {
  id: string | number;
  name: string;
  description?: string;
}

interface DragDropContent {
  // Order-building schema (original)
  target?: string;
  blocks?: Block[];
  correctOrder?: number[];
  hints?: string[];

  // Classification schema (used by "Python Data Types Explorer")
  items?: Array<{
    id: number | string;
    value?: string; // preferred field for display text
    content?: string; // alternative field some seeds might use
    type: string | number; // category id key
  }>;
  categories?: Array<{
    id: string | number;
    name: string;
    description?: string;
  }>;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Provide consistent colors for different block types (order mode)
function getBlockTypeColor(type: string | undefined): string {
  const key = String(type || "").toLowerCase();
  switch (key) {
    case "import":
    case "setup":
      return "border-blue-300 bg-blue-50";
    case "function":
    case "def":
      return "border-emerald-300 bg-emerald-50";
    case "logic":
    case "if":
    case "for":
      return "border-amber-300 bg-amber-50";
    case "output":
    case "print":
      return "border-violet-300 bg-violet-50";
    default:
      return "border-slate-300 bg-white";
  }
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
  content: DragDropContent;
  settings?: any;
  tags: string[];
  userProgress?: {
    score: number;
    maxScore: number;
    completed: boolean;
    timeSpent: number;
    hintsUsed: number;
    mistakes: number;
    startedAt: string;
    completedAt?: string;
    percentage: number;
  };
}

interface DragDropActivityProps {
  activity: LearningActivity;
  onComplete?: (score: number, maxScore: number, success: boolean) => void;
}

interface DraggedBlock extends Block {
  isPlaced: boolean;
  isDragging: boolean;
}

export default function DragDropActivity({ activity, onComplete }: DragDropActivityProps) {
  // ===== Derived content =====
  const { target, blocks, correctOrder, hints, items, categories } = activity?.content || {};
  const router = useRouter();
  const searchParams = useSearchParams();

  const hasOrderSchema = useMemo(
    () => Array.isArray(blocks) && Array.isArray(correctOrder),
    [blocks, correctOrder]
  );
  const hasClassificationSchema = useMemo(
    () => Array.isArray(items) && Array.isArray(categories),
    [items, categories]
  );

  // ===== Shared state =====
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showAlreadyClaimedDialog, setShowAlreadyClaimedDialog] = useState(false);
  const [awardedDiamonds, setAwardedDiamonds] = useState<number>(activity.diamondReward || 0);
  const [awardedXP, setAwardedXP] = useState<number>(activity.experienceReward || 0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // ===== Order mode state =====
  const [availableBlocks, setAvailableBlocks] = useState<DraggedBlock[]>([]);
  const [droppedBlocks, setDroppedBlocks] = useState<DraggedBlock[]>([]);
  const [draggedItem, setDraggedItem] = useState<DraggedBlock | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const [rewardAwarded, setRewardAwarded] = useState(false);

  // ===== Classification mode state =====
  const [availableItems, setAvailableItems] = useState<ClassifyItem[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, ClassifyItem[]>>({});
  const [classifyDraggedItem, setClassifyDraggedItem] = useState<ClassifyItem | null>(null);
  const [shuffledCategories, setShuffledCategories] = useState<ClassifyCategory[]>([]);
  // Mobile tap-to-assign state
  const [assignTargetItem, setAssignTargetItem] = useState<ClassifyItem | null>(null);
  const [assignFromCategoryId, setAssignFromCategoryId] = useState<string | null>(null);

  // ===== Refs =====
  const availableBlocksRef = useRef<HTMLDivElement | null>(null);
  const droppedBlocksRef = useRef<HTMLDivElement | null>(null);
  const availableItemsRef = useRef<HTMLDivElement | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const setCategoryRef = (id: string | number, el: HTMLDivElement | null) => {
    categoryRefs.current[String(id)] = el;
  };

  const isTouchDevice = useMemo(
    () => typeof window !== "undefined" && ("ontouchstart" in window || (navigator as any)?.maxTouchPoints > 0),
    []
  );

  // One-time mobile tip
  useEffect(() => {
    try {
      if (isTouchDevice && typeof window !== "undefined") {
        const key = "dragdrop_mobile_tip_v1";
        const shown = window.localStorage.getItem(key);
        if (!shown) {
          toast({
            title: "Tip",
            description: "On mobile, tap an item to place it.",
            duration: 3500,
          });
          window.localStorage.setItem(key, "1");
        }
      }
    } catch {
      // ignore
    }
  }, [isTouchDevice]);

  // Haptics helper
  const haptic = (ms = 10) => {
    try {
      if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
        (navigator as any).vibrate(ms);
      }
    } catch {
      // ignore
    }
  };

  // ===== Global window auto-scroll while dragging (mouse) =====
  useEffect(() => {
    const onWindowDragOver = (e: any) => {
      try {
        const viewportThreshold = 40;
        if (e.clientY < viewportThreshold) {
          window.scrollBy({ top: -20, behavior: "smooth" });
        } else if (window.innerHeight - e.clientY < viewportThreshold) {
          window.scrollBy({ top: 20, behavior: "smooth" });
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("dragover", onWindowDragOver);
    return () => window.removeEventListener("dragover", onWindowDragOver);
  }, []);

  // ===== Auth check =====
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const session = await response.json();
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Start timer when component mounts
  useEffect(() => {
    if (!startTime) setStartTime(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Initialize order mode blocks =====
  useEffect(() => {
    try {
      if (Array.isArray(blocks) && blocks.length > 0) {
        const validBlocks = blocks.filter((b: any) => b && typeof b === "object" && b.id !== undefined);
        const shuffledBlocks: DraggedBlock[] = validBlocks
          .map((block: Block) => ({ ...block, isPlaced: false, isDragging: false }))
          .sort(() => Math.random() - 0.5);
        setAvailableBlocks(shuffledBlocks);
      } else {
        setAvailableBlocks([]);
      }
    } catch (e) {
      console.error("Error initializing blocks:", e);
      setAvailableBlocks([]);
    }
  }, [blocks]);

  // ===== Initialize classification mode structures =====
  useEffect(() => {
    try {
      if (Array.isArray(items) && Array.isArray(categories)) {
        const validItems: ClassifyItem[] = items
          .filter(
            (it: any) =>
              it &&
              (typeof it.id === "number" || typeof it.id === "string") &&
              (typeof it.type === "string" || typeof it.type === "number")
          )
          .map((it: any) => ({
            id: Number(it.id),
            value:
              typeof it.value === "string"
                ? it.value
                : typeof it.content === "string"
                ? it.content
                : String(it.value ?? it.content ?? ""),
            type: String(it.type),
          }));

        const map: Record<string, ClassifyItem[]> = {};
        for (const cat of categories as ClassifyCategory[]) {
          if (cat && cat.id) map[String(cat.id)] = [];
        }

        setCategoryMap(map);
        setAvailableItems(shuffleArray(validItems));
        setShuffledCategories(shuffleArray((categories as ClassifyCategory[]).map((c) => ({ ...c }))));
      } else {
        setAvailableItems([]);
        setCategoryMap({});
      }
    } catch (e) {
      console.error("Error initializing classification items:", e);
      setAvailableItems([]);
      setCategoryMap({});
    }
  }, [items, categories]);

  // ===== Helpers for touch overlay =====
  const createOverlay = (text: string) => {
    try {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.left = "0";
      overlay.style.top = "0";
      overlay.style.transform = "translate(-9999px, -9999px)";
      overlay.style.zIndex = "9999";
      overlay.style.pointerEvents = "none";
      overlay.style.padding = "8px 12px";
      overlay.style.background = "rgba(255,255,255,0.98)";
      overlay.style.border = "2px solid #3b82f6";
      overlay.style.borderRadius = "8px";
      overlay.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)";
      overlay.style.fontFamily =
        "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
      overlay.style.fontSize = "12px";
      overlay.style.color = "#0f172a";
      overlay.style.whiteSpace = "pre-wrap";
      overlay.style.maxWidth = "70vw";
      overlay.textContent = text || "";
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
    } catch {
      // ignore
    }
  };
  const moveOverlay = (clientX: number, clientY: number) => {
    const ov = overlayRef.current;
    if (!ov) return;
    const x = clientX + 12;
    const y = clientY + 12;
    ov.style.transform = `translate(${Math.max(0, x)}px, ${Math.max(0, y)}px)`;

    // Auto-scroll window near viewport edges during touch/pen drag
    try {
      const viewportThreshold = 40;
      if (clientY < viewportThreshold) {
        window.scrollBy({ top: -20, behavior: "smooth" });
      } else if (window.innerHeight - clientY < viewportThreshold) {
        window.scrollBy({ top: 20, behavior: "smooth" });
      }
    } catch {
      // ignore
    }
  };
  const cleanupOverlay = () => {
    const ov = overlayRef.current;
    if (ov && ov.parentNode) {
      ov.parentNode.removeChild(ov);
    }
    overlayRef.current = null;
  };
  const pointIn = (el: HTMLElement | null, x: number, y: number) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  // ===== Touch starters (order mode) =====
  const startTouchDragOrder = (ev: React.PointerEvent, block: DraggedBlock) => {
    // Only handle touch/pen; ignore mouse
    // @ts-ignore
    const pType = (ev as any).pointerType;
    if (pType === "mouse" || submitted) return;
    ev.preventDefault();

    createOverlay(block.code || "");

    const onMove = (e: PointerEvent) => moveOverlay(e.clientX, e.clientY);
    const onUp = (e: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp, true);

      const x = e.clientX;
      const y = e.clientY;

      const overDropped = pointIn(droppedBlocksRef.current, x, y);
      const overAvailable = pointIn(availableBlocksRef.current, x, y);

      if (overDropped) {
        setDroppedBlocks((prev) => {
          if (prev.some((it) => it.id === block.id)) return prev;
          return [...prev, { ...block, isPlaced: true }];
        });
        setAvailableBlocks((prev) => prev.filter((it) => it.id !== block.id));
      } else if (overAvailable) {
        setAvailableBlocks((prev) => {
          if (prev.some((it) => it.id === block.id)) return prev;
          return [...prev, { ...block, isPlaced: false }];
        });
        setDroppedBlocks((prev) => prev.filter((it) => it.id !== block.id));
      }

      cleanupOverlay();
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, true);
  };

  // ===== Touch starters (classification mode) =====
  const startTouchDragClassify = (ev: React.PointerEvent, item: ClassifyItem) => {
    // Only handle touch/pen; ignore mouse
    // @ts-ignore
    const pType = (ev as any).pointerType;
    if (pType === "mouse" || submitted) return;
    ev.preventDefault();

    createOverlay(item.value || "");

    const onMove = (e: PointerEvent) => moveOverlay(e.clientX, e.clientY);
    const onUp = (e: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp, true);

      const x = e.clientX;
      const y = e.clientY;

      // Check category buckets
      let droppedToCategory: string | null = null;
      const entries = Object.entries(categoryRefs.current);
      for (const [cid, el] of entries) {
        if (pointIn(el, x, y)) {
          droppedToCategory = cid;
          break;
        }
      }

      if (droppedToCategory) {
        const categoryId = droppedToCategory;
        setCategoryMap((prev) => {
          const newMap: Record<string, ClassifyItem[]> = {};
          // Remove from all categories first
          Object.keys(prev).forEach((cid) => {
            newMap[cid] = prev[cid].filter((it) => it.id !== item.id);
          });
          // Add to target category
          if (!newMap[categoryId]) newMap[categoryId] = [];
          if (!newMap[categoryId].some((it) => it.id === item.id)) {
            newMap[categoryId].push(item);
          }
          return newMap;
        });
        // Remove from available
        setAvailableItems((prev) => prev.filter((it) => it.id !== item.id));
      } else if (pointIn(availableItemsRef.current, x, y)) {
        // Return to pool
        setCategoryMap((prev) => {
          const newMap: Record<string, ClassifyItem[]> = {};
          Object.keys(prev).forEach((cid) => {
            newMap[cid] = prev[cid].filter((it) => it.id !== item.id);
          });
          return newMap;
        });
        setAvailableItems((prev) => {
          if (prev.some((it) => it.id === item.id)) return prev;
          return [...prev, item].sort((a, b) => a.id - b.id);
        });
      }

      cleanupOverlay();
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, true);
  };

  // ===== DnD (order mode) =====
  const handleDragStart = (e: React.DragEvent, block: DraggedBlock) => {
    try {
      setDraggedItem(block);
      e.dataTransfer.effectAllowed = "move";
    } catch (error) {
      console.error("Drag start error:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Auto-scroll the current scrollable container during drag-over
    const container = e.currentTarget as HTMLElement | null;
    if (container && container.scrollHeight > container.clientHeight) {
      const rect = container.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const threshold = 40;
      const step = 20;
      if (offsetY < threshold) {
        container.scrollTop = Math.max(0, container.scrollTop - step);
      } else if (rect.bottom - e.clientY < threshold) {
        container.scrollTop = Math.min(container.scrollHeight, container.scrollTop + step);
      }
    }

    // Also gently scroll the window if near viewport edges
    const viewportThreshold = 40;
    if (e.clientY < viewportThreshold) {
      window.scrollBy({ top: -20, behavior: "smooth" });
    } else if (window.innerHeight - e.clientY < viewportThreshold) {
      window.scrollBy({ top: 20, behavior: "smooth" });
    }
  };

  const handleDrop = (e: React.DragEvent, dropZone: "available" | "dropped", index?: number) => {
    try {
      e.preventDefault();
      if (!draggedItem) return;

      if (dropZone === "dropped") {
        const newDroppedBlocks = [...(droppedBlocks || [])];
        if (typeof index === "number") {
          newDroppedBlocks.splice(index, 0, { ...draggedItem, isPlaced: true });
        } else {
          newDroppedBlocks.push({ ...draggedItem, isPlaced: true });
        }
        setDroppedBlocks(newDroppedBlocks);
        setAvailableBlocks((prev) => prev.filter((block) => block.id !== draggedItem.id));
      } else {
        if (draggedItem.isPlaced) {
          setAvailableBlocks((prev) => [...prev, { ...draggedItem, isPlaced: false }]);
          setDroppedBlocks((prev) => prev.filter((block) => block.id !== draggedItem.id));
        }
      }
      setDraggedItem(null);
    } catch (error) {
      console.error("Drop error:", error);
    }
  };

  const removeBlock = (block: DraggedBlock) => {
    try {
      setDroppedBlocks((prev) => prev.filter((b) => b.id !== block.id));
      setAvailableBlocks((prev) => [...prev, { ...block, isPlaced: false }]);
    } catch (error) {
      console.error("Remove block error:", error);
    }
  };

  // ===== DnD (classification mode) =====
  const handleClassifyDragStart = (e: React.DragEvent, item: ClassifyItem) => {
    try {
      setClassifyDraggedItem(item);
      e.dataTransfer.effectAllowed = "move";
    } catch (error) {
      console.error("Classify drag start error:", error);
    }
  };

  const handleClassifyDropToCategory = (e: React.DragEvent, categoryId: string) => {
    try {
      e.preventDefault();
      if (!classifyDraggedItem) return;

      setCategoryMap((prev) => {
        const newMap: Record<string, ClassifyItem[]> = {};
        // Remove from all categories first
        Object.keys(prev).forEach((cid) => {
          newMap[cid] = prev[cid].filter((it) => it.id !== classifyDraggedItem.id);
        });
        // Add to target category
        if (!newMap[categoryId]) newMap[categoryId] = [];
        if (!newMap[categoryId].some((it) => it.id === classifyDraggedItem.id)) {
          newMap[categoryId].push(classifyDraggedItem);
        }
        return newMap;
      });

      // Remove from available pool
      setAvailableItems((prev) => prev.filter((it) => it.id !== classifyDraggedItem.id));

      setClassifyDraggedItem(null);
    } catch (error) {
      console.error("Classify drop to category error:", error);
    }
  };

  const handleClassifyDropToPool = (e: React.DragEvent) => {
    try {
      e.preventDefault();
      if (!classifyDraggedItem) return;

      // Remove from categories
      setCategoryMap((prev) => {
        const newMap: Record<string, ClassifyItem[]> = {};
        Object.keys(prev).forEach((cid) => {
          newMap[cid] = prev[cid].filter((it) => it.id !== classifyDraggedItem.id);
        });
        return newMap;
      });

      // Add back to available if not present
      setAvailableItems((prev) => {
        if (prev.some((it) => it.id === classifyDraggedItem.id)) return prev;
        return [...prev, classifyDraggedItem].sort((a, b) => a.id - b.id);
      });

      setClassifyDraggedItem(null);
    } catch (error) {
      console.error("Classify drop to pool error:", error);
    }
  };

  const removeItemFromCategory = (categoryId: string, item: ClassifyItem) => {
    try {
      setCategoryMap((prev) => {
        const newMap = { ...prev };
        newMap[categoryId] = (newMap[categoryId] || []).filter((it) => it.id !== item.id);
        return newMap;
      });
      setAvailableItems((prev) => {
        if (prev.some((it) => it.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.id - b.id);
      });
    } catch (error) {
      console.error("Remove item from category error:", error);
    }
  };

  // ===== Mobile tap-to-assign helpers =====
  const assignItemToCategory = (item: ClassifyItem, targetCategoryId: string) => {
    try {
      // Remove from all categories first
      setCategoryMap((prev) => {
        const newMap: Record<string, ClassifyItem[]> = {};
        Object.keys(prev).forEach((cid) => {
          newMap[cid] = prev[cid].filter((it) => it.id !== item.id);
        });
        // Add to selected category
        if (!newMap[targetCategoryId]) newMap[targetCategoryId] = [];
        if (!newMap[targetCategoryId].some((it) => it.id === item.id)) {
          newMap[targetCategoryId].push(item);
        }
        return newMap;
      });
      // Remove from available pool if present
      setAvailableItems((prev) => prev.filter((it) => it.id !== item.id));
      haptic(12);
    } catch (error) {
      console.error("Assign item to category error:", error);
    }
  };

  const returnItemToAvailable = (item: ClassifyItem) => {
    try {
      // Remove from all categories
      setCategoryMap((prev) => {
        const newMap: Record<string, ClassifyItem[]> = {};
        Object.keys(prev).forEach((cid) => {
          newMap[cid] = prev[cid].filter((it) => it.id !== item.id);
        });
        return newMap;
      });
      // Add back to available if not present
      setAvailableItems((prev) => {
        if (prev.some((it) => it.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.id - b.id);
      });
      haptic(8);
    } catch (error) {
      console.error("Return item to available error:", error);
    }
  };

  // ===== Actions =====
  const resetClassification = () => {
    try {
      const validItems: ClassifyItem[] = Array.isArray(items)
        ? items.map((it: any) => ({
            id: Number(it.id),
            value:
              typeof it.value === "string"
                ? it.value
                : typeof it.content === "string"
                ? it.content
                : String(it.value ?? it.content ?? ""),
            type: String(it.type),
          }))
        : [];
      setAvailableItems(shuffleArray(validItems));
      const map: Record<string, ClassifyItem[]> = {};
      if (Array.isArray(categories)) {
        const cats = categories as ClassifyCategory[];
        cats.forEach((c) => (map[String(c.id)] = []));
        // Randomize category order on reset
        setShuffledCategories(shuffleArray(cats.map((c) => ({ ...c }))));
      }
      setCategoryMap(map);
      setSubmitted(false);
      setScore(0);
      setIsCompleted(false);
      setRewardAwarded(false);
      setShowRewardAnimation(false);
      setAttempts(0);
    } catch (error) {
      console.error("Reset classification error:", error);
    }
  };

  const checkClassification = async () => {
    try {
      setSubmitted(true);
      setAttempts((prev) => prev + 1);

      const total = Array.isArray(items) ? items.length : 0;
      let placed = 0;
      let correct = 0;

      if (Array.isArray(categories)) {
        for (const cat of categories as ClassifyCategory[]) {
          const bucket = categoryMap[String(cat.id)] || [];
          placed += bucket.length;
          for (const it of bucket) {
            if (String(it.type) === String(cat.id)) correct++;
          }
        }
      }

      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      const completeness = total > 0 ? (placed / total) * 100 : 0;
      const efficiency = Math.max(0, 100 - (attempts - 1) * 10);
      const finalScore = Math.round(accuracy * 0.7 + completeness * 0.2 + efficiency * 0.1);

      setScore(finalScore);

      const success = finalScore >= 80 && placed === total;
      if (success) {
        setIsCompleted(true);
        setEndTime(new Date());
      }
    } catch (error) {
      console.error("Check classification error:", error);
    }
  };

  const checkOrder = async () => {
    try {
      setSubmitted(true);
      setAttempts((prev) => prev + 1);

      const safeDroppedBlocks = droppedBlocks || [];
      const safeCorrectOrder = correctOrder || [];

      const userOrder = safeDroppedBlocks.filter((b) => b && b.id !== undefined).map((b) => b.id);
      let correctCount = 0;

      const orderLength = safeCorrectOrder.length || 0;
      for (let i = 0; i < Math.min(userOrder.length, orderLength); i++) {
        if (userOrder[i] === safeCorrectOrder[i]) {
          correctCount++;
        }
      }

      const accuracy = orderLength > 0 ? (correctCount / orderLength) * 100 : 0;
      const completeness = orderLength > 0 ? (safeDroppedBlocks.length / orderLength) * 100 : 0;
      const efficiency = Math.max(0, 100 - (attempts - 1) * 10);

      const finalScore = Math.round(accuracy * 0.6 + completeness * 0.3 + efficiency * 0.1);
      setScore(finalScore);

      const success = finalScore >= 70 && correctCount === orderLength;
      if (success) {
        setIsCompleted(true);
        setEndTime(new Date());
      }
    } catch (error) {
      console.error("Check order error:", error);
    }
  };

  const handleManualComplete = () => {
    try {
      const safeDroppedBlocks = droppedBlocks || [];
      const safeCorrectOrder = correctOrder || [];
      const userOrder = safeDroppedBlocks.map((block) => block.id);
      let correctCount = 0;

      const orderLength = safeCorrectOrder.length || 0;
      for (let i = 0; i < Math.min(userOrder.length, orderLength); i++) {
        if (userOrder[i] === safeCorrectOrder[i]) {
          correctCount++;
        }
      }

      const accuracy = orderLength > 0 ? (correctCount / orderLength) * 100 : 0;
      const completeness = orderLength > 0 ? (safeDroppedBlocks.length / orderLength) * 100 : 0;
      const efficiency = Math.max(0, 100 - (attempts - 1) * 10);

      const finalScore = Math.round(accuracy * 0.6 + completeness * 0.3 + efficiency * 0.1);
      const success = finalScore >= 70 && correctCount === orderLength;
      if (onComplete) onComplete(finalScore, 100, success);
    } catch (error) {
      console.error("Manual complete error:", error);
    }
  };

  const handleActivityCompletion = async () => {
    try {
      setIsCompleted(true);
      setCompleting(true);

      const backParams = new URLSearchParams();
      const category = searchParams?.get("category") || "";
      const type = searchParams?.get("type") || "";
      if (category) backParams.set("category", category);
      if (type) backParams.set("type", type);
      const backHref = backParams.toString() ? `/activities?${backParams.toString()}` : "/activities";

      const final = Math.max(0, Number.isFinite(score) ? score : 0);
      const tSpent = startTime && endTime ? Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000)) : undefined;

      const res = await fetch("/api/activities/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: activity.slug,
          score: final,
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
      console.error("DragDrop completion error:", error);
      toast({
        title: "Error",
        description: "An error occurred while completing the activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  // Build backHref and auto-redirect when modals show
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

  // Reward modals (declared after hooks)
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

  // ===== Derived booleans and early returns (AFTER hooks) =====
  const invalidActivity = !activity;
  const invalidContent = !activity?.content || typeof activity.content !== "object";
  const invalidSchemas = !hasOrderSchema && !hasClassificationSchema;

  if (invalidActivity) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-800">Activity Loading Error</h2>
          <p className="text-red-600">Activity data is missing.</p>
        </div>
      </div>
    );
  }

  if (invalidContent) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-800">Configuration Error</h2>
          <p className="text-red-600">Activity content is missing or invalid.</p>
        </div>
      </div>
    );
  }

  if (invalidSchemas) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-800">Configuration Error</h2>
          <p className="text-red-600">
            This learning activity is missing required configuration data.
          </p>
          <div className="mt-4 text-sm text-red-500">
            Expected either: blocks + correctOrder arrays (order mode), or items + categories (classification mode)
          </div>
        </div>
      </div>
    );
  }

  // ===== Classification mode render =====
  if (!hasOrderSchema && hasClassificationSchema) {
    const safeItems = Array.isArray(items) ? (items as any[]) : [];
    const safeCategories = Array.isArray(categories) ? (categories as ClassifyCategory[]) : [];

    const totalCount = safeItems.length;
    const placedCount = Object.values(categoryMap).reduce((sum, arr) => sum + arr.length, 0);

    return (
      <div className="mx-auto max-w-6xl p-6 pb-24" onDragOver={handleDragOver}>
        {rewardModal}
        {alreadyClaimedModal}
        {/* Mobile tap-to-assign bottom sheet */}
        {isTouchDevice && assignTargetItem && (
          <Drawer open={true} onOpenChange={(open: boolean) => { if (!open) { setAssignTargetItem(null); setAssignFromCategoryId(null); } }}>
            <DrawerContent className="mx-auto w-full max-w-lg rounded-t-2xl">
              <DrawerHeader className="text-center">
                <DrawerTitle>Place item</DrawerTitle>
                <DrawerDescription>Choose a category for this item.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4">
                <div className="rounded-md border bg-white p-3">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-black">{assignTargetItem.value}</pre>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(shuffledCategories.length > 0 ? shuffledCategories : safeCategories).map((cat) => (
                    <Button key={cat.id as any} variant="secondary" className="justify-start"
                      onClick={() => {
                        assignItemToCategory(assignTargetItem, String(cat.id));
                        setAssignTargetItem(null);
                        setAssignFromCategoryId(null);
                      }}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" className="flex-1"
                    onClick={() => {
                      returnItemToAvailable(assignTargetItem);
                      setAssignTargetItem(null);
                      setAssignFromCategoryId(null);
                    }}
                  >
                    Return to Available
                  </Button>
                  <Button className="flex-1" onClick={() => { setAssignTargetItem(null); setAssignFromCategoryId(null); }}>Cancel</Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        )}
        {/* Header removed: handled by page-level layout */}

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify_between">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{placedCount}/{totalCount} items placed</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (placedCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Available Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Available Items</h3>
            </div>

            <div
              ref={availableItemsRef}
              className="max-h-[60vh] min-h-40 overflow-auto rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4"
              onDragOver={handleDragOver}
              onDrop={handleClassifyDropToPool}
            >
              <div className="space-y-3">
                {availableItems.length > 0 ? (
                  availableItems.map((it) => (
                    <div
                      key={it.id}
                      draggable={!submitted}
                      onDragStart={(e) => handleClassifyDragStart(e, it)}
                      onPointerDown={(e) => (isTouchDevice ? startTouchDragClassify(e, it) : undefined)}
                      onClick={() => {
                        if (isTouchDevice && !submitted) {
                          setAssignTargetItem(it);
                          setAssignFromCategoryId(null);
                        }
                      }}
                      className={`cursor-move rounded-lg border-2 border-slate-300 bg-white p-3 transition-all hover:shadow-md ${
                        submitted ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      <div>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-black">{it.value}</pre>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-gray-500">All items have been placed</p>
                )}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(shuffledCategories.length > 0 ? shuffledCategories : safeCategories).map((cat) => {
                const bucket = categoryMap[String(cat.id)] || [];
                return (
                  <div key={cat.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2">
                      <div className="text-sm font-bold text-slate-800">{cat.name}</div>
                      {cat.description && <div className="text-xs text-slate-500">{cat.description}</div>}
                    </div>
                    <div
                      ref={(el) => setCategoryRef(cat.id, el)}
                      className={`max-h-[40vh] min-h-36 overflow-auto rounded-lg border-2 border-dashed p-3 transition-colors ${
                        submitted ? "border-slate-300 bg-slate-50" : "border-blue-300 bg-blue-50"
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleClassifyDropToCategory(e, String(cat.id))}
                    >
                      <div className="space-y-2">
                        {bucket.length > 0 ? (
                          bucket.map((it) => (
                            <div
                              key={it.id}
                              draggable={!submitted}
                              onDragStart={(e) => handleClassifyDragStart(e, it)}
                              onPointerDown={(e) => (isTouchDevice ? startTouchDragClassify(e, it) : undefined)}
                              onClick={() => {
                                if (isTouchDevice && !submitted) {
                                  setAssignTargetItem(it);
                                  setAssignFromCategoryId(String(cat.id));
                                }
                              }}
                              className="flex items-center justify-between rounded-lg border-2 border-slate-300 bg-white p-2"
                            >
                              <pre className="whitespace-pre-wrap font-mono text-sm">{it.value}</pre>
                              {!submitted && (
                                <button
                                  onClick={() => removeItemFromCategory(String(cat.id), it)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <span className="sr-only">Remove</span>
                                  <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-sm text-slate-400">Drop items here</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          {!submitted ? (
            <button
              onClick={checkClassification}
              disabled={placedCount === 0}
              className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Check Answers
            </button>
          ) : isCompleted ? (
            <>
              {isAuthenticated ? (
                <button
                  onClick={handleActivityCompletion}
                  disabled={completing || completed}
                  className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {completing ? "Processing..." : completed ? "Completed" : "Claim Rewards"}
                </button>
              ) : (
                <button
                  onClick={() => router.push(backHref)}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Finish and Go to List
                </button>
              )}
              <button
                onClick={resetClassification}
                className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
              >
                Try Again
              </button>
            </>
          ) : (
            <button
              onClick={resetClassification}
              className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Results */}
        {submitted && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center">
            <div
              className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
                isCompleted ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              }`}
            >
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">
              {isCompleted ? "Great Job!" : "Good Attempt!"}
            </h3>
            <p className="mb-4 text-gray-600">Success Rate</p>
            <div className="text-4xl font-bold text-gray-900">{score}%</div>
          </div>
        )}
      </div>
    );
  }

  // ===== Order mode render (default) =====
  const safeDroppedBlocks = droppedBlocks || [];
  const safeAvailableBlocks = availableBlocks || [];
  const safeCorrectOrder = correctOrder || [];
  const safeHints = hints || [];

  return (
    <div className="mx-auto max-w-6xl p-6 pb-24" onDragOver={handleDragOver}>
      {rewardModal}
      {alreadyClaimedModal}
      {/* Header removed: handled by page-level layout */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-8">
        <div className="mb-2 flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-900">Target:</span>
          <span className="text-blue-800">{target}</span>
        </div>
        <div className="text-sm text-blue-700">
          Drag code blocks into the correct order to match the target output. Use hints if needed!
        </div>
      </div>
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {safeDroppedBlocks.length}/{safeCorrectOrder.length || 0} blocks placed
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(safeCorrectOrder.length || 0) > 0 ? (safeDroppedBlocks.length / (safeCorrectOrder.length || 1)) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Available Blocks */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Available Blocks</h3>
          </div>

          <div
            ref={availableBlocksRef}
            className="max-h-[60vh] min-h-40 overflow-auto rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "available")}
          >
            <div className="space-y-3">
              {safeAvailableBlocks.length > 0 ? (
                safeAvailableBlocks.map((block) => (
                  <div
                    key={block.id}
                    draggable={!submitted}
                    onDragStart={(e) => handleDragStart(e, block)}
                    onPointerDown={(e) => (isTouchDevice ? startTouchDragOrder(e, block) : undefined)}
                    className={`cursor-move rounded-lg border-2 p-3 transition-all hover:shadow-md ${getBlockTypeColor(block.type)} ${
                      submitted ? "cursor-not-allowed opacity-50" : ""
                    }`}
                  >
                    <div>
                      <pre className="whitespace-pre-wrap font-mono text-sm text-black">{block.code}</pre>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-gray-500">No blocks available</p>
              )}
            </div>
          </div>
        </div>

        {/* Dropped (Target) */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Your Order</h3>
            {safeHints.length > 0 && (
              <button
                onClick={() => setShowHints((s) => !s)}
                className="inline-flex items-center space-x-2 rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-2 text-sm text-yellow-800 hover:bg-yellow-200"
              >
                <Lightbulb className="h-4 w-4" />
                <span>{showHints ? "Hide Hints" : "Show Hints"}</span>
              </button>
            )}
          </div>

          <div
            ref={droppedBlocksRef}
            className="min-h-40 rounded-lg border-2 border-dashed border-gray-300 p-4"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, "dropped")}
          >
            <div className="space-y-3">
              {safeDroppedBlocks.length > 0 ? (
                safeDroppedBlocks.map((block, index) => (
                  <div key={block.id} className={`rounded-lg border-2 p-3 ${getBlockTypeColor(block.type)}`}>
                    <div className="flex items-center justify-between">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-black">{block.code}</pre>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeBlock(block)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <span className="sr-only">Remove</span>
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-gray-500">Drop blocks here</p>
              )}
            </div>
          </div>

          {/* Hints */}
          {showHints && safeHints.length > 0 && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="mb-2 font-semibold text-yellow-800">Hints</div>
              <ul className="list-disc space-y-1 pl-5 text-yellow-800">
                {safeHints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        {!submitted ? (
          <button
            onClick={checkOrder}
            disabled={(safeCorrectOrder.length || 0) === 0 || safeDroppedBlocks.length === 0}
            className="rounded-lg bg-blue-600 px-8 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Check Order
          </button>
        ) : isCompleted ? (
          <>
            {isAuthenticated ? (
              <button
                onClick={handleActivityCompletion}
                disabled={completing || completed}
                className="rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? "Processing..." : completed ? "Completed" : "Claim Rewards"}
              </button>
            ) : (
              <button
                onClick={() => router.push(backHref)}
                className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700"
              >
                Finish and Go to List
              </button>
            )}
            <button
              onClick={handleManualComplete}
              className="rounded-lg bg-slate-600 px-6 py-3 font-bold text-white transition-colors hover:bg-slate-700"
            >
              Submit Score Only
            </button>
            <button
              onClick={() => {
                // Reset order mode
                const safeBlocks = blocks || [];
                if (safeBlocks.length > 0) {
                  const validBlocks = safeBlocks.filter((b: any) => b && typeof b === "object" && b.id !== undefined);
                  const shuffledBlocks: DraggedBlock[] = validBlocks
                    .map((block: Block) => ({ ...block, isPlaced: false, isDragging: false }))
                    .sort(() => Math.random() - 0.5);
                  setAvailableBlocks(shuffledBlocks);
                } else {
                  setAvailableBlocks([]);
                }
                setDroppedBlocks([]);
                setSubmitted(false);
                setScore(0);
                setIsCompleted(false);
                setAttempts(0);
                setShowHints(false);
              }}
              className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
            >
              Try Again
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              // Reset order mode
              const safeBlocks = blocks || [];
              if (safeBlocks.length > 0) {
                const validBlocks = safeBlocks.filter((b: any) => b && typeof b === "object" && b.id !== undefined);
                const shuffledBlocks: DraggedBlock[] = validBlocks
                  .map((block: Block) => ({ ...block, isPlaced: false, isDragging: false }))
                  .sort(() => Math.random() - 0.5);
                setAvailableBlocks(shuffledBlocks);
              } else {
                setAvailableBlocks([]);
              }
              setDroppedBlocks([]);
              setSubmitted(false);
              setScore(0);
              setIsCompleted(false);
              setAttempts(0);
              setShowHints(false);
            }}
            className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition-colors hover:bg-indigo-700"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Results */}
      {submitted && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center">
          <div
            className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
              isCompleted ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
            }`}
          >
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-gray-900">
            {isCompleted ? "Great Job!" : "Good Attempt!"}
          </h3>
          <p className="mb-4 text-gray-600">Success Rate</p>
          <div className="text-4xl font-bold text-gray-900">{score}%</div>
        </div>
      )}
    </div>
  );
}

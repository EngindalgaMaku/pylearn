"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Lock,
  Play,
  Trophy,
  Diamond,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Layers,
  Rocket,
  ListChecks,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export type LearnActivity = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  category: string;
  difficulty: number;
  estimatedMinutes: number;
  diamondReward: number;
  experienceReward: number;
  isLocked: boolean;
  completed?: boolean;
  order?: number;
  tags?: string[];
};

function tagClasses(tag: string): string {
  const t = tag.toLowerCase();
  if (/(intro|introduction|basics|fundamentals|getting started)/.test(t))
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900";
  if (/(variable|type|string|number|boolean)/.test(t))
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900";
  if (/(list|tuple|dict|set|data structure)/.test(t))
    return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900";
  if (/(loop|for|while|control|condition|if|elif|else)/.test(t))
    return "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900";
  if (/(function|def|parameter|return|scope)/.test(t))
    return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900";
  if (/(class|oop|object)/.test(t))
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";
  if (/(file|io|read|write)/.test(t))
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800";
  if (/(quiz|practice|exercise|challenge)/.test(t))
    return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900";
  return "bg-muted text-foreground border-border";
}

function difficultyLabel(level: number) {
  if (level <= 1) return "Beginner";
  if (level === 2) return "Intermediate";
  if (level >= 3) return "Advanced";
  return "Beginner";
}

function categoryEmoji(category: string) {
  const key = (category || "").toLowerCase();
  if (key.includes("basic") || key.includes("intro")) return "🔤";
  if (key.includes("fundamental")) return "🔤";
  if (key.includes("data") || key.includes("structure")) return "📋";
  if (key.includes("control") || key.includes("flow")) return "🔀";
  if (key.includes("function")) return "⚙️";
  if (key.includes("oop") || key.includes("class")) return "🏗️";
  if (key.includes("file")) return "📁";
  if (key.includes("module") || key.includes("package")) return "📦";
  return "🐍";
}

type LearnGridProps = {
  // Pagination-capable props (preferred)
  initialItems?: LearnActivity[];
  total?: number;
  initialCategory?: string;
  initialPage?: number;
  pageSizeDesktop?: number; // default 10
  pageSizeMobile?: number; // default 5
  apiPath?: string; // default "/api/learn/activities"

  // Legacy non-paginated props (fallback)
  activities?: LearnActivity[];

  // Common props
  categories: string[];
  headerTitle?: string;
  headerSubtitle?: string;
  defaultCategory?: string;
};

export default function LearnGrid({
  // New (paginated)
  initialItems,
  total,
  initialCategory,
  initialPage = 1,
  pageSizeDesktop = 10,
  pageSizeMobile = 5,
  apiPath = "/api/learn/activities",

  // Legacy
  activities,

  // Common
  categories,
  headerTitle = "Learn",
  headerSubtitle = "Browse Python lessons",
  defaultCategory,
}: LearnGridProps) {
  const isMobile = useIsMobile();

  // Determine initial category, honoring server-provided initialCategory first,
  // then explicit defaultCategory, then first category in list.
  const resolvedInitialCategory = useMemo(() => {
    const byEquality = (val?: string | null) =>
      val ? categories.find((c) => c === val) : undefined;
    const byCase = (val?: string | null) =>
      val
        ? categories.find((c) => c.toLowerCase() === val.toLowerCase())
        : undefined;

    return (
      byEquality(initialCategory) ||
      byCase(initialCategory) ||
      byEquality(defaultCategory) ||
      byCase(defaultCategory) ||
      categories[0] ||
      ""
    );
  }, [categories, defaultCategory, initialCategory]);

  // Pagination mode if initialItems and total provided
  const paginationMode = initialItems !== undefined && total !== undefined;

  // Items list state
  const [items, setItems] = useState<LearnActivity[]>(
    paginationMode ? (initialItems as LearnActivity[]) : activities || []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    resolvedInitialCategory
  );
  const [page, setPage] = useState<number>(paginationMode ? initialPage : 1);
  const [totalCount, setTotalCount] = useState<number>(
    paginationMode ? (total as number) : activities?.length ?? 0
  );
  const [loading, setLoading] = useState(false);
  // Skip the very first category-change effect run (we already have SSR items)
  const didInitRef = useRef(false);
  /* mobile ref removed */

  const pageSize = isMobile ? pageSizeMobile : pageSizeDesktop;
  const effectiveCategory = selectedCategory;

  // Fetch a page (replace items)
  async function fetchPage({
    category,
    page,
    pageSize,
  }: {
    category: string;
    page: number;
    pageSize: number;
  }) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("category", category);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`${apiPath}?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();

      const received: LearnActivity[] = data.items || [];
      const newTotal: number = data.total ?? 0;

      setItems(received);
      setTotalCount(newTotal);
    } catch (e) {
      console.error("Failed to fetch activities:", e);
    } finally {
      setLoading(false);
    }
  }

  // Reset when category changes
  useEffect(() => {
    if (!paginationMode) return;
    if (!effectiveCategory) return;

    // Skip the very first run on mount (SSR already provided initial items)
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }

    // Reset to first page for the chosen category
    setPage(1);
    fetchPage({
      category: effectiveCategory,
      page: 1,
      pageSize: isMobile ? pageSizeMobile : pageSizeDesktop,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCategory]);

  // When device type changes (mobile <-> desktop), refetch first page with correct page size
  useEffect(() => {
    if (!paginationMode) return;
    if (!effectiveCategory) return;

    setPage(1);
    fetchPage({
      category: effectiveCategory,
      page: 1,
      pageSize: isMobile ? pageSizeMobile : pageSizeDesktop,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // If paginationMode and device flips (mobile<->desktop), refetch to align with page size
  useEffect(() => {
    if (!paginationMode) return;
    if (!effectiveCategory) return;
    // Force re-fetch with appropriate page size for mode
    setPage(1);
    fetchPage({
      category: effectiveCategory,
      page: 1,
      pageSize: isMobile ? pageSizeMobile : pageSizeDesktop,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Desktop pagination controls
  const totalPages = useMemo(() => {
    if (!paginationMode) return 1;
    return Math.max(
      1,
      Math.ceil(totalCount / (isMobile ? pageSizeMobile : pageSizeDesktop))
    );
  }, [paginationMode, totalCount, isMobile, pageSizeDesktop, pageSizeMobile]);

  const goToPage = async (nextPage: number) => {
    if (!paginationMode) return;
    const p = Math.min(Math.max(1, nextPage), totalPages);
    setPage(p);
    await fetchPage({
      category: effectiveCategory,
      page: p,
      pageSize: isMobile ? pageSizeMobile : pageSizeDesktop,
    });
  };

  // Category change handler
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  // Derived metrics
  const filtered = useMemo(() => {
    // In pagination mode, items are already filtered by server
    if (paginationMode) return items;
    // Legacy: filter client-side
    if (!selectedCategory) return activities || [];
    return (activities || []).filter((a) => a.category === selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, activities, paginationMode, selectedCategory]);

  const completedCount = useMemo(
    () => filtered.filter((a) => a.completed).length,
    [filtered]
  );
  const totalLessons = useMemo(() => {
    if (paginationMode) return totalCount;
    return activities?.length ?? 0;
  }, [paginationMode, totalCount, activities?.length]);
  const progressPercentage =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  const totalDiamondsEarned = useMemo(
    () =>
      filtered
        .filter((a) => a.completed)
        .reduce((sum, a) => sum + (a.diamondReward ?? 0), 0),
    [filtered]
  );

  return (
    <main className="max-w-md mx-auto md:max-w-4xl lg:max-w-5xl xl:max-w-6xl px-4 py-8 space-y-8">
      {/* Desktop Header */}
      <div className="hidden md:block text-center mb-8">
        <h1 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          📚 Learn Python
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Master Python through interactive lessons and structured learning
          paths
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-blue-100/90 via-purple-100/80 to-indigo-100/90 border-blue-300/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-work-sans)] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {selectedCategory ? (
              <>
                Learn Summary for{" "}
                <span className="font-semibold">{selectedCategory}</span>
              </>
            ) : (
              headerTitle
            )}
          </CardTitle>
          <CardDescription>
            {headerSubtitle}
            <br />
            {paginationMode ? (
              <span className="text-xs text-muted-foreground">
                {filtered.length} shown • {totalCount} total • {completedCount}{" "}
                completed
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {completedCount} of {totalLessons} lessons completed
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm">
              <span>{Math.round(progressPercentage)}% Complete</span>
              <span className="flex items-center gap-1">
                <Diamond className="w-4 h-4 text-blue-500" />
                {totalDiamondsEarned} Diamonds Earned
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">
          Categories
        </h2>

        {/* Mobile: horizontal scroll chips with snap */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category)}
                className={`min-w-max snap-start whitespace-nowrap text-xs ${
                  selectedCategory === category ? "" : "bg-card"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Desktop: wrapped chip grid */}
        <div className="hidden md:flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(category)}
              className="text-xs md:text-sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-work-sans)]">
          {selectedCategory || "Lessons"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lesson) => (
            <Card
              key={lesson.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                lesson.isLocked ? "opacity-60" : ""
              } ${
                lesson.completed
                  ? "border-2 border-green-400 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-teal-50/80 shadow-md shadow-green-200/30"
                  : "border bg-gradient-to-br from-slate-50/60 via-white to-blue-50/40 shadow-md hover:shadow-blue-200/30"
              } backdrop-blur-sm`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <span className="text-lg">
                        {categoryEmoji(lesson.category)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {typeof lesson.order === "number" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0.5"
                          >
                            #{lesson.order}
                          </Badge>
                        )}
                        <CardTitle className="text-base font-medium leading-tight">
                          {lesson.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {difficultyLabel(lesson.difficulty)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.max(1, lesson.estimatedMinutes)} min
                        </span>
                      </div>
                      {lesson.tags && lesson.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {lesson.tags.slice(0, 5).map((t, i) => {
                            const cls = tagClasses(t);
                            return (
                              <Badge
                                key={`${lesson.id}-tag-${i}`}
                                variant="outline"
                                className={`text-[10px] ${cls}`}
                              >
                                {t}
                              </Badge>
                            );
                          })}
                          {lesson.tags.length > 5 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{lesson.tags.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {lesson.completed && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {lesson.isLocked && (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {lesson.description ? (
                  <CardDescription className="text-sm mb-4">
                    {lesson.description}
                  </CardDescription>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      {lesson.experienceReward} XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Diamond className="w-3 h-3 text-blue-500" />
                      {lesson.diamondReward}
                    </span>
                  </div>

                  <Link href={lesson.isLocked ? "#" : `/learn/${lesson.slug}`}>
                    <Button
                      size="sm"
                      disabled={lesson.isLocked}
                      className="flex items-center gap-1"
                    >
                      {lesson.completed ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Review
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          {lesson.isLocked ? "Locked" : "Start"}
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {paginationMode ? (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={loading || page <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={loading || page >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* Learning Path */}
      <Card className="overflow-hidden bg-gradient-to-br from-purple-50/80 via-blue-50/60 to-indigo-50/80 border-purple-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4 bg-gradient-to-r from-indigo-100/90 via-sky-100/80 to-cyan-100/90 border-b border-blue-200/60">
          <CardTitle className="font-[family-name:var(--font-work-sans)] flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <Trophy className="w-4 h-4" />
            </span>
            Recommended Learning Path
          </CardTitle>
          <CardDescription>
            Follow this path step-by-step for the best progression
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Desktop/Tablet: horizontal timeline */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute left-0 right-0 top-6 h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />
              <div className="grid md:grid-cols-5 gap-6">
                {[
                  {
                    title: "Python Fundamentals",
                    subtitle: "Variables, Types, Strings, Lists",
                    Icon: BookOpen,
                    gradient: "from-indigo-500 to-blue-500",
                    badge: "Beginner",
                  },
                  {
                    title: "Control Flow",
                    subtitle: "Conditions, Loops, Logic",
                    Icon: ListChecks,
                    gradient: "from-emerald-500 to-teal-500",
                    badge: "Core",
                  },
                  {
                    title: "Functions",
                    subtitle: "Parameters, Return, Scope",
                    Icon: GraduationCap,
                    gradient: "from-violet-500 to-fuchsia-500",
                    badge: "Core",
                  },
                  {
                    title: "Data Structures",
                    subtitle: "Lists, Tuples, Dicts, Sets",
                    Icon: Layers,
                    gradient: "from-amber-500 to-orange-500",
                    badge: "Core",
                  },
                  {
                    title: "Mini Projects",
                    subtitle: "Apply what you learned",
                    Icon: Rocket,
                    gradient: "from-rose-500 to-pink-500",
                    badge: "Practice",
                  },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="relative flex flex-col items-center text-center gap-3"
                  >
                    <div className="relative z-10">
                      <div
                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${s.gradient} p-[2px] shadow-sm`}
                      >
                        <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                          <s.Icon className="w-6 h-6 text-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.subtitle}
                    </div>
                    <div className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {s.badge}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: vertical steps */}
          <div className="md:hidden space-y-5">
            {[
              {
                title: "Python Fundamentals",
                subtitle: "Variables, Types, Strings, Lists",
                Icon: BookOpen,
                gradient: "from-indigo-500 to-blue-500",
                badge: "Beginner",
              },
              {
                title: "Control Flow",
                subtitle: "Conditions, Loops, Logic",
                Icon: ListChecks,
                gradient: "from-emerald-500 to-teal-500",
                badge: "Core",
              },
              {
                title: "Functions",
                subtitle: "Parameters, Return, Scope",
                Icon: GraduationCap,
                gradient: "from-violet-500 to-fuchsia-500",
                badge: "Core",
              },
              {
                title: "Data Structures",
                subtitle: "Lists, Tuples, Dicts, Sets",
                Icon: Layers,
                gradient: "from-amber-500 to-orange-500",
                badge: "Core",
              },
              {
                title: "Mini Projects",
                subtitle: "Apply what you learned",
                Icon: Rocket,
                gradient: "from-rose-500 to-pink-500",
                badge: "Practice",
              },
            ].map((s, idx, arr) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.gradient} p-[2px]`}
                  >
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                      <s.Icon className="w-5 h-5 text-foreground" />
                    </div>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="absolute left-1/2 top-10 -ml-[1px] w-[2px] h-7 bg-border" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{s.title}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {s.badge}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

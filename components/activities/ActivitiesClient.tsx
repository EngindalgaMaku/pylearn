"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MobilePageHeader } from "@/components/mobile-page-header";
import {
  Play,
  Lock,
  CheckCircle,
  Diamond,
  Zap,
  Clock,
  Trophy,
  Target,
  BookOpen,
  Code2,
  FlaskConical,
  Puzzle,
  Database,
  LineChart,
  MonitorPlay,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

export type ActivityDTO = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  activityType: string;
  category: string;
  difficulty: number;
  diamondReward: number;
  experienceReward: number;
  estimatedMinutes: number;
  isLocked: boolean;
  isCompleted?: boolean;
  tags: string[];
};

type Props = {
  activities: ActivityDTO[];
  total: number;
  page: number;
  pageSize: number;
  categories: string[];
  activityTypes: string[];
  selectedCategory: string;
  selectedActivityType: string | null;
};

const activityTypeColors: Record<string, string> = {
  "Interactive Demo": "bg-blue-100 text-blue-800",
  "Coding Lab": "bg-green-100 text-green-800",
  "Matching Game": "bg-purple-100 text-purple-800",
  "Code Builder": "bg-orange-100 text-orange-800",
  "Data Exploration": "bg-teal-100 text-teal-800",
  "Algorithm Visualization": "bg-red-100 text-red-800",
  // fallbacks for common lowercase keys
  interactive_demo: "bg-blue-100 text-blue-800",
  coding_lab: "bg-green-100 text-green-800",
  matching: "bg-purple-100 text-purple-800",
  code_builder: "bg-orange-100 text-orange-800",
  data_exploration: "bg-teal-100 text-teal-800",
  algorithm_visualization: "bg-red-100 text-red-800",
  quiz: "bg-amber-100 text-amber-800",
  lesson: "bg-slate-100 text-slate-800",
};

const difficultyLabels = [
  "",
  "Beginner",
  "Basic",
  "Intermediate",
  "Advanced",
  "Expert",
];
const difficultyColors = [
  "",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
];

const topicColorPool = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
];

// Icon mapping for activity types (supports both Title Case and snake_case keys)
function typeIconFor(type: string) {
  const key = String(type || "").toLowerCase();
  switch (key) {
    case "interactive demo":
    case "interactive_demo":
      return <MonitorPlay className="w-4 h-4" />;
    case "coding lab":
    case "coding_lab":
      return <FlaskConical className="w-4 h-4" />;
    case "matching game":
    case "matching":
      return <Puzzle className="w-4 h-4" />;
    case "code builder":
    case "code_builder":
      return <Code2 className="w-4 h-4" />;
    case "data exploration":
    case "data_exploration":
      return <Database className="w-4 h-4" />;
    case "algorithm visualization":
    case "algorithm_visualization":
      return <LineChart className="w-4 h-4" />;
    case "quiz":
      return <HelpCircle className="w-4 h-4" />;
    case "lesson":
      return <BookOpen className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
}

// Icon mapping for topic/category chips and card
function topicIconFor(name: string) {
  const normalized = canonicalizeCategoryTitle(name).title.toLowerCase();
  switch (normalized) {
    case "python fundamentals":
      return <BookOpen className="w-4 h-4" />;
    case "data structures":
      return <Database className="w-4 h-4" />;
    case "functions":
      return <Code2 className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
}

// Canonicalize/merge categories (fix duplicates like 'python fundamentals' vs 'Python Fundamentals')
const CATEGORY_ALIASES: Record<string, string> = {
  "python fundamentals": "Python Fundamentals",
  python_fundamentals: "Python Fundamentals",
  "python-fundamentals": "Python Fundamentals",
  "py fundamentals": "Python Fundamentals",
  fundamentals: "Python Fundamentals",
};

// Topic explanations (shown as a card when a topic is selected)
const CATEGORY_EXPLANATIONS: Record<string, string> = {
  "Python Fundamentals":
    "Learn core Python concepts: variables, data types, control flow, functions, and more. Build a solid foundation to write clean, correct Python.",
  "Data Structures":
    "Master Python’s built-in data structures—lists, tuples, dicts, sets, deque, heapq—to model data efficiently and write faster code.",
  Functions:
    "Understand how to define, call, and compose functions, use parameters and returns, and leverage scopes and higher-order functions.",
};

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function canonicalizeCategoryTitle(raw?: string) {
  const base = String(raw ?? "").trim();
  const lower = base.toLowerCase();
  // Normalize separators (underscores/dashes) to spaces and collapse multiple spaces
  const normalizedKey = lower
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer matching on normalized key, then raw lower
  const aliased =
    CATEGORY_ALIASES[normalizedKey] ?? CATEGORY_ALIASES[lower] ?? null;

  // If alias found, use it; otherwise Title Case the normalized key
  const title = aliased ?? titleCase(normalizedKey || lower);
  const norm = title.trim();
  return { title: norm, key: norm };
}

export default function ActivitiesClient({
  activities,
  total,
  page,
  pageSize,
  categories,
  activityTypes,
  selectedCategory,
  selectedActivityType,
}: Props) {
  const router = useRouter();
  const selectedTopic = canonicalizeCategoryTitle(selectedCategory).title;
  const selectedTypeValue = selectedActivityType ?? "all";

  // Normalize activities (ensure safe defaults)
  const normalized = useMemo<ActivityDTO[]>(
    () =>
      (activities || []).map((a) => {
        const canon = canonicalizeCategoryTitle(a.category);
        return {
          ...a,
          slug: a.slug || a.id,
          description: a.description ?? "",
          isLocked: Boolean(a.isLocked),
          isCompleted: Boolean(a.isCompleted),
          difficulty: Math.max(1, Math.min(5, Number(a.difficulty) || 1)),
          tags: Array.isArray(a.tags) ? a.tags : [],
          category: canon.title,
        };
      }),
    [activities]
  );

  const categoriesMap = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        title: string;
        description: string;
        color: string;
        totalActivities: number;
        completedActivities: number;
        progress: number;
      }
    > = {};
    const catList = Array.from(
      new Set(normalized.map((a) => a.category).filter(Boolean))
    );
    catList.forEach((cat, idx) => {
      const items = normalized.filter((x) => x.category === cat);
      const totalCount = items.length;
      const completed = items.filter((x) => x.isCompleted).length;
      map[cat] = {
        id: cat,
        title: cat,
        description:
          CATEGORY_EXPLANATIONS[cat] ??
          `Explore ${cat} through interactive activities`,
        color: topicColorPool[idx % topicColorPool.length],
        totalActivities: totalCount,
        completedActivities: completed,
        progress:
          totalCount > 0 ? Math.round((completed / totalCount) * 100) : 0,
      };
    });
    return map;
  }, [normalized]);

  const filteredActivities = useMemo(() => normalized, [normalized]);

  const completedActivities = normalized.filter((a) => a.isCompleted).length;
  const overallProgress =
    total > 0 ? Math.round((completedActivities / total) * 100) : 0;

  const topicList = useMemo(() => {
    const canonTitles = Array.from(
      new Set((categories || []).map((c) => canonicalizeCategoryTitle(c).title))
    );
    const list = canonTitles.map((title, idx) => {
      const stats = categoriesMap[title];
      return {
        id: title,
        title,
        description:
          CATEGORY_EXPLANATIONS[title] ??
          `Explore ${title} through interactive activities`,
        color: topicColorPool[idx % topicColorPool.length],
        totalActivities: stats?.totalActivities ?? 0,
        completedActivities: stats?.completedActivities ?? 0,
        progress: stats?.progress ?? 0,
      };
    });
    list.sort((a, b) => {
      if (a.title === "Python Fundamentals") return -1;
      if (b.title === "Python Fundamentals") return 1;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [categories, categoriesMap]);

  const selectedCategoryInfo = useMemo(
    () => topicList.find((t) => t.id === selectedTopic) ?? null,
    [topicList, selectedTopic]
  );
  const selectedProgress = useMemo(() => {
    const denom = Math.max(1, total);
    return selectedCategoryInfo
      ? Math.round((selectedCategoryInfo.completedActivities / denom) * 100)
      : 0;
  }, [selectedCategoryInfo, total]);

  // Build URLs for server-side navigation
  const buildHref = (
    category: string | null,
    type: string | null,
    pageNum: number
  ) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (pageNum > 1) params.set("page", String(pageNum));
    const qs = params.toString();
    return qs ? `/activities?${qs}` : `/activities`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const typeList = useMemo(() => {
    const base = Array.from(
      new Set(
        (activityTypes || []).map((t) => (t || "").trim()).filter(Boolean)
      )
    );
    base.sort((a, b) => a.localeCompare(b));
    return base;
  }, [activityTypes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="md:hidden">
        <MobilePageHeader
          title="Learning Activities"
          subtitle="Master Python through interactive challenges"
          backHref="/games"
        />
      </div>

      <div className="max-w-4xl mx-auto lg:max-w-6xl xl:max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
        {/* Desktop back to games */}
        <div className="hidden md:block mb-4">
          <Link href="/games">
            <Button variant="ghost" size="sm" aria-label="Back to games">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </Link>
        </div>
        <div className="mb-8 md:mb-12">
          <div className="hidden md:block text-center mb-8">
            <h1 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
              Learning Activities
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              Master Python through interactive experiences and hands-on
              challenges
            </p>
          </div>
          <Card className="max-w-md mx-auto bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-indigo-600/10 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Trophy className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {overallProgress}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Overall Progress
                  </div>
                </div>
                <Target className="w-8 h-8 text-accent" />
              </div>
              <Progress value={overallProgress} className="h-3 mb-2" />
              <div className="text-sm text-muted-foreground">
                {completedActivities} of {total} activities completed
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-serif font-bold text-xl md:text-2xl text-foreground">
              Choose Your Path
            </h2>
          </div>

          {/* Activity Type Filter (compact select) */}
          <div className="mb-4 max-w-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-serif font-semibold text-lg text-foreground">
                  Activity Type
                </h3>
              </div>
              <Select
                value={selectedTypeValue}
                onValueChange={(v) => {
                  const nextType = v === "all" ? null : v;
                  router.push(buildHref(selectedTopic, nextType, 1));
                }}
              >
                <SelectTrigger className="w-48 md:w-64 bg-primary/10 border border-primary/40 text-foreground hover:bg-primary/15 focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-primary/30">
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>All types</span>
                    </div>
                  </SelectItem>
                  {typeList.map((t) => (
                    <SelectItem key={t} value={t}>
                      <div className="flex items-center gap-2">
                        {typeIconFor(t)}
                        <span>{labelizeType(t)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic Filter */}
          {/* Mobile: horizontal scroll chips with snap */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-serif font-semibold text-lg text-foreground">
                  Topics
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {topicList.length} topics
              </span>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto">
              <div className="flex gap-2 snap-x snap-mandatory">
                {topicList.map((topic) => (
                  <Button
                    key={topic.id}
                    asChild
                    size="sm"
                    variant={selectedTopic === topic.id ? "default" : "outline"}
                    className={`font-medium min-w-max snap-start whitespace-nowrap ${
                      selectedTopic === topic.id ? "" : "bg-card"
                    }`}
                  >
                    <Link href={buildHref(topic.id, selectedActivityType, 1)}>
                      <span className="inline-flex items-center gap-2">
                        {topicIconFor(topic.title)}
                        <span>{topic.title}</span>
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: wrapped chip grid */}
          <div className="hidden md:flex flex-wrap gap-3 mb-6">
            {topicList.map((topic) => (
              <Button
                key={topic.id}
                asChild
                variant={selectedTopic === topic.id ? "default" : "outline"}
                className="font-medium"
              >
                <Link href={buildHref(topic.id, selectedActivityType, 1)}>
                  <span className="inline-flex items-center gap-2">
                    {topicIconFor(topic.title)}
                    <span>{topic.title}</span>
                  </span>
                </Link>
              </Button>
            ))}
          </div>

          {selectedCategoryInfo && (
            <div className="mb-8">
              <Card className="hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-slate-50/80 via-blue-50/60 to-purple-50/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-4 h-4 rounded-full ${selectedCategoryInfo.color} shadow-lg`}
                    />
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      {total} activities
                    </Badge>
                  </div>
                  <CardTitle className="font-serif font-bold text-lg text-foreground">
                    <span className="inline-flex items-center gap-2">
                      {topicIconFor(selectedCategoryInfo.title)}
                      <span>{selectedCategoryInfo.title}</span>
                    </span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedCategoryInfo.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary">{selectedProgress}%</span>
                    </div>
                    <Progress value={selectedProgress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="font-serif font-bold text-xl md:text-2xl text-foreground mb-6">
            {selectedTopic ? `${selectedTopic} Activities` : "Activities"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const typeColor =
              activityTypeColors[activity.activityType] ??
              activityTypeColors[activity.activityType?.toLowerCase()] ??
              "bg-slate-100 text-slate-800";
            return (
              <Card
                key={activity.id}
                className={`relative transition-all duration-300 hover:-translate-y-1 ${
                  activity.isLocked ? "opacity-60" : ""
                } ${
                  activity.isCompleted
                    ? "border-2 border-green-400 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 shadow-md shadow-green-200/50 hover:shadow-lg hover:shadow-green-300/50"
                    : "border border-blue-200/60 bg-gradient-to-br from-blue-50 via-purple-50/80 to-indigo-50 shadow-md shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50"
                } backdrop-blur-sm`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge
                          className={`${typeColor} font-medium flex items-center gap-1`}
                        >
                          {typeIconFor(activity.activityType)}
                          <span>{labelizeType(activity.activityType)}</span>
                        </Badge>
                        <Badge
                          className={`${
                            difficultyColors[activity.difficulty]
                          } text-white font-medium`}
                        >
                          {difficultyLabels[activity.difficulty]}
                        </Badge>
                      </div>
                      <CardTitle className="font-serif font-bold text-lg flex items-center gap-2 text-foreground">
                        {activity.title}
                        {activity.isCompleted && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {activity.isLocked && (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </CardTitle>
                      {activity.description && (
                        <CardDescription className="mt-2 text-muted-foreground leading-relaxed">
                          {activity.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {activity.isCompleted && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs font-medium border border-green-300">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-blue-600">
                            <Diamond className="w-4 h-4" />
                            <span className="font-medium">
                              {activity.diamondReward}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">
                              {activity.experienceReward} XP
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">
                              {activity.estimatedMinutes}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {activity.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {activity.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-border/50"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Button
                      className={`w-full font-medium shadow-sm ${
                        activity.isCompleted
                          ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300"
                          : ""
                      }`}
                      disabled={activity.isLocked}
                      asChild={!activity.isLocked}
                      variant={activity.isCompleted ? "outline" : "default"}
                    >
                      {activity.isLocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Locked
                        </>
                      ) : (
                        <Link
                          href={`/activities/${
                            activity.slug
                          }?${new URLSearchParams({
                            ...(selectedTopic
                              ? { category: selectedTopic }
                              : {}),
                            ...(selectedActivityType
                              ? { type: selectedActivityType }
                              : {}),
                          }).toString()}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {activity.isCompleted ? "Review" : "Start"}
                        </Link>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            {canPrev ? (
              <Button asChild variant="outline">
                <Link
                  href={buildHref(
                    selectedTopic,
                    selectedActivityType,
                    page - 1
                  )}
                >
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Previous
              </Button>
            )}
            {canNext ? (
              <Button asChild variant="outline">
                <Link
                  href={buildHref(
                    selectedTopic,
                    selectedActivityType,
                    page + 1
                  )}
                >
                  Next
                </Link>
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function labelizeType(type: string) {
  // Convert snake_case to Title Case as a reasonable default
  if (!type) return "Activity";
  if (type.includes(" ")) return type;
  return type
    .split("_")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

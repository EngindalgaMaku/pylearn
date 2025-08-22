import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Diamond,
  Zap,
  Clock,
  BookOpen,
  Code2,
  FlaskConical,
  Puzzle,
  Database,
  LineChart,
  MonitorPlay,
  HelpCircle,
  ArrowLeft,
} from "lucide-react"
import QuizRunner from "@/components/activities/quiz/QuizRunner"
import MatchingRunner from "@/components/activities/matching/MatchingRunner"
import FillBlanksRunner from "@/components/activities/fill-blanks/FillBlanksRunner"

type Props = { params: { slug: string } }

type ActivityDetailDTO = {
  id: string
  slug: string
  title: string
  description: string
  activityType: string
  category: string
  difficulty: number
  diamondReward: number
  experienceReward: number
  estimatedMinutes: number
  isLocked: boolean
  tags: string[]
  content?: string
}

function labelizeType(type: string) {
  if (!type) return "Activity"
  if (type.includes(" ")) return type
  return type
    .split("_")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ")
}

function typeIconFor(type: string) {
  const key = String(type || "").toLowerCase()
  switch (key) {
    case "interactive demo":
    case "interactive_demo":
      return <MonitorPlay className="w-4 h-4" />
    case "coding lab":
    case "coding_lab":
      return <FlaskConical className="w-4 h-4" />
    case "matching game":
    case "matching":
      return <Puzzle className="w-4 h-4" />
    case "code builder":
    case "code_builder":
      return <Code2 className="w-4 h-4" />
    case "data exploration":
    case "data_exploration":
      return <Database className="w-4 h-4" />
    case "algorithm visualization":
    case "algorithm_visualization":
      return <LineChart className="w-4 h-4" />
    case "quiz":
      return <HelpCircle className="w-4 h-4" />
    case "lesson":
      return <BookOpen className="w-4 h-4" />
    default:
      return <BookOpen className="w-4 h-4" />
  }
}

const difficultyLabels = ["", "Beginner", "Basic", "Intermediate", "Advanced", "Expert"]
const difficultyColors = ["", "bg-green-500", "bg-blue-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"]

async function getActivityBySlugOrId(slugOrId: string): Promise<ActivityDetailDTO | null> {
  const row = await prisma.learningActivity.findFirst({
    where: {
      isActive: true,
      NOT: { activityType: "lesson" },
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      activityType: true,
      category: true,
      difficulty: true,
      diamondReward: true,
      experienceReward: true,
      estimatedMinutes: true,
      isLocked: true,
      tags: true,
      content: true,
    },
  })

  if (!row) return null

  const tags = Array.isArray(row.tags)
    ? (row.tags as unknown[]).filter((v) => typeof v === "string") as string[]
    : []

  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: row.title,
    description: row.description ?? "",
    activityType: String(row.activityType || "lesson"),
    category: row.category ?? "General",
    difficulty: Math.max(1, Math.min(5, Number(row.difficulty ?? 1))),
    diamondReward: Number(row.diamondReward ?? 0),
    experienceReward: Number(row.experienceReward ?? 0),
    estimatedMinutes: Number(row.estimatedMinutes ?? 5),
    isLocked: Boolean(row.isLocked),
    tags,
    content: typeof row.content === "string" ? row.content : undefined,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const awaitedParams = await params
  const hs = await headers()
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net"
  const proto = hs.get("x-forwarded-proto") || (envBase.startsWith("https") ? "https" : "http")
  const hostHeader = hs.get("x-forwarded-host") || hs.get("host")
  const origin = hostHeader ? `${proto}://${hostHeader}` : envBase

  const data = await prisma.learningActivity.findFirst({
    where: {
      isActive: true,
      NOT: { activityType: "lesson" },
      OR: [{ slug: awaitedParams.slug }, { id: awaitedParams.slug }],
    },
    select: {
      title: true,
      description: true,
      slug: true,
      category: true,
    },
  })

  if (!data) {
    return {
      title: "Activity Not Found",
      description: "The requested activity could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = data.title || "Learning Activity"
  const description =
    data.description ||
    `Practice ${data.category || "Python"} with this interactive learning activity.`

  const canonicalPath = `/activities/${data.slug ?? awaitedParams.slug}`
  const canonical = `${origin}${canonicalPath}`

  const keywords = [
    "Python",
    "Learning Activity",
    data.category || undefined,
    ...(typeof data.slug === "string" ? data.slug.split("-") : []),
  ].filter(Boolean) as string[]

  return {
    title: `${title} | Learning Activity`,
    description,
    alternates: {
      canonical,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    keywords,
  }
}

export default async function ActivityDetailPage({ params }: Props) {
  const awaitedParams = await params
  const activity = await getActivityBySlugOrId(awaitedParams.slug)
  if (!activity) {
    notFound()
  }

  const difficultyBadge = difficultyLabels[activity.difficulty]
  const difficultyColor = difficultyColors[activity.difficulty] || "bg-slate-500"

  // Build absolute origin for canonical/structured data
  const hs = await headers()
  const envBase2 = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net"
  const proto2 = hs.get("x-forwarded-proto") || (envBase2.startsWith("https") ? "https" : "http")
  const hostHeader2 = hs.get("x-forwarded-host") || hs.get("host")
  const origin = hostHeader2 ? `${proto2}://${hostHeader2}` : envBase2

  // If this is a matching activity, attempt to parse content JSON into config
  let matchingConfig: { slug: string; title: string; timeLimitSec: number; instructions?: string; pairs: { left: string; right: string; topic?: string }[] } | null = null
  // If this is a fill-in-the-blanks activity, parse content JSON into config
  let fillConfig: { slug: string; title: string; timeLimitSec?: number; instructions?: string; items: { prompt: string; answer: string; hint?: string; explanation?: string }[] } | null = null
  if (String(activity.activityType || "").toLowerCase() === "matching") {
    try {
      const raw = activity.content ? JSON.parse(activity.content) : null
      if (raw && Array.isArray(raw.pairs)) {
        const timeLimitSec = typeof raw.timeLimitSec === "number" ? raw.timeLimitSec : Number(raw.timeLimitSec) || activity.estimatedMinutes * 60
        matchingConfig = {
          slug: activity.slug,
          title: raw.title || activity.title,
          timeLimitSec: timeLimitSec > 0 ? timeLimitSec : activity.estimatedMinutes * 60,
          instructions: typeof raw.instructions === "string" ? raw.instructions : undefined,
          pairs: raw.pairs
            .filter((p: any) => p && typeof p.left === "string" && typeof p.right === "string")
            .map((p: any) => ({ left: p.left, right: p.right, topic: typeof p.topic === "string" ? p.topic : undefined })),
        }
      }
    } catch (e) {
      // ignore malformed JSON; MatchingRunner will fall back to local bank
    }
  } else if (["fill_blanks", "fill blanks", "fill-in-the-blanks", "fill in the blanks", "cloze"].includes(String(activity.activityType || "").toLowerCase())) {
    try {
      const raw = activity.content ? JSON.parse(activity.content) : null
      if (raw) {
        const timeLimitSec = typeof raw.timeLimitSec === "number" ? raw.timeLimitSec : Number(raw.timeLimitSec)
        const title = raw.title || activity.title
        const instructions = typeof raw.instructions === "string" ? raw.instructions : undefined

        // Prefer items; fall back to questions; support multiple answer shapes
        const sourceList = Array.isArray(raw.items)
          ? raw.items
          : Array.isArray(raw.questions)
          ? raw.questions
          : []

        if (Array.isArray(sourceList) && sourceList.length > 0) {
          const items = sourceList
            .map((q: any) => {
              const prompt = typeof q.prompt === "string" ? q.prompt : (typeof q.text === "string" ? q.text : undefined)
              if (!prompt) return null
              // Accept answer, correctAnswer, or answers (array)
              const ansField = (q.answer ?? q.correctAnswer ?? q.answers)
              let answer: string | undefined = undefined
              if (typeof ansField === "string") answer = ansField
              else if (Array.isArray(ansField)) {
                const arr = ansField.filter((x) => typeof x === "string").map((s: string) => s.trim()).filter(Boolean)
                // Choose first as canonical; runner supports single answer string
                answer = arr[0]
              }
              if (!answer) return null
              return {
                prompt,
                answer,
                hint: typeof q.hint === "string" ? q.hint : undefined,
                explanation: typeof q.explanation === "string" ? q.explanation : (typeof q.explain === "string" ? q.explain : undefined),
              }
            })
            .filter(Boolean) as { prompt: string; answer: string; hint?: string; explanation?: string }[]

          if (items.length > 0) {
            fillConfig = {
              slug: activity.slug,
              title,
              timeLimitSec: timeLimitSec && timeLimitSec > 0 ? timeLimitSec : undefined,
              instructions,
              items,
            }
          }
        }
      }
    } catch (e) {
      // ignore; FillBlanksRunner has sensible defaults
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-10">
        {/* JSON-LD: BreadcrumbList */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
                { "@type": "ListItem", position: 2, name: "Activities", item: `${origin}/activities` },
                activity.category
                  ? {
                      "@type": "ListItem",
                      position: 3,
                      name: activity.category,
                      item: `${origin}/activities?category=${encodeURIComponent(activity.category)}`,
                    }
                  : undefined,
                {
                  "@type": "ListItem",
                  position: activity.category ? 4 : 3,
                  name: activity.title,
                  item: `${origin}/activities/${activity.slug}`,
                },
              ].filter(Boolean),
            }),
          }}
        />
        {/* JSON-LD: LearningResource (activity) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LearningResource",
              name: activity.title,
              description: activity.description,
              url: `${origin}/activities/${activity.slug}`,
              inLanguage: "en",
              isAccessibleForFree: true,
              learningResourceType: activity.activityType,
              timeRequired: `PT${activity.estimatedMinutes}M`,
              educationalLevel: difficultyBadge,
              genre: activity.category,
              keywords: Array.isArray(activity.tags) ? activity.tags : [],
            }),
          }}
        />
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link href="/activities">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activities
            </Link>
          </Button>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className="bg-slate-100 text-slate-800 font-medium flex items-center gap-1">
                {typeIconFor(activity.activityType)}
                <span>{labelizeType(activity.activityType)}</span>
              </Badge>
              <Badge className={`${difficultyColor} text-white font-medium`}>{difficultyBadge}</Badge>
              {activity.category && (
                <Badge variant="outline" className="font-medium">{activity.category}</Badge>
              )}
            </div>
            <CardTitle className="font-serif font-bold text-2xl text-foreground">
              {activity.title}
            </CardTitle>
            {activity.description && (
              <CardDescription className="text-muted-foreground mt-2">
                {activity.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="flex items-center justify-between sm:justify-start sm:gap-2 bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Diamond className="w-5 h-5 text-blue-600" />
                  <div className="text-sm font-medium">{activity.diamondReward}</div>
                </div>
                <div className="text-xs text-muted-foreground sm:hidden">Elmas</div>
                <div className="hidden sm:block text-sm">
                  <div className="text-muted-foreground">Diamonds</div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-2 bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <div className="text-sm font-medium">{activity.experienceReward} XP</div>
                </div>
                <div className="text-xs text-muted-foreground sm:hidden">Deneyim</div>
                <div className="hidden sm:block text-sm">
                  <div className="text-muted-foreground">Experience</div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-2 bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div className="text-sm font-medium">{activity.estimatedMinutes} dk</div>
                </div>
                <div className="text-xs text-muted-foreground sm:hidden">Süre</div>
                <div className="hidden sm:block text-sm">
                  <div className="text-muted-foreground">Estimated Time</div>
                </div>
              </div>
            </div>

            {activity.tags?.length > 0 && (
              <div className="mb-6">
                <div className="text-sm text-muted-foreground mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {activity.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-border/50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {String(activity.activityType || "").toLowerCase() === "quiz" ? (
              <QuizRunner slug={activity.slug} title={activity.title} />
            ) : String(activity.activityType || "").toLowerCase() === "matching" ? (
              <MatchingRunner
                slug={activity.slug}
                title={activity.title}
                diamondReward={activity.diamondReward}
                xpReward={activity.experienceReward}
                config={matchingConfig}
              />
            ) : ["fill_blanks", "fill blanks", "fill-in-the-blanks", "fill in the blanks"].includes(String(activity.activityType || "").toLowerCase()) ? (
              <FillBlanksRunner
                slug={activity.slug}
                title={activity.title}
                diamondReward={activity.diamondReward}
                xpReward={activity.experienceReward}
                config={fillConfig}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                This is the activity detail page. You can embed interactive content or
                instructions here tailored to the activity type.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
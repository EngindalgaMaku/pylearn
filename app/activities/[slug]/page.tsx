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
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hs = await headers()
  const proto = hs.get("x-forwarded-proto") || "http"
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000"
  const origin = `${proto}://${host}`

  const data = await prisma.learningActivity.findFirst({
    where: {
      isActive: true,
      NOT: { activityType: "lesson" },
      OR: [{ slug: params.slug }, { id: params.slug }],
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

  const canonicalPath = `/activities/${data.slug ?? params.slug}`
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
  const activity = await getActivityBySlugOrId(params.slug)
  if (!activity) {
    notFound()
  }

  const difficultyBadge = difficultyLabels[activity.difficulty]
  const difficultyColor = difficultyColors[activity.difficulty] || "bg-slate-500"

  // Build absolute origin for canonical/structured data
  const hs = await headers()
  const proto = hs.get("x-forwarded-proto") || "http"
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000"
  const origin = `${proto}://${host}`

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
              <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg">
                <Diamond className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Diamonds</div>
                  <div className="font-medium">{activity.diamondReward}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg">
                <Zap className="w-4 h-4 text-primary" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Experience</div>
                  <div className="font-medium">{activity.experienceReward} XP</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="text-sm">
                  <div className="text-muted-foreground">Estimated Time</div>
                <div className="font-medium">{activity.estimatedMinutes} minutes</div>
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

            {/* Placeholder for interactive content or instructions */}
            <div className="text-sm text-muted-foreground">
              This is the activity detail page. You can embed interactive content or
              instructions here tailored to the activity type.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
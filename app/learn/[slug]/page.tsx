import { prisma } from "@/lib/prisma"
import LessonViewer, { type LessonContent } from "@/components/learn/lesson-viewer"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params

  // Fetch minimal fields for SEO
  let activity = await prisma.learningActivity.findFirst({
    where: { slug, isActive: true, activityType: "lesson" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      isActive: true,
      category: true,
    },
  })

  if (!activity) {
    activity = await prisma.learningActivity.findFirst({
      where: { id: slug, isActive: true, activityType: "lesson" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        isActive: true,
        category: true,
      },
    })
  }

  // If not found or not active, avoid indexing
  if (!activity || !activity.isActive) {
    return {
      title: "Lesson | Learn Python",
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const h = await headers()
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net"
  const proto = h.get("x-forwarded-proto") || (envBase.startsWith("https") ? "https" : "http")
  const hostHeader = h.get("x-forwarded-host") || h.get("host")
  const baseUrl = hostHeader ? `${proto}://${hostHeader}` : envBase

  const pathname = `/learn/${activity.slug ?? activity.id}`
  const url = `${baseUrl}${pathname}`
  const title = `${activity.title} | Learn Python`
  const description =
    activity.description ??
    `Learn ${activity.title} with sections, examples, and a quiz in our interactive Python course.`

  const keywords = [
    "Python",
    "Learn Python",
    "Python Tutorial",
    "Python Course",
    "Programming",
    "Coding",
    activity.title,
    activity.category ?? "",
  ].filter(Boolean)

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Learn Python",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // You can set other locale fields here if needed
  }
}

function toFiveSectionsFromString(str: string): LessonContent["sections"] {
  const parts = str.split(/\n{2,}/g).map((s) => s.trim()).filter(Boolean)
  const titles = [
    "Introduction",
    "Core Concepts",
    "Example",
    "Practice",
    "Summary",
  ]
  const sections: LessonContent["sections"] = []
  for (let i = 0; i < 5; i++) {
    const chunk = parts[i] ?? ""
    sections.push({
      title: titles[i],
      content: chunk || (i === 2 ? "No example provided." : "No content provided."),
    })
  }
  return sections
}

function mergeText(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join("\n\n")
}

function toFiveSectionsFromSteps(steps: any[]): LessonContent["sections"] {
  const take = Math.min(5, steps.length)
  const sections: LessonContent["sections"] = []
  for (let i = 0; i < take; i++) {
    const s = steps[i] ?? {}
    sections.push({
      title: String(s.title ?? `Section ${i + 1}`),
      content: mergeText(
        typeof s.description === "string" ? s.description : undefined,
        typeof s.explanation === "string" ? s.explanation : undefined
      ) || "No content available.",
      codeExample: typeof s.code === "string" ? s.code : undefined,
    })
  }
  // If steps < 5, pad with empty sections to reach 5
  for (let i = take; i < 5; i++) {
    sections.push({
      title: `Section ${i + 1}`,
      content: "No content available.",
    })
  }
  return sections
}

function normalizeSections(arr: any[]): LessonContent["sections"] {
  // Map provided array to 5 sections
  const sections: LessonContent["sections"] = []
  const count = Math.min(5, arr.length)
  for (let i = 0; i < count; i++) {
    const s = arr[i] ?? {}
    sections.push({
      title: String(s.title ?? `Section ${i + 1}`),
      content: String(s.content ?? s.text ?? "No content available."),
      codeExample: s.codeExample ? String(s.codeExample) : undefined,
    })
  }
  // pad to 5
  for (let i = count; i < 5; i++) {
    sections.push({
      title: `Section ${i + 1}`,
      content: "No content available.",
    })
  }
  return sections
}

function parseQuizMultiple(parsed: any):
  | { questions: { question: string; options: string[]; correctAnswer: number; explanation?: string }[] }
  | undefined {
  const q = parsed?.quiz || parsed?.content?.quiz

  // Preferred: q.questions as an array of question objects
  if (q?.questions && Array.isArray(q.questions) && q.questions.length > 0) {
    const questions = q.questions.map((first: any) => {
      const question = String(first?.question ?? "Quiz")
      // true/false variant handling
      if (
        first?.type === "true_false" ||
        typeof first?.correctAnswer === "boolean"
      ) {
        const correct = !!first?.correctAnswer
        return {
          question,
          options: ["True", "False"],
          correctAnswer: correct ? 0 : 1,
          explanation: first?.explanation ? String(first.explanation) : undefined,
        }
      }

      const options = (first?.options ?? []).map((o: any) => String(typeof o === "string" ? o : o?.text ?? o))
      let correctIndex = 0
      if (typeof first?.correctAnswer === "number") {
        correctIndex = Math.max(0, Math.min(options.length - 1, first.correctAnswer))
      } else if (typeof first?.correctAnswer === "string") {
        const idx = options.findIndex((o: string) => o === first.correctAnswer)
        correctIndex = idx >= 0 ? idx : 0
      } else if (typeof first?.correctIndex === "number") {
        correctIndex = Math.max(0, Math.min(options.length - 1, first.correctIndex))
      }
      return {
        question,
        options: options.length ? options : ["A", "B"],
        correctAnswer: correctIndex,
        explanation: first?.explanation ? String(first.explanation) : undefined,
      }
    })

    return { questions }
  }

  // Legacy single question shape -> wrap as array
  if (q && Array.isArray(q.options)) {
    const question = String(q.question ?? "Quiz")
    const options = q.options.map((o: any) => String(typeof o === "string" ? o : o?.text ?? o))
    const correctAnswer =
      typeof q.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q.correctIndex === "number"
          ? q.correctIndex
          : 0
    return {
      questions: [
        {
          question,
          options,
          correctAnswer,
          explanation: q.explanation ? String(q.explanation) : undefined,
        },
      ],
    }
  }

  return undefined
}

function parseToFiveSections(raw: string | null | undefined): LessonContent {
  // Helpers (scoped)
  const mdList = (items?: any[]) =>
    Array.isArray(items) && items.length
      ? items.map((x) => `- ${String(x)}`).join("\n")
      : undefined

  const formatReferences = (refs?: any[]) =>
    Array.isArray(refs) && refs.length
      ? refs
          .map((r: any) => {
            const label = String(r?.label ?? r?.title ?? r?.name ?? "Reference")
            const url = String(r?.url ?? r?.href ?? "")
            return url ? `- ${label} — ${url}` : `- ${label}`
          })
          .join("\n")
      : undefined

  // Extract first fenced code block (```lang ... ```) or return null
  const firstCodeBlock = (text?: string | null) => {
    if (!text) return null
    const fence = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/m
    const m = text.match(fence)
    if (m && m[1]) return m[1].trim()
    return null
  }

  // Remove code fences for display-only text (keep prose)
  const stripFences = (text?: string | null) => {
    if (!text) return undefined
    return text.replace(/```[\s\S]*?```/gm, "").trim()
  }

  // Multi-question quiz support
  const normalizeQuizSingle = (_parsed: any) => undefined // deprecated

  if (!raw) {
    return {
      sections: [
        { title: "Introduction", content: "No content available." },
        { title: "Core Concepts", content: "No content available." },
        { title: "Syntax", content: "No content available." },
        { title: "Examples", content: "No content available." },
        { title: "Best Practices & References", content: "No content available." },
      ],
    }
  }

  try {
    // JSON content path
    if (typeof raw === "string" && (raw.trim().startsWith("{") || raw.trim().startsWith("["))) {
      const parsed = JSON.parse(raw)

      // 1) "Anime-style" structured content (keys like introduction/objectives/prerequisites/theory/syntax/examples/bestPractices/pitfalls/cheatsheet/references/quiz)
      const hasStructuredKeys =
        parsed?.introduction ||
        parsed?.theory ||
        parsed?.syntax ||
        parsed?.examples ||
        parsed?.bestPractices ||
        parsed?.pitfalls ||
        parsed?.cheatsheet ||
        parsed?.references ||
        parsed?.objectives ||
        parsed?.prerequisites

      if (hasStructuredKeys) {
        const introParts: string[] = []
        if (parsed?.introduction) introParts.push(String(parsed.introduction))
        const objectives = mdList(parsed?.objectives)
        const prereqs = mdList(parsed?.prerequisites)
        if (objectives) introParts.push(`Objectives:\n${objectives}`)
        if (prereqs) introParts.push(`Prerequisites:\n${prereqs}`)
        const introContent = introParts.join("\n\n") || "No content available."

        // Theory
        const theoryContent = stripFences(parsed?.theory) || "No content available."

        // Syntax -> code and text
        const syntaxCode = firstCodeBlock(parsed?.syntax)
        const syntaxText = stripFences(parsed?.syntax) || ""

        // Examples -> code and text
        const exampleCode = firstCodeBlock(parsed?.examples)
        const exampleText = stripFences(parsed?.examples) || ""

        // Best practices + pitfalls + cheatsheet + references
        const bp = mdList(parsed?.bestPractices)
        const pitfalls = mdList(parsed?.pitfalls)
        const cheat = parsed?.cheatsheet ? String(parsed.cheatsheet) : undefined
        const refs = formatReferences(parsed?.references)
        const lastParts: string[] = []
        if (bp) lastParts.push(`Best practices:\n${bp}`)
        if (pitfalls) lastParts.push(`Common pitfalls:\n${pitfalls}`)
        // Show label in prose but render cheatsheet itself in a code block
        if (cheat) lastParts.push(`Cheatsheet:`)
        if (refs) lastParts.push(`References:\n${refs}`)
        const lastContent = lastParts.join("\n\n") || "No additional resources."

        const sections: LessonContent["sections"] = [
          { title: "Introduction", content: introContent },
          { title: "Core Concepts", content: theoryContent },
          { title: "Syntax", content: syntaxText, codeExample: syntaxCode ?? undefined },
          { title: "Examples", content: exampleText, codeExample: exampleCode ?? undefined },
          { title: "Best Practices & References", content: lastContent, codeExample: cheat ?? undefined },
        ]

        const quiz = parseQuizMultiple(parsed)
        return quiz ? { sections, quiz } : { sections }
      }

      // 2) interactive steps[] → first 5 sections
      const steps = parsed?.steps || parsed?.content?.steps
      if (Array.isArray(steps) && steps.length > 0) {
        const quiz = parseQuizMultiple(parsed)
        return { sections: toFiveSectionsFromSteps(steps), ...(quiz ? { quiz } : {}) }
      }

      // 3) generic sections[] shape
      const sectionsArray =
        (Array.isArray(parsed?.sections) && parsed.sections) ||
        (Array.isArray(parsed?.content?.sections) && parsed.content.sections)
      if (Array.isArray(sectionsArray) && sectionsArray.length > 0) {
        const quiz = parseQuizMultiple(parsed)
        return { sections: normalizeSections(sectionsArray), ...(quiz ? { quiz } : {}) }
      }

      // 4) single content string
      const single = parsed?.content
      if (typeof single === "string") {
        return { sections: toFiveSectionsFromString(single) }
      }

      // 5) fallback: stringify unknown JSON into 5 slices
      return { sections: toFiveSectionsFromString(JSON.stringify(parsed, null, 2)) }
    }

    // Plain text path (non-JSON) → slice into 5 sections
    return { sections: toFiveSectionsFromString(raw) }
  } catch {
    return { sections: toFiveSectionsFromString(raw) }
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // 1) Try by slug
  let activity = await prisma.learningActivity.findFirst({
    where: { slug, isActive: true, activityType: "lesson" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      difficulty: true,
      estimatedMinutes: true,
      diamondReward: true,
      experienceReward: true,
      content: true,
      isActive: true,
    },
  })

  // 2) Fallback: if slug not matched, treat param as an ID (for legacy links or missing slugs)
  if (!activity) {
    activity = await prisma.learningActivity.findFirst({
      where: { id: slug, isActive: true, activityType: "lesson" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        estimatedMinutes: true,
        diamondReward: true,
        experienceReward: true,
        content: true,
        isActive: true,
      },
    })
  }

  if (!activity || !activity.isActive) {
    notFound()
  }

  const lesson = {
    title: activity.title,
    description: activity.description,
    difficulty: activity.difficulty ?? 1,
    estimatedMinutes: Math.max(1, activity.estimatedMinutes ?? 5),
    xpReward: activity.experienceReward ?? 25,
    diamondReward: activity.diamondReward ?? 10,
    content: parseToFiveSections(activity.content),
  }

  // Build JSON-LD structured data (Article + Breadcrumbs)
  const h2 = await headers()
  const envBase2 = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net"
  const proto2 = h2.get("x-forwarded-proto") || (envBase2.startsWith("https") ? "https" : "http")
  const hostHeader2 = h2.get("x-forwarded-host") || h2.get("host")
  const baseUrl = hostHeader2 ? `${proto2}://${hostHeader2}` : envBase2

  const lessonUrl = `${baseUrl}/learn/${(activity.slug ?? activity.id)}`

  const articleLD = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: lesson.title,
    description: lesson.description ?? undefined,
    inLanguage: "en",
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: "Learn Python",
      url: `${baseUrl}/learn`,
    },
    keywords: [
      "Python",
      "Learn Python",
      "Python Tutorial",
      "Python Course",
      "Programming",
      "Coding",
      lesson.title,
    ],
    url: lessonUrl,
  }

  const breadcrumbsLD = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Learn",
        item: `${baseUrl}/learn`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: lesson.title,
        item: lessonUrl,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        // Article schema
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLD) }}
      />
      <script
        type="application/ld+json"
        // Breadcrumbs
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLD) }}
      />
      <LessonViewer
        title={lesson.title}
        description={lesson.description}
        difficulty={lesson.difficulty}
        estimatedMinutes={lesson.estimatedMinutes}
        xpReward={lesson.xpReward}
        diamondReward={lesson.diamondReward}
        content={lesson.content}
        backHref={`/learn${activity.category ? `?category=${encodeURIComponent(activity.category)}` : ""}`}
        activityId={activity.id}
        activitySlug={activity.slug ?? activity.id}
      />
    </>
  )
}
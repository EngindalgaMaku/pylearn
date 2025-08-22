import type { Metadata } from "next"
import { headers } from "next/headers"
import Script from "next/script"
import CodingLabClient, { codingChallenges } from "@/components/activities/coding-lab/CodingLabClient"

export async function generateMetadata(): Promise<Metadata> {
  const hs = await headers()
  const proto = hs.get("x-forwarded-proto") || "http"
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000"
  const origin = `${proto}://${host}`
  const canonical = `${origin}/activities/coding-lab`

  const title = "Python Coding Lab | Interactive Coding Challenges"
  const description = "Practice Python coding with interactive challenges. Work through variable assignments, list operations, and function creation with real-time feedback."

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: "PyLearn",
      locale: "en_US",
      images: [
        {
          url: "/icon.png",
          width: 512,
          height: 512,
          alt: "PyLearn – Learn Python by Playing",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/icon.png"],
    },
    keywords: [
      "Python coding",
      "coding challenges",
      "interactive Python",
      "Python practice",
      "Python variables",
      "Python lists",
      "Python functions",
      "learn Python",
      "coding exercises",
      "Python tutorial",
    ],
  }
}

export default async function CodingLabPage() {
  // Build absolute origin for structured data
  const hs = await headers()
  const proto = hs.get("x-forwarded-proto") || "http"
  const host = hs.get("x-forwarded-host") || hs.get("host") || "localhost:3000"
  const origin = `${proto}://${host}`

  return (
    <>
      {/* JSON-LD: Course structured data */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Python Coding Lab",
            description: "Practice Python coding with interactive challenges",
            provider: {
              "@type": "Organization",
              name: "PyLearn",
              sameAs: origin,
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "online",
              educationalLevel: "beginner",
            },
            learningResourceType: "Interactive Resource",
            teaches: codingChallenges.map(challenge => challenge.title).join(", "),
            about: {
              "@type": "Thing",
              name: "Python Programming",
            },
            audience: {
              "@type": "Audience",
              audienceType: "Beginner Python Programmers",
            },
          }),
        }}
      />

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
              { "@type": "ListItem", position: 3, name: "Coding Lab", item: `${origin}/activities/coding-lab` },
            ],
          }),
        }}
      />

      <CodingLabClient />
    </>
  )
}
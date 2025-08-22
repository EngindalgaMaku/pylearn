import type { Metadata } from "next"
import Script from "next/script"
import CodeMatchGame from "@/components/games/CodeMatchGame"

export const metadata: Metadata = {
  title: "Code Match – Python Output Matching Game (50 Questions, Sudden‑Death) | PyLearn",
  description:
    "Practice Python by matching code to output in a fast, sudden‑death quiz. 50 randomized questions, 30s per round, instant feedback. Great for beginners and intermediates.",
  alternates: { canonical: "/games/code-match" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  keywords: [
    "python game",
    "python quiz",
    "python output",
    "code output",
    "match code to output",
    "coding game",
    "interactive python",
    "learn python by playing",
    "python practice",
    "beginner python",
    "intermediate python",
    "sudden death quiz",
    "50 questions",
    "timed quiz",
    "PyLearn",
  ],
  openGraph: {
    title: "Code Match – Python Output Matching Game (Sudden‑Death, 50 Questions)",
    description:
      "Match Python code to its output in a timed, sudden‑death quiz. 50 randomized questions with instant feedback.",
    type: "website",
    url: "/games/code-match",
    siteName: "PyLearn",
    locale: "en_US",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "PyLearn Code Match – Python Output Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Match – Python Output Matching Game",
    description:
      "Timed, sudden‑death Python quiz. Match code to output across 50 randomized questions with instant feedback.",
    images: ["/icon.png"],
  },
}

export default function Page() {
  return (
    <>
      <CodeMatchGame />
      <Script id="ld-code-match" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Game",
          name: "Code Match – Python Output Matching Game",
          description:
            "Practice Python by matching code to output in a fast, sudden-death quiz. 50 randomized questions, 30s per round.",
          url: "/games/code-match",
          inLanguage: "en",
          genre: ["Educational", "Quiz", "Programming"],
          applicationCategory: "EducationalApplication",
          operatingSystem: "Any",
          publisher: { "@type": "Organization", name: "PyLearn" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          isAccessibleForFree: true,
        })}
      </Script>
    </>
  )
}

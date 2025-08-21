import type { Metadata } from "next"
import CodeMatchGame from "@/components/games/CodeMatchGame"

export const metadata: Metadata = {
  title: "Code Match – Python Game | PyLearn",
  description: "Match Python code with its correct output. Speedy rounds, instant feedback, pure fun.",
  alternates: { canonical: "/games/code-match" },
  robots: { index: true, follow: true },
  keywords: [
    "python game",
    "code match",
    "match output",
    "learn python by playing",
    "python quiz",
  ],
  openGraph: {
    title: "Code Match – Python Game",
    description: "Match Python code with its correct output. Speedy rounds, instant feedback, pure fun.",
    type: "website",
    url: "/games/code-match",
    siteName: "PyLearn",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Match – Python Game",
    description: "Match Python code with its correct output. Speedy rounds, instant feedback, pure fun.",
    images: ["/icon.png"],
  },
}

export default function Page() {
  return <CodeMatchGame />
}

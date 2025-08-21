import type { Metadata } from "next"
import SyntaxPuzzleGame from "@/components/games/SyntaxPuzzleGame"

export const metadata: Metadata = {
  title: "Syntax Puzzle – Python Game | PyLearn",
  description: "Arrange Python code blocks into the correct order. Drag, drop, and nail that syntax.",
  alternates: { canonical: "/games/syntax-puzzle" },
  robots: { index: true, follow: true },
  keywords: [
    "python game",
    "syntax puzzle",
    "drag drop code",
    "learn python by playing",
    "python blocks",
  ],
  openGraph: {
    title: "Syntax Puzzle – Python Game",
    description: "Arrange Python code blocks into the correct order. Drag, drop, and nail that syntax.",
    type: "website",
    url: "/games/syntax-puzzle",
    siteName: "PyLearn",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Syntax Puzzle – Python Game",
    description: "Arrange Python code blocks into the correct order. Drag, drop, and nail that syntax.",
    images: ["/icon.png"],
  },
}

export default function Page() {
  return <SyntaxPuzzleGame />
}

import type { Metadata } from "next"
import VariableNamingGame from "@/components/games/VariableNamingGame"

export const metadata: Metadata = {
  title: "Variable Detective – Python Game | PyLearn",
  description: "Hunt for valid Python variable names. No spaces, no drama, just clean identifiers.",
  alternates: { canonical: "/games/variable-naming" },
  robots: { index: true, follow: true },
  keywords: [
    "python game",
    "variable detective",
    "variable naming rules",
    "python identifiers",
    "learn python by playing",
  ],
  openGraph: {
    title: "Variable Detective – Python Game",
    description: "Hunt for valid Python variable names. No spaces, no drama, just clean identifiers.",
    type: "website",
    url: "/games/variable-naming",
    siteName: "PyLearn",
    images: ["/icon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Variable Detective – Python Game",
    description: "Hunt for valid Python variable names. No spaces, no drama, just clean identifiers.",
    images: ["/icon.png"],
  },
}

export default function Page() {
  return <VariableNamingGame />
}
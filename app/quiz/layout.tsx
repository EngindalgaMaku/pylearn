import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: "Quiz | PyLearn",
  description: "Test your Python knowledge with interactive quizzes. Mobile-first, fast, and fun.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/quiz" },
  openGraph: {
    type: "website",
    url: "/quiz",
    title: "Quiz | PyLearn",
    description: "Test your Python knowledge with interactive quizzes. Mobile-first, fast, and fun.",
    siteName: "PyLearn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiz | PyLearn",
    description: "Test your Python knowledge with interactive quizzes. Mobile-first, fast, and fun.",
  },
}

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

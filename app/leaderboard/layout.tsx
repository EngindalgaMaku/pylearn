import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const url = `${baseUrl}/leaderboard`
const title = "Leaderboard | PyLearn"
const description = "See top performers on PyLearn's weekly and monthly leaderboards and challenge your friends."
const image = `${baseUrl}/brand-snake.svg`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    url,
    title,
    description,
    type: "website",
    siteName: "PyLearn",
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children
}

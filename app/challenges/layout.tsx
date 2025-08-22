import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net"
const url = `${baseUrl}/challenges`
const title = "Python Challenges | PyLearn"
const description = "Level up your Python skills with daily, weekly, and special coding challenges on PyLearn."
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

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children
}

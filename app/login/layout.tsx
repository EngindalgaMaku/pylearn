import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const url = `${baseUrl}/login`
const title = "Log In | PyLearn"
const description = "Log in to your PyLearn account to track progress, join challenges, and access your learning dashboard."
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
    index: false,
    follow: true,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

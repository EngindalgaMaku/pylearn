import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const url = `${baseUrl}/register`
const title = "Create Account | PyLearn"
const description = "Create your PyLearn account to start learning Python with interactive lessons, tips, and challenges."
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

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}

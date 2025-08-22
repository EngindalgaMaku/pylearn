import type { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
const url = `${baseUrl}/contact`
const title = "Contact Us | PyLearn"
const description = "Get in touch with the PyLearn team. We're here to help with support, feedback, and partnership inquiries."
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

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}

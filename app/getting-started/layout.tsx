import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: "Getting Started | PyLearn",
  description: "Start your Python learning journey on PyLearn with quick setup and first steps.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/getting-started" },
  openGraph: {
    type: "website",
    url: "/getting-started",
    title: "Getting Started | PyLearn",
    description: "Start your Python learning journey on PyLearn with quick setup and first steps.",
    siteName: "PyLearn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Getting Started | PyLearn",
    description: "Start your Python learning journey on PyLearn with quick setup and first steps.",
  },
}

export default function GettingStartedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

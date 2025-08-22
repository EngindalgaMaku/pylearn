import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net"

export const metadata: Metadata = {
  title: "Learning Analytics | PyLearn",
  description: "Track your learning progress, weekly activity, and monthly performance on PyLearn.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/analytics" },
  openGraph: {
    type: "website",
    url: "/analytics",
    title: "Learning Analytics | PyLearn",
    description: "Track your learning progress, weekly activity, and monthly performance on PyLearn.",
    siteName: "PyLearn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learning Analytics | PyLearn",
    description: "Track your learning progress, weekly activity, and monthly performance on PyLearn.",
  },
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

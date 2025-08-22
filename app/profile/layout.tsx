import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: "Your Profile | PyLearn",
  description: "View and manage your PyLearn profile, progress, and settings.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/profile" },
  openGraph: {
    type: "website",
    url: "/profile",
    title: "Your Profile | PyLearn",
    description: "View and manage your PyLearn profile, progress, and settings.",
    siteName: "PyLearn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Profile | PyLearn",
    description: "View and manage your PyLearn profile, progress, and settings.",
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

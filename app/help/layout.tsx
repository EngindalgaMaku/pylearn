import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  title: "Help & Support | PyLearn",
  description: "Get help with PyLearn: FAQs, troubleshooting, and contact support.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/help" },
  openGraph: {
    type: "website",
    url: "/help",
    title: "Help & Support | PyLearn",
    description: "Get help with PyLearn: FAQs, troubleshooting, and contact support.",
    siteName: "PyLearn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help & Support | PyLearn",
    description: "Get help with PyLearn: FAQs, troubleshooting, and contact support.",
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

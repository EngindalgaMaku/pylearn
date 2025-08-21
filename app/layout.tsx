import type React from "react"
import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import { Open_Sans } from "next/font/google"
import "./globals.css"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
})

export const metadata: Metadata = {
  title: "PyLearn - Python Learning App",
  description: "Master Python through fun and games",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    other: [
      { rel: "mask-icon", url: "/maskable-512.png", color: "#a16207" }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable} antialiased`}>
      <body className="min-h-screen flex flex-col">

        {/* Desktop fixed nav */}
        <nav className="hidden md:block fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-40">
          <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-3 lg:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8 lg:gap-12">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xl lg:text-2xl font-bold text-primary font-[family-name:var(--font-work-sans)]">
                      PyLearn 🐍
                    </span>
                    <span className="text-xs lg:text-sm text-muted-foreground -mt-1">
                      Master Python through fun and games
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-4 lg:gap-6 ml-4 lg:ml-8">
                  <Link href="/learn">
                    <Button variant="ghost" size="sm" className="text-sm lg:text-base font-medium">
                      Learn
                    </Button>
                  </Link>
                  <Link href="/activities">
                    <Button variant="ghost" size="sm" className="text-sm lg:text-base font-medium">
                      Activities
                    </Button>
                  </Link>
                  <Link href="/challenges">
                    <Button variant="ghost" size="sm" className="text-sm lg:text-base font-medium">
                      Challenges
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="ghost" size="sm" className="text-sm lg:text-base font-medium">
                      💎 Shop
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="ghost" size="sm" className="text-sm lg:text-base font-medium">
                      Leaderboard
                    </Button>
                  </Link>
                </div>
              </div>
              <Link href="/profile">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent lg:px-4">
                  <span className="text-sm lg:text-base">👤</span>
                  <span className="lg:text-base">Profile</span>
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content with offsets for fixed navs */}
        <main className="flex-1 md:pt-20 lg:pt-24 pb-24 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
          <div className="max-w-md mx-auto px-2 py-3">
            <div className="flex justify-around">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-2">
                  <span className="text-lg">🏠</span>
                  <span className="text-xs">Home</span>
                </Button>
              </Link>
              <Link href="/learn">
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-2">
                  <span className="text-lg">📚</span>
                  <span className="text-xs">Learn</span>
                </Button>
              </Link>
              <Link href="/activities">
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-2">
                  <span className="text-lg">🎯</span>
                  <span className="text-xs">Activities</span>
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-2">
                  <span className="text-lg">💎</span>
                  <span className="text-xs">Shop</span>
                </Button>
              </Link>
              <Link href="/challenges">
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-2">
                  <span className="text-lg">⚡</span>
                  <span className="text-xs">Challenges</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-2">
                  <span className="text-lg">👤</span>
                  <span className="text-xs">Profile</span>
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <Footer />
      </body>
    </html>
  )
}

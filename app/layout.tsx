import type React from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import ConditionalFooter from "@/components/ConditionalFooter";
import HideOnConsole from "@/components/HideOnConsole";
import ConsoleMainPadding from "@/components/ConsoleMainPadding";
import Script from "next/script";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Providers from "./providers";
import { Toaster } from "@/components/ui/toaster";
import AdminConsoleLink from "@/components/AdminConsoleLink";
import MobileNavigation from "@/components/MobileNavigation";
import DesktopNavigation from "@/components/DesktopNavigation";

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pylearn.net";
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-9WSSY1Y958";

export const metadata: Metadata = {
  title: "PyLearn - Python Learning App",
  description: "Master Python through fun and games",
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    other: [{ rel: "mask-icon", url: "/maskable-512.png", color: "#a16207" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${openSans.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <Providers>
          {/* Google Analytics */}
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
          </Script>

          {/* Desktop fixed nav (hidden on /console) */}
          <HideOnConsole>
            <DesktopNavigation />
          </HideOnConsole>

          {/* Main content with conditional offsets (compact on /console) */}
          <ConsoleMainPadding>
            {children}
            <Toaster />
          </ConsoleMainPadding>

          {/* Mobile bottom nav (hidden on /console) */}
          <HideOnConsole>
            <MobileNavigation />
          </HideOnConsole>

          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}

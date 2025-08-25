"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminConsoleLink from "./AdminConsoleLink";

const navItems = [
  { href: "/learn", label: "Learn" },
  { href: "/activities", label: "Activities" },
  { href: "/challenges", label: "Challenges" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/shop", label: "💎 Shop" },
];

export default function DesktopNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 bg-gradient-to-r from-white/95 via-white/98 to-white/95 backdrop-blur-md border-b border-gray-200/30 z-40 shadow-lg shadow-gray-200/20">
      <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 lg:gap-12">
            <Link
              href="/"
              className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <img
                  src="/python.svg"
                  alt="PyLearn - Python Öğrenme Platformu"
                  width="32"
                  height="32"
                  className="h-7 w-7 lg:h-8 lg:w-8 transition-all duration-300 group-hover:drop-shadow-md"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent font-[family-name:var(--font-work-sans)] group-hover:from-blue-600 group-hover:to-purple-700 transition-all duration-300">
                  PyLearn
                </span>
                <span className="text-xs lg:text-sm text-muted-foreground -mt-1 group-hover:text-foreground/80 transition-colors duration-300">
                  Master Python through fun and games
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2 lg:gap-3 ml-4 lg:ml-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    size="sm"
                    className={`text-sm lg:text-base font-medium transition-all duration-300 ${
                      isActive(item.href)
                        ? "bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white shadow-md shadow-primary/30 scale-105 hover:shadow-lg hover:shadow-primary/40"
                        : "hover:bg-slate-100/80 hover:scale-105 hover:shadow-sm text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              <AdminConsoleLink />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

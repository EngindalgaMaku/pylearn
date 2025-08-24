"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AdminConsoleLink from "./AdminConsoleLink";

const navItems = [
  { href: "/", icon: "/python.svg", label: "Home", isImage: true },
  { href: "/learn", icon: "📚", label: "Learn" },
  { href: "/activities", icon: "🎯", label: "Activities" },
  { href: "/challenges", icon: "⚡", label: "Challenges" },
  { href: "/shop", icon: "💎", label: "Shop" },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-card/90 backdrop-blur-md border-t border-border/60 md:hidden shadow-lg shadow-slate-200/20">
      <div className="max-w-md mx-auto px-2 py-3">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? "default" : "ghost"}
                size="sm"
                className={`flex-col gap-1 h-auto py-2 px-3 transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-gradient-to-b from-primary via-primary/90 to-primary/80 text-white shadow-md shadow-primary/30 scale-105"
                    : "hover:bg-slate-100/80 hover:scale-105 text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.isImage ? (
                  <img
                    src={item.icon}
                    alt={item.label}
                    width="24"
                    height="24"
                    className={`h-6 w-6 transition-all duration-300 ${
                      isActive(item.href) ? "brightness-0 invert" : ""
                    }`}
                  />
                ) : (
                  <span
                    className={`text-lg transition-all duration-300 ${
                      isActive(item.href) ? "scale-110" : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
                <span
                  className={`text-xs font-medium transition-all duration-300 ${
                    isActive(item.href) ? "text-white" : ""
                  }`}
                >
                  {item.label}
                </span>
              </Button>
            </Link>
          ))}
          <AdminConsoleLink variant="ghost" />
        </div>
      </div>
    </nav>
  );
}

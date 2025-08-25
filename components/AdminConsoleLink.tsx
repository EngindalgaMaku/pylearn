"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminConsoleLink({
  size = "sm",
  variant = "default",
}: {
  size?: any;
  variant?: any;
}) {
  const { data } = useSession();
  const pathname = usePathname();
  const role = (data?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return null;

  const active = pathname?.startsWith("/console");

  if (variant === "ghost") {
    return (
      <Link href="/console">
        <Button
          variant="ghost"
          size="sm"
          className="flex-col gap-1 h-auto py-2 px-2"
        >
          <span className="text-lg">🛡️</span>
          <span className="text-xs">Console</span>
        </Button>
      </Link>
    );
  }

  const base = "text-sm lg:text-base font-semibold inline-flex items-center gap-2";
  const styles = active
    ? "bg-amber-600 text-white hover:bg-amber-600 shadow-sm"
    : "bg-amber-500/20 text-amber-800 hover:bg-amber-500/30 border border-amber-600/40";

  return (
    <Link href="/console">
      <Button
        size={size}
        className={`${base} ${styles} px-2 py-2 lg:px-2 lg:py-2 rounded-md`}
        aria-label="Admin Console"
        title="Admin Console"
      >
        {/* Lock icon (Heroicons lock-closed) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3h-.75A2.25 2.25 0 003.75 12v6A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18v-6A2.25 2.25 0 0018 9.75h-.75v-3A5.25 5.25 0 0012 1.5zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
            clipRule="evenodd"
          />
        </svg>
        <span className="sr-only">Console</span>
      </Button>
    </Link>
  );
}

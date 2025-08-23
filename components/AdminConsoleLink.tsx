"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminConsoleLink({ size = "sm" }: { size?: any }) {
  const { data } = useSession();
  const pathname = usePathname();
  const role = (data?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return null;

  const active = pathname?.startsWith("/console");
  const base = "text-sm lg:text-base font-semibold inline-flex items-center gap-2";
  const styles = active
    ? "bg-amber-600 text-white hover:bg-amber-600 shadow-sm"
    : "bg-amber-500/20 text-amber-800 hover:bg-amber-500/30 border border-amber-600/40";

  return (
    <Link href="/console">
      <Button size={size} className={`${base} ${styles}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 2.25c-.41 0-.82.093-1.193.278L6.12 4.38A2.25 2.25 0 0 0 4.875 6.4c0 5.185 3.068 9.88 7.81 11.875a.75.75 0 0 0 .63 0c4.742-1.996 7.81-6.69 7.81-11.875a2.25 2.25 0 0 0-1.245-2.02l-4.687-1.853A2.25 2.25 0 0 0 12 2.25z" />
          <path d="M10.28 12.03a.75.75 0 0 1 1.06 0l3.19-3.19a.75.75 0 1 1 1.06 1.06l-3.72 3.72a.75.75 0 0 1-1.06 0l-1.72-1.72a.75.75 0 1 1 1.06-1.06l1.19 1.19z" />
        </svg>
        <span>Console</span>
      </Button>
    </Link>
  );
}

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function HideOnConsole({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/console")) return null;
  return <>{children}</>;
}

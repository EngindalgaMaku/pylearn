"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function ConsoleMainPadding({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onConsole = pathname?.startsWith("/console");
  const base = "flex-1 md:pb-0";
  const nonConsole = "md:pt-20 lg:pt-24 pb-24"; // original offsets for global navs
  const consolePad = "pt-4 lg:pt-6 pb-6"; // compact spacing for admin
  return <main className={`${base} ${onConsole ? consolePad : nonConsole}`}>{children}</main>;
}

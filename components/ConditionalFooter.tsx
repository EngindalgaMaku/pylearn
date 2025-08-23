"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  // Hide footer for admin console pages
  if (pathname?.startsWith("/console")) return null;
  return <Footer />;
}

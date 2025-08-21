"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type MobilePageHeaderProps = {
  title: string
  subtitle?: string
  backHref?: string
}

export function MobilePageHeader({ title, subtitle, backHref = "/" }: MobilePageHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 py-6 md:hidden">
      <div className="max-w-md mx-auto flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-primary">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
"use client"

import React from "react"

type FAQ = { q: string; a: string }

export type GameSEOSectionProps = {
  title: string
  description: string
  keywords?: string[]
  features?: string[]
  faq?: FAQ[]
}

export default function GameSEOSection({ title, description, keywords = [], features = [], faq = [] }: GameSEOSectionProps) {
  return (
    <section aria-label={`${title} information`} className="max-w-md mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">About {title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {features.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Why you'll love it</h3>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {faq.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">FAQ</h3>
          <div className="divide-y border rounded-md">
            {faq.map((item, i) => (
              <details key={i} className="p-3 [&_summary]:cursor-pointer">
                <summary className="font-medium">{item.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="sr-only" aria-hidden>
          {/* Hidden keyword hint for SEO while keeping UI clean */}
          <ul>
            {keywords.map((k, i) => (
              <li key={i}>{k}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

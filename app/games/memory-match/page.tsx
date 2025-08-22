import type { Metadata } from "next"
import MemoryMatchGame from "@/components/games/MemoryMatchGame"

export const metadata: Metadata = {
  title: "Memory Match | PyLearn Games",
  description: "Flip cards and match Python concepts to reinforce recall.",
}

export default function MemoryMatchPage() {
  // Uses the built-in bank slug to generate pairs. Adjust pairCount for difficulty.
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      <MemoryMatchGame slug="python-basics-matching" pairCount={8} />
    </div>
  )
}

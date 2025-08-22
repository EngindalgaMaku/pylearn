import type { Metadata } from "next"
import LoopRunnerGame from "@/components/games/LoopRunnerGame"

export const metadata: Metadata = {
  title: "Loop Runner | PyLearn",
  description: "Predict outputs of Python loops.",
}

export default function Page() {
  return <LoopRunnerGame />
}

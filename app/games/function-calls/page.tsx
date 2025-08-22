import type { Metadata } from "next"
import FunctionCallsGame from "@/components/games/FunctionCallsGame"

export const metadata: Metadata = {
  title: "Function Calls | PyLearn",
  description: "Predict outputs of simple Python function calls.",
}

export default function Page() {
  return <FunctionCallsGame />
}

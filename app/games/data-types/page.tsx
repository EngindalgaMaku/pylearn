import type { Metadata } from "next"
import DataTypesGame from "@/components/games/DataTypesGame"

export const metadata: Metadata = {
  title: "Data Types Game | PyLearn",
  description: "Identify Python data types in a quick quiz.",
}

export default function Page() {
  return <DataTypesGame />
}

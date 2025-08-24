import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ChallengesClient, { type InitialAuth } from "./Client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function ChallengesPage() {
  const session = await getServerSession(authOptions as any)
  const user = (session as any)?.user
  const initialAuth: InitialAuth = user
    ? { status: "authenticated", user }
    : { status: "unauthenticated" }

  return <ChallengesClient initialAuth={initialAuth} />
}

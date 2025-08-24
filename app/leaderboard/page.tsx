import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import LeaderboardClient, { type InitialAuth } from "./Client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions as any)
  const user = (session as any)?.user
  const initialAuth: InitialAuth = user
    ? { status: "authenticated", user }
    : { status: "unauthenticated" }

  return <LeaderboardClient initialAuth={initialAuth} />
}

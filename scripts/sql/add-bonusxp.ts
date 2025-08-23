import { prisma } from "../../lib/prisma"

async function main() {
  try {
    // Add bonusXP column if it doesn't exist
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "public"."game_sessions" ADD COLUMN IF NOT EXISTS "bonusXP" INTEGER NOT NULL DEFAULT 0;'
    )
    console.log("Added column bonusXP to public.game_sessions (if it was missing)")
  } catch (e) {
    console.error("Failed to add bonusXP column:", e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

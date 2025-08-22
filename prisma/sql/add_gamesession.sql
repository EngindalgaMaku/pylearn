-- Create game_sessions table without resetting existing data
-- Safe and idempotent: only creates if missing

CREATE TABLE IF NOT EXISTS "game_sessions" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL,
  "gameKey" text NOT NULL,
  "score" integer NOT NULL DEFAULT 0,
  "correctCount" integer NOT NULL DEFAULT 0,
  "durationSec" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "completedAt" timestamp with time zone,
  CONSTRAINT "game_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "game_sessions_userId_gameKey_createdAt_idx"
  ON "game_sessions" ("userId", "gameKey", "createdAt");

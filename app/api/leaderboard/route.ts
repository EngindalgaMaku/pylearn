import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Simple leaderboard endpoint.
// If you later add DB support, replace the static data below with a real query.
export async function GET() {
  try {
    // Static fallback data; replace with DB query if available.
    const items = [
      { name: "Alex Chen", xp: 2450, rank: 1 },
      { name: "Jordan Lee", xp: 1860, rank: 2 },
      { name: "You", xp: 1250, rank: 3, you: true },
      { name: "Sam Patel", xp: 980, rank: 4 },
    ]

    return NextResponse.json(
      { success: true, items },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (e) {
    return NextResponse.json(
      {
        success: true,
        // Safe fallback
        items: [
          { name: "Alex Chen", xp: 2450, rank: 1 },
          { name: "You", xp: 1200, rank: 3, you: true },
        ],
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}
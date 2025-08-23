import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Refund API is deprecated. Shop admin now manages cards only." },
    { status: 410 },
  );
}

import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { prisma } from "@/lib/prisma"
import { verifyImageToken } from "@/lib/imageToken"

function normalizePublicPath(p?: string | null): string | null {
  if (!p) return null
  let s = p.trim()
  if (!s) return null

  // Already absolute remote
  if (s.startsWith("http://") || s.startsWith("https://")) return s

  // Normalize slashes
  s = s.replace(/\\/g, "/")

  // Strip "public/" prefix
  s = s.replace(/^public\//, "/")

  // Ensure leading slash
  if (!s.startsWith("/")) s = "/" + s

  return s
}

function resolveOnDisk(relativeUrl: string | null): string | null {
  if (!relativeUrl) return null
  const clean = relativeUrl.startsWith("/") ? relativeUrl.slice(1) : relativeUrl

  // Try candidate locations
  const candidates = [
    path.join(process.cwd(), "public", clean),
    path.join(process.cwd(), clean),
    // Docker-like path hint
    path.join("/app/public", clean),
  ]

  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

function getMime(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".webp":
      return "image/webp"
    case ".gif":
      return "image/gif"
    default:
      return "application/octet-stream"
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get("cardId")
    const type = (searchParams.get("type") || "preview").toLowerCase() // thumbnail | preview | full
    const token = searchParams.get("token") || ""

    if (!cardId) {
      return NextResponse.json({ error: "cardId required" }, { status: 400 })
    }

    // Verify token (time-bound HMAC)
    if (!verifyImageToken(token, cardId, type)) {
      return NextResponse.json({ error: "invalid or expired token" }, { status: 401 })
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        imagePath: true,
        thumbnailUrl: true,
      } as any,
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // Choose best path according to type
    let candidatePath: string | null = null
    if (type === "thumbnail") {
      candidatePath =
        normalizePublicPath((card as any).thumbnailUrl) ||
        normalizePublicPath((card as any).imagePath)
    } else if (type === "full") {
      candidatePath =
        normalizePublicPath((card as any).imagePath) ||
        normalizePublicPath((card as any).thumbnailUrl)
    } else {
      // preview
      candidatePath =
        normalizePublicPath((card as any).imagePath) ||
        normalizePublicPath((card as any).thumbnailUrl)
    }

    // If it’s a remote URL, proxying could be implemented; for now expect local public files
    if (!candidatePath || candidatePath.startsWith("http")) {
      // Attempt to fallback to placeholder in public
      const placeholder = path.join(process.cwd(), "public", "placeholder.svg")
      if (existsSync(placeholder)) {
        const buffer = await readFile(placeholder)
        return new NextResponse(buffer as any, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })
      }
      return NextResponse.json({ error: "Image not available" }, { status: 404 })
    }

    const filePath = resolveOnDisk(candidatePath)
    if (!filePath) {
      // Fallback to placeholder instead of hard 404 for better UX
      const placeholder = path.join(process.cwd(), "public", "placeholder.svg")
      if (existsSync(placeholder)) {
        const buffer = await readFile(placeholder)
        return new NextResponse(buffer as any, {
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        })
      }
      return NextResponse.json(
        { error: "File not found", path: candidatePath },
        { status: 404 }
      )
    }

    const buffer = await readFile(filePath)
    const headers = new Headers({
      "Content-Type": getMime(filePath),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
    })

    return new NextResponse(buffer as any, { headers })
  } catch (err) {
    console.error("secure-image error", err)
    return NextResponse.json({ error: "Image load failed" }, { status: 500 })
  }
}
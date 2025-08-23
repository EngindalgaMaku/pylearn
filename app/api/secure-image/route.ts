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

  // If looks like an absolute filesystem path (Windows C:/... or Unix /home/..), keep as-is
  const isWinAbs = /^[a-zA-Z]:\//.test(s)
  const isUnixAbs = s.startsWith("/") && !s.startsWith("//")
  if (isWinAbs || isUnixAbs) {
    return s
  }

  // Strip "public/" prefix
  s = s.replace(/^public\//, "/")

  // Ensure leading slash
  if (!s.startsWith("/")) s = "/" + s

  return s
}

function resolveOnDisk(relativeUrl: string | null): string | null {
  if (!relativeUrl) return null
  // If absolute filesystem path, use directly
  const absCheck = relativeUrl.replace(/\\/g, "/")
  const isWinAbs = /^[a-zA-Z]:\//.test(absCheck)
  const isUnixAbs = absCheck.startsWith("/") && !absCheck.startsWith("//") && !absCheck.startsWith("/uploads/")
  if (isWinAbs || isUnixAbs) {
    return existsSync(absCheck) ? absCheck : null
  }

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
        imageUrl: true,
        thumbnailUrl: true,
      } as any,
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // Build ordered candidates
    const normalizedThumb = normalizePublicPath((card as any).thumbnailUrl)
    const normalizedFull = normalizePublicPath((card as any).imagePath)
    const normalizedUrl = normalizePublicPath((card as any).imageUrl)

    // Derive a thumbnail path if missing: /uploads/categories/<slug>/thumbs/thumbs_<file>
    function deriveThumb(fromFull: string | null): string | null {
      if (!fromFull) return null
      try {
        // Expect something like /uploads/categories/<slug>/<file>
        const parts = fromFull.split("/").filter(Boolean)
        const file = parts.pop() || ""
        if (!file) return null
        const thumbsFile = `thumbs_${file}`
        // If path already contains 'thumbs', just return it
        if (parts[parts.length - 1] === "thumbs") {
          return "/" + [...parts, thumbsFile].join("/")
        }
        // Insert thumbs directory at end
        return "/" + [...parts, "thumbs", thumbsFile].join("/")
      } catch {
        return null
      }
    }

    const computedThumb = normalizedThumb || deriveThumb(normalizedFull)
    const candidates: (string | null)[] =
      type === "thumbnail"
        ? [computedThumb, normalizedUrl, normalizedFull]
        : [normalizedFull, normalizedUrl, computedThumb] // full and preview prefer full first

    // Try each candidate: proxy remote or read local
    for (const candidatePath of candidates) {
      if (!candidatePath) continue
      if (candidatePath.startsWith("http://") || candidatePath.startsWith("https://")) {
        try {
          const upstream = await fetch(candidatePath)
          if (upstream.ok && upstream.body) {
            const contentType = upstream.headers.get("content-type") || "application/octet-stream"
            const arrBuf = await upstream.arrayBuffer()
            return new NextResponse(Buffer.from(arrBuf) as any, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "private, no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
                "X-Content-Type-Options": "nosniff",
              },
            })
          }
        } catch (e) {
          // try next candidate
        }
        continue
      }

      const filePath = resolveOnDisk(candidatePath)
      if (filePath) {
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
      }
    }

    // Final placeholder if all candidates fail
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
  } catch (err) {
    console.error("secure-image error", err)
    return NextResponse.json({ error: "Image load failed" }, { status: 500 })
  }
}
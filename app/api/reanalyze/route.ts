import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeRequestCategory(input: string) {
  const c = (input || "").toLowerCase();
  if (c === "anime") return "anime-collection";
  if (c === "star") return "star-collection";
  if (c === "car") return "car-collection";
  return c || "anime-collection";
}

function buildWhere(categoryParam?: string) {
  const incoming = (categoryParam || "all").toLowerCase();
  const effective = !incoming || incoming === "all" ? "anime-collection" : normalizeRequestCategory(incoming);
  const categoryMappings: Record<string, string[]> = {
    "anime-collection": ["anime-collection", "anime"],
    "star-collection": ["star-collection", "star"],
    "car-collection": ["car-collection", "car"],
  };
  const mapped = categoryMappings[effective];
  return {
    category: mapped ? { in: mapped } : effective,
  } as any;
}

export async function GET(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session || !(session as any)?.user || (session as any)?.user?.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = (searchParams.get("category") || "all").toLowerCase();
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") || "100")));
  const batchSize = Math.min(100, Math.max(1, Number(searchParams.get("batchSize") || "25")));

  const where = buildWhere(category);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: any) => {
        const line = `data: ${JSON.stringify(obj)}\n\n`;
        controller.enqueue(encoder.encode(line));
      };

      try {
        const total = await prisma.card.count({ where } as any);
        send({ type: "start", total, message: `Starting reanalysis for ${total} cards` });
        if (total === 0) {
          send({ type: "done", success: 0, failed: 0, processed: 0, total });
          controller.close();
          return;
        }

        let processed = 0;
        let success = 0;
        let failed = 0;

        // paginate IDs server-side
        for (let offset = 0; offset < total; offset += pageSize) {
          const page = await prisma.card.findMany({
            where,
            select: { id: true },
            skip: offset,
            take: pageSize,
            orderBy: [
              { uploadDate: "desc" as const },
              { id: "desc" as const },
            ],
          });
          const ids = page.map((p) => p.id);
          if (ids.length === 0) continue;

          // process in batches
          for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            send({ type: "progress", processed, success, failed, total, message: `Analyzing ${processed + 1}-${Math.min(processed + batch.length, total)}…` });
            try {
              const analyzeUrl = new URL("/api/analyze", req.url).toString();
              const res = await fetch(analyzeUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bulkAnalysis: true, cardIds: batch, forceReAnalysis: true }),
              });
              if (!res.ok) throw new Error(`Analyze batch failed: ${res.status}`);
              const data = await res.json().catch(() => ({}));
              success += Number(data?.successful || batch.length);
              failed += Number(data?.failed || 0);
            } catch (e) {
              failed += batch.length;
            } finally {
              processed += batch.length;
              send({ type: "progress", processed, success, failed, total });
              // tiny delay to avoid overwhelming downstream
              await new Promise((r) => setTimeout(r, 75));
            }
          }
        }

        send({ type: "done", processed, success, failed, total });
        controller.close();
      } catch (e: any) {
        send({ type: "error", message: e?.message || "Unexpected error" });
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

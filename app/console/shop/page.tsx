import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { generateImageToken } from "@/lib/imageToken";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import ImagePreview from "@/components/ImagePreview";
import BulkUploadClient from "@/components/BulkUploadClient";
import ReanalyzeButtons from "@/components/ReanalyzeButtons";
import ReanalyzeAllButton from "@/components/ReanalyzeAllButton";
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Top-level server actions to avoid hydration issues from inline closures
export async function bulkFilteredAction(formData: FormData) {
  "use server";
  const q = String(formData.get("q") || "").trim();
  const category = String(formData.get("category") || "anime-collection");
  const rarity = String(formData.get("rarity") || "").trim();
  const purch = String(formData.get("purch") || "");
  const pub = String(formData.get("pub") || "");
  const field = String(formData.get("field") || "");
  const value = String(formData.get("value") || "");
  const op = String(formData.get("op") || "apply");
  const cleanLimit = Math.min(
    5000,
    Math.max(50, Number(formData.get("clean_limit") || 500))
  );
  const setRarity = String(formData.get("setRarity") || "").trim();
  const pageStr = String(formData.get("page") || "1");
  const sizeStr = String(formData.get("size") || "10");

  const normCat = (input: string) => {
    const c = (input || "").toLowerCase();
    if (c === "anime collection" || c === "anime") return "anime-collection";
    if (c === "star collection" || c === "star") return "star-collection";
    if (c === "car collection" || c === "car") return "car-collection";
    return c || "anime-collection";
  };
  const catEff = normCat(category);
  const catWhere: Prisma.CardWhereInput | {} = category
    ? {
        OR: [
          { category: { equals: catEff, mode: Prisma.QueryMode.insensitive } },
          {
            category: {
              equals: catEff.split("-")[0],
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            category: {
              equals:
                catEff === "anime-collection"
                  ? "Anime Collection"
                  : catEff === "star-collection"
                  ? "Star Collection"
                  : catEff === "car-collection"
                  ? "Car Collection"
                  : catEff,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }
    : {};

  const where: Prisma.CardWhereInput | undefined =
    q || category || rarity || purch || pub
      ? {
          AND: [
            q
              ? {
                  OR: [
                    {
                      name: { contains: q, mode: Prisma.QueryMode.insensitive },
                    },
                    {
                      cardTitle: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      series: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      character: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  ],
                }
              : {},
            catWhere as any,
            rarity ? { rarity } : {},
            purch ? { isPurchasable: purch === "yes" } : {},
            pub ? { isPublic: pub === "yes" } : {},
          ],
        }
      : undefined;

  if (op === "clean_titles") {
    const sanitizeTitle = (input?: string | null): string => {
      if (!input) return "";
      let s = String(input);
      s = s.replace(/^\d{6,}[_-][0-9a-f]{4,}[_-]/i, "");
      s = s.replace(/[_-]+/g, " ");
      s = s
        .split(/\s+/)
        .filter((tok) => {
          const t = tok.trim();
          if (!t) return false;
          if (/^\d{4,}$/i.test(t)) return false;
          if (/^[0-9a-f]{4,}$/i.test(t)) return false;
          if (/^[0-9a-z]{8,}$/i.test(t)) return false;
          if (/[0-9]/.test(t)) return false;
          if (/^\d{8}$/.test(t)) return false;
          if (/^\d{4}$/.test(t)) return false;
          if (/^[0-9a-f]{3,8}$/i.test(t)) return false;
          return true;
        })
        .join(" ");
      s = s
        .replace(/[0-9a-z]{10,}/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      s = s.replace(/\b(Anime Collection)\s+\1\b/gi, "$1");
      return s;
    };

    const friendlyCat = (slug: string) =>
      slug === "anime-collection"
        ? "Anime Collection"
        : slug === "star-collection"
        ? "Star Collection"
        : slug === "car-collection"
        ? "Car Collection"
        : slug;
    const affected = await prisma.card.findMany({
      where,
      select: {
        id: true,
        name: true,
        cardTitle: true,
        series: true,
        character: true,
        fileName: true,
        category: true,
      },
      orderBy: { id: "asc" },
      take: cleanLimit,
    });
    for (const c of affected) {
      const baseFromFile = (c.fileName || "").replace(
        /\.(png|jpe?g|webp|gif|bmp|tiff)$/i,
        ""
      );
      const base = sanitizeTitle(
        (c.cardTitle || c.name || baseFromFile || "").replace(/-/g, " ")
      );
      const catPrefix = friendlyCat((c as any).category || "");
      const finalTitle = sanitizeTitle(`${catPrefix} ${base}`.trim());
      // eslint-disable-next-line no-await-in-loop
      await prisma.card.update({
        where: { id: c.id },
        data: { name: finalTitle, cardTitle: finalTitle },
      });
    }
    revalidatePath("/console/shop");
    revalidatePath("/shop");
    const params = new URLSearchParams({
      q,
      category,
      rarity,
      purch,
      pub,
      page: "1",
      size: sizeStr,
    });
    redirect(`/console/shop?${params.toString()}`);
  } else if (op === "title_from_character") {
    const sanitizeTitle = (input?: string | null): string => {
      if (!input) return "";
      let s = String(input);
      s = s.replace(/^\d{6,}[_-][0-9a-f]{4,}[_-]/i, "");
      s = s.replace(/[_-]+/g, " ");
      s = s
        .split(/\s+/)
        .filter((tok) => {
          const t = tok.trim();
          if (!t) return false;
          if (/^\d{4,}$/i.test(t)) return false;
          if (/^[0-9a-f]{4,}$/i.test(t)) return false;
          if (/^[0-9a-z]{8,}$/i.test(t)) return false;
          if (/[0-9]/.test(t)) return false;
          if (/^\d{8}$/.test(t)) return false;
          if (/^\d{4}$/.test(t)) return false;
          if (/^[0-9a-f]{3,8}$/i.test(t)) return false;
          return true;
        })
        .join(" ");
      s = s
        .replace(/[0-9a-z]{10,}/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      s = s.replace(/\b(Anime Collection)\s+\1\b/gi, "$1");
      return s;
    };
    const affected = await prisma.card.findMany({
      where,
      select: { id: true, character: true },
      orderBy: { id: "asc" },
      take: cleanLimit,
    });
    for (const c of affected) {
      const title = sanitizeTitle(c.character);
      if (!title) continue;
      // eslint-disable-next-line no-await-in-loop
      await prisma.card.update({
        where: { id: c.id },
        data: { name: title, cardTitle: title },
      });
    }
    revalidatePath("/console/shop");
    revalidatePath("/shop");
    const params = new URLSearchParams({
      q,
      category,
      rarity,
      purch,
      pub,
      page: "1",
      size: sizeStr,
    });
    redirect(`/console/shop?${params.toString()}`);
  } else if (op === "backfill_uploaddate") {
    await prisma.card.updateMany({
      where: { AND: [where || {}, { uploadDate: null as any }] } as any,
      data: { uploadDate: new Date() },
    });
    revalidatePath("/console/shop");
    revalidatePath("/shop");
    const params = new URLSearchParams({
      q,
      category,
      rarity,
      purch,
      pub,
      page: pageStr,
      size: sizeStr,
    });
    redirect(`/console/shop?${params.toString()}`);
  } else {
    if (field === "isPurchasable") {
      await prisma.card.updateMany({
        where,
        data: { isPurchasable: value === "yes" },
      });
    } else if (field === "isPublic") {
      await prisma.card.updateMany({
        where,
        data: { isPublic: value === "yes" },
      });
    }
    if (setRarity) {
      await prisma.card.updateMany({ where, data: { rarity: setRarity } });
    }
    revalidatePath("/console/shop");
    const params = new URLSearchParams({
      q,
      category,
      rarity,
      purch,
      pub,
      page: pageStr,
      size: sizeStr,
    });
    redirect(`/console/shop?${params.toString()}`);
  }
}

export async function bulkSelectedAction(formData: FormData) {
  "use server";
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const action = String(formData.get("bulk_action") || "");
  const rarity = String(formData.get("bulk_rarity") || "").trim();
  const publicVal = String(formData.get("bulk_public") || "");
  const purchVal = String(formData.get("bulk_purch") || "");
  const q = String(formData.get("q") || "");
  const categorySlug = String(formData.get("category") || "");
  const purch = String(formData.get("purch") || "");
  const pub = String(formData.get("pub") || "");
  const size = String(formData.get("size") || "10");
  const page = String(formData.get("page") || "1");
  if (ids.length === 0) {
    const params = new URLSearchParams({
      q,
      category: categorySlug,
      purch,
      pub,
      page,
      size,
    });
    redirect(`/console/shop?${params.toString()}`);
  }
  const where = { id: { in: ids } } as any;
  switch (action) {
    case "delete": {
      const affected = await prisma.card.findMany({
        where,
        select: {
          id: true,
          imagePath: true,
          thumbnailUrl: true,
          imageUrl: true,
        },
      });
      for (const a of affected) {
        const absImg =
          toAbsolutePath((a as any).imagePath) ||
          toAbsolutePath((a as any).imageUrl);
        const absThumb = deriveThumbAbs(
          (a as any).imagePath,
          (a as any).thumbnailUrl
        );
        // eslint-disable-next-line no-await-in-loop
        await Promise.all([safeUnlink(absThumb), safeUnlink(absImg)]);
      }
      await prisma.card.deleteMany({ where });
      revalidatePath("/console/shop");
      revalidatePath("/shop");
      break;
    }
    case "title_from_character": {
      const sanitizeTitle = (input?: string | null): string => {
        if (!input) return "";
        let s = String(input);
        s = s.replace(/^\d{6,}[_-][0-9a-f]{4,}[_-]/i, "");
        s = s.replace(/[_-]+/g, " ");
        s = s
          .split(/\s+/)
          .filter((tok) => {
            const t = tok.trim();
            if (!t) return false;
            if (/^\d{4,}$/i.test(t)) return false;
            if (/^[0-9a-f]{4,}$/i.test(t)) return false;
            if (/^[0-9a-z]{8,}$/i.test(t)) return false;
            if (/[0-9]/.test(t)) return false;
            if (/^\d{8}$/.test(t)) return false;
            if (/^\d{4}$/.test(t)) return false;
            if (/^[0-9a-f]{3,8}$/i.test(t)) return false;
            return true;
          })
          .join(" ");
        s = s
          .replace(/[0-9a-z]{10,}/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
        s = s.replace(/\b(Anime Collection)\s+\1\b/gi, "$1");
        return s;
      };
      const affected = await prisma.card.findMany({
        where,
        select: { id: true, character: true },
      });
      for (const c of affected) {
        const title = sanitizeTitle(c.character);
        if (!title) continue;
        // eslint-disable-next-line no-await-in-loop
        await prisma.card.update({
          where: { id: c.id },
          data: { name: title, cardTitle: title },
        });
      }
      revalidatePath("/console/shop");
      revalidatePath("/shop");
      break;
    }
    case "set_public":
      if (publicVal === "yes" || publicVal === "no")
        await prisma.card.updateMany({
          where,
          data: { isPublic: publicVal === "yes" },
        });
      break;
    case "set_purch":
      if (purchVal === "yes" || purchVal === "no")
        await prisma.card.updateMany({
          where,
          data: { isPurchasable: purchVal === "yes" },
        });
      break;
    case "set_rarity": {
      if (rarity) {
        const r = await prisma.rarity.findUnique({ where: { name: rarity } });
        if (r) {
          await prisma.card.updateMany({ where, data: { rarity } });
          const affected = await prisma.card.findMany({
            where,
            select: { id: true, diamondPrice: true },
          });
          const chunk = 200;
          for (let i = 0; i < affected.length; i += chunk) {
            const slice = affected.slice(i, i + chunk);
            // eslint-disable-next-line no-await-in-loop
            await Promise.all(
              slice.map((x) =>
                prisma.card.update({
                  where: { id: x.id },
                  data: {
                    diamondPrice:
                      x.diamondPrice == null
                        ? null
                        : Math.max(
                            r.minDiamondPrice,
                            Math.min(r.maxDiamondPrice, x.diamondPrice || 0)
                          ),
                  },
                })
              )
            );
          }
        } else {
          await prisma.card.updateMany({ where, data: { rarity } });
        }
      }
      break;
    }
    default:
      break;
  }
  const params = new URLSearchParams({
    q,
    category: categorySlug,
    purch,
    pub,
    page,
    size,
  });
  redirect(`/console/shop?${params.toString()}`);
}
// Resolve a filesystem path from a stored path or public URL
function toAbsolutePath(p?: string | null): string | null {
  if (!p) return null;
  let s = String(p).trim();
  if (!s) return null;
  // URLs are not handled for deletion
  if (s.startsWith("http://") || s.startsWith("https://")) return null;
  // Normalize slashes
  s = s.replace(/\\/g, "/");
  // Windows absolute like C:/...
  if (/^[a-zA-Z]:\//.test(s)) return s;
  // Unix absolute like /home/...
  if (s.startsWith("/")) {
    // Site-relative URL: resolve under public/
    const candidate = path.join(process.cwd(), "public", s.slice(1));
    return candidate;
  }
  // Relative path on disk
  return path.join(process.cwd(), s);
}

// Derive thumbnail absolute path from known fields
function deriveThumbAbs(
  imagePath?: string | null,
  thumbnailUrl?: string | null
): string | null {
  // Prefer thumbnailUrl if present
  const thumbFromUrl = toAbsolutePath(thumbnailUrl);
  if (thumbFromUrl) return thumbFromUrl;
  // Fallback: derive from imagePath => insert /thumbs/ and prefix with thumbs_
  if (!imagePath) return null;
  let img = String(imagePath).replace(/\\/g, "/").trim();
  if (!img) return null;
  // If img is relative, make it absolute first
  const isAbsWin = /^[a-zA-Z]:\//.test(img);
  const isAbsUnix = img.startsWith("/");
  const absImg = isAbsWin || isAbsUnix ? img : path.join(process.cwd(), img);
  const dir = path.dirname(absImg);
  const file = path.basename(absImg);
  const thumbsDir = path.join(dir, "thumbs");
  const thumbsFile = `thumbs_${file}`;
  return path.join(thumbsDir, thumbsFile);
}

async function safeUnlink(p?: string | null) {
  if (!p) return;
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

type BadgeTone = "muted" | "success" | "warning";
function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  const tones: Record<BadgeTone, string> = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-green-600/90 text-white",
    warning: "bg-blue-500/90 text-white",
  };
  return <span className={`${base} ${tones[tone]}`}>{children}</span>;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin =
    typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return null;
  const sp = await searchParams;
  const getParam = (key: string) => {
    const v =
      sp?.[key] ?? (typeof sp?.get === "function" ? sp.get(key) : undefined);
    return typeof v === "string" ? v : "";
  };
  const q = getParam("q").trim();
  // Use slug-based category like the public frontend (e.g., "anime-collection")
  const category = getParam("category").trim() || "anime-collection";
  const rarity = getParam("rarity").trim();
  const purch = getParam("purch"); // yes/no
  const pub = getParam("pub"); // yes/no
  const page = Math.max(1, Number(getParam("page") || 1));
  const size = Math.min(100, Math.max(5, Number(getParam("size") || 10)));

  // Map incoming category slug/alias to a Prisma where filter, mirroring /api/cards
  function normalizeRequestCategory(input: string) {
    const c = (input || "").toLowerCase();
    if (c === "anime collection") return "anime-collection";
    if (c === "star collection") return "star-collection";
    if (c === "car collection") return "car-collection";
    if (c === "anime") return "anime-collection";
    if (c === "star") return "star-collection";
    if (c === "car") return "car-collection";
    return c || "anime-collection";
  }
  // Build main category filter inline (no external function captures)
  const eff = normalizeRequestCategory(category || "anime-collection");
  const friendly =
    eff === "anime-collection"
      ? "Anime Collection"
      : eff === "star-collection"
      ? "Star Collection"
      : eff === "car-collection"
      ? "Car Collection"
      : eff;
  const short = eff.split("-")[0];
  const catWhereMain: Prisma.CardWhereInput | {} = category
    ? {
        OR: [
          { category: { equals: eff, mode: Prisma.QueryMode.insensitive } },
          { category: { equals: short, mode: Prisma.QueryMode.insensitive } },
          {
            category: { equals: friendly, mode: Prisma.QueryMode.insensitive },
          },
        ],
      }
    : {};

  const where: Prisma.CardWhereInput | undefined =
    q || category || rarity || purch || pub
      ? {
          AND: [
            q
              ? {
                  OR: [
                    {
                      name: { contains: q, mode: Prisma.QueryMode.insensitive },
                    },
                    {
                      cardTitle: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      series: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      character: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                  ],
                }
              : {},
            catWhereMain as any,
            rarity ? { rarity } : {},
            purch ? { isPurchasable: purch === "yes" } : {},
            pub ? { isPublic: pub === "yes" } : {},
          ],
        }
      : undefined;

  const [total, cards, categories, rarities, categoryTotal] = await Promise.all(
    [
      prisma.card.count({ where }),
      prisma.card.findMany({
        where,
        orderBy: [{ updatedAt: "desc" as const }, { id: "desc" as const }],
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      prisma.rarity.findMany({
        where: { isActive: true },
        select: { name: true, level: true },
        orderBy: { level: "asc" },
      }),
      prisma.card.count({ where: catWhereMain as any }),
    ]
  );

  const totalPages = Math.max(1, Math.ceil(total / size));

  function buildHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (rarity) params.set("rarity", rarity);
    if (purch) params.set("purch", purch);
    if (pub) params.set("pub", pub);
    params.set("page", String(nextPage));
    params.set("size", String(size));
    return `?${params.toString()}`;
  }

  // Build signed image URLs for secure proxying (thumbnail/preview)
  const signedThumb = (id: string) =>
    `/api/secure-image?cardId=${encodeURIComponent(
      id
    )}&type=thumbnail&token=${encodeURIComponent(
      generateImageToken(id, "thumbnail")
    )}`;
  const signedPreview = (id: string) =>
    `/api/secure-image?cardId=${encodeURIComponent(
      id
    )}&type=preview&token=${encodeURIComponent(
      generateImageToken(id, "preview")
    )}`;

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Shop — Cards Admin</h1>

      <UICard className="md:sticky md:top-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter cards and edit inline</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            className="grid sm:grid-cols-2 lg:grid-cols-8 gap-2"
          >
            <input
              name="q"
              placeholder="Search name, series, character"
              defaultValue={q}
              className="border rounded-md px-3 py-2"
            />
            <select
              name="category"
              defaultValue={category}
              className="border rounded-md px-3 py-2"
            >
              {categories.map((c) => (
                <option key={(c as any).slug} value={(c as any).slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              name="rarity"
              defaultValue={rarity}
              className="border rounded-md px-3 py-2"
            >
              <option value="">All rarities</option>
              {rarities.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              name="purch"
              defaultValue={purch}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Purchasable (any)</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <select
              name="pub"
              defaultValue={pub}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Public (any)</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <select
              name="size"
              defaultValue={String(size)}
              className="border rounded-md px-3 py-2"
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
            <input
              name="page"
              type="number"
              min={1}
              defaultValue={page}
              className="border rounded-md px-3 py-2"
            />
            <div className="sm:col-span-2 lg:col-span-8 flex justify-end">
              <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground">
                Apply
              </button>
            </div>
          </form>
        </CardContent>
      </UICard>

      <UICard className="bg-gradient-to-br from-emerald-50 to-teal-100">
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white shadow">
          <CardTitle className="text-base inline">Bulk image upload</CardTitle>
          <CardDescription>
            Upload one or more images into a required category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Server action passed to client for uploading */}
          <BulkUploadClient
            categories={categories as any}
            defaultCategory={"anime-collection"}
            onUpload={async (formData: FormData) => {
              "use server";
              try {
                const categorySlug = String(
                  formData.get("uploadCategory") || ""
                ).trim();
                const files = formData.getAll("images");
                const doAnalyze =
                  String(formData.get("analyzeAfter") || "") === "on";
                if (!categorySlug || !files || files.length === 0)
                  return { createdIds: [] };

                const cat = await prisma.category.findUnique({
                  where: { slug: categorySlug },
                  select: { slug: true, name: true },
                });
                const effectiveSlug = cat?.slug || categorySlug;

                const baseDir = path.join(
                  process.cwd(),
                  "public",
                  "uploads",
                  "categories",
                  effectiveSlug
                );
                const thumbsDir = path.join(baseDir, "thumbs");
                await fs.mkdir(baseDir, { recursive: true });
                await fs.mkdir(thumbsDir, { recursive: true });

                const safeName = (name: string) =>
                  name.replace(/[^a-zA-Z0-9_.-]/g, "_");
                const safeTitle = (input: string) => {
                  let s = String(input || "");
                  s = s.replace(/^\d{6,}[_-][0-9a-f]{4,}[_-]/i, "");
                  s = s.replace(/[_-]+/g, " ");
                  s = s
                    .split(/\s+/)
                    .filter((tok) => {
                      const t = tok.trim();
                      if (!t) return false;
                      if (/^\d{4,}$/i.test(t)) return false; // numbers 4+
                      if (/^[0-9a-f]{4,}$/i.test(t)) return false; // hex 4+
                      if (/^[0-9a-z]{8,}$/i.test(t)) return false; // mixed alnum blobs
                      if (/[0-9]/.test(t)) return false; // any digits
                      if (/^\d{8}$/.test(t)) return false; // yyyymmdd-like
                      if (/^\d{4}$/.test(t)) return false; // short stamp like 2110
                      if (/^[0-9a-f]{3,8}$/i.test(t)) return false; // uuid small chunks
                      return true;
                    })
                    .join(" ");
                  s = s
                    .replace(/[0-9a-z]{10,}/gi, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                  s = s.replace(/\b(Anime Collection)\s+\1\b/gi, "$1");
                  return s;
                };

                let activeRarities: Array<{
                  name: string;
                  slug: string;
                  level: number;
                  minDiamondPrice: number;
                  maxDiamondPrice: number;
                  dropRate?: number;
                }> = [];
                let activeElements: Array<{ name: string; slug: string }> = [];
                if (doAnalyze) {
                  try {
                    activeRarities = await prisma.rarity.findMany({
                      where: { isActive: true },
                      orderBy: { level: "asc" },
                      select: {
                        name: true,
                        slug: true,
                        level: true,
                        minDiamondPrice: true,
                        maxDiamondPrice: true,
                        dropRate: true,
                      },
                    });
                  } catch {}
                  try {
                    activeElements = await prisma.element.findMany({
                      where: { isActive: true },
                      orderBy: { sortOrder: "asc" },
                      select: { name: true, slug: true },
                    });
                  } catch {}
                }

                const pickRarity = () => {
                  if (!activeRarities.length)
                    return {
                      name: null as any,
                      slug: null as any,
                      minDiamondPrice: 50,
                      maxDiamondPrice: 150,
                    };
                  const weights = activeRarities.map((r) =>
                    Math.max(0.0001, (r as any).dropRate ?? 100)
                  );
                  const total = weights.reduce((a, b) => a + b, 0);
                  let roll = Math.random() * total;
                  for (let i = 0; i < activeRarities.length; i++) {
                    if ((roll -= weights[i]) <= 0)
                      return activeRarities[i] as any;
                  }
                  return activeRarities[activeRarities.length - 1] as any;
                };

                const randBetween = (min: number, max: number) =>
                  Math.floor(
                    min + Math.random() * (Math.max(max, min) - min + 1)
                  );

                const createdIds: string[] = [];
                const errors: Array<{ fileName: string; message: string }> = [];

                for (const f of files) {
                  if (!f || typeof f === "string") continue;
                  const file = f as unknown as File;
                  const arrayBuf = await file.arrayBuffer();
                  const buf = Buffer.from(arrayBuf);

                  const fileHash = crypto
                    .createHash("sha256")
                    .update(buf)
                    .digest("hex");
                  const existing = await prisma.card.findFirst({
                    where: { fileHash },
                  });
                  if (existing) {
                    errors.push({
                      fileName: file.name,
                      message: "Duplicate skipped",
                    });
                    continue;
                  }

                  let processed: Buffer;
                  try {
                    const sharp = (await import("sharp")).default;
                    const img = sharp(buf)
                      .flatten({ background: { r: 255, g: 255, b: 255 } })
                      .rotate();
                    const metadata = await img.metadata();
                    const w = metadata.width || 0;
                    const h = metadata.height || 0;
                    const maxW = 800;
                    const maxH = 1200;
                    const resized = img.resize({
                      width: w && w > maxW ? maxW : undefined,
                      height: h && h > maxH ? maxH : undefined,
                      fit: "inside",
                      withoutEnlargement: true,
                    });
                    processed = await resized
                      .jpeg({ quality: 84, mozjpeg: true })
                      .toBuffer();
                  } catch {
                    processed = buf;
                  }

                  let thumb: Buffer;
                  try {
                    const sharp = (await import("sharp")).default;
                    thumb = await sharp(processed)
                      .resize({
                        height: 300,
                        fit: "inside",
                        withoutEnlargement: true,
                      })
                      .jpeg({ quality: 80, mozjpeg: true })
                      .toBuffer();
                  } catch {
                    thumb = processed;
                  }

                  const stamp = Date.now();
                  const rand = crypto.randomBytes(6).toString("hex");
                  const base = safeName(
                    file.name || `img_${stamp}.jpg`
                  ).replace(/\.(png|jpeg|jpg|webp|gif|bmp|tiff)$/i, "");
                  const filename = `${stamp}_${rand}_${base}.jpg`;
                  const thumbFilename = `thumbs_${filename}`;

                  const outPath = path.join(baseDir, filename);
                  const thumbPath = path.join(thumbsDir, thumbFilename);
                  await fs.writeFile(outPath, processed);
                  await fs.writeFile(thumbPath, thumb);

                  const relBase = `/uploads/categories/${effectiveSlug}`;
                  const imageUrl = `${relBase}/${filename}`;
                  const thumbnailUrl = `${relBase}/thumbs/${thumbFilename}`;

                  const created = await prisma.card.create({
                    data: {
                      name: null,
                      series: null,
                      character: null,
                      diamondPrice: 0,
                      rarity: null as any,
                      category: effectiveSlug as any,
                      isPublic: true,
                      isPurchasable: true,
                      uploadDate: new Date(),
                      imageUrl,
                      thumbnailUrl,
                      maxOwners: null as any,
                      imagePath: outPath,
                      fileName: filename,
                      fileSize: processed.length,
                      fileHash,
                      imageHash: fileHash,
                    },
                  });
                  createdIds.push(created.id);

                  if (doAnalyze) {
                    const chosen = pickRarity();
                    const rarityName =
                      (chosen as any).name ?? (chosen as any).slug ?? null;
                    const priceMin = (chosen as any).minDiamondPrice ?? 50;
                    const priceMax = (chosen as any).maxDiamondPrice ?? 200;
                    const element = activeElements.length
                      ? activeElements[
                          Math.floor(Math.random() * activeElements.length)
                        ].slug
                      : null;
                    const baseTitle = safeTitle(
                      base.replace(/[_-]+/g, " ").trim()
                    );
                    const rawTitle = baseTitle
                      ? `${(cat?.name || effectiveSlug).replace(
                          /-/g,
                          " "
                        )} ${baseTitle}`
                      : cat?.name || effectiveSlug;
                    const title = safeTitle(rawTitle.replace(/-/g, " "));

                    await prisma.card.update({
                      where: { id: created.id },
                      data: {
                        name: title,
                        series:
                          cat?.name ||
                          effectiveSlug
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase()),
                        character: null,
                        rarity: rarityName as any,
                        cardTitle: title,
                        attackPower: randBetween(40, 120),
                        defense: randBetween(30, 110),
                        speed: randBetween(20, 100),
                        element: element as any,
                        rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
                        diamondPrice: randBetween(priceMin, priceMax),
                        isAnalyzed: true,
                        confidence: 75,
                        estimatedValue: randBetween(50, 500),
                      },
                    });
                  }
                }

                revalidatePath("/console/shop");
                revalidatePath("/shop");
                return { createdIds, errors } as {
                  createdIds: string[];
                  errors?: Array<{ fileName: string; message: string }>;
                };
              } catch (err: any) {
                console.error("[BulkUpload] Failed to process images:", err);
                return {
                  createdIds: [],
                  errors: [
                    {
                      fileName: "(all)",
                      message: err?.message || "Upload failed",
                    },
                  ],
                };
              }
            }}
          />
        </CardContent>
      </UICard>

      {/* Server-rendered bulk filtered actions (avoid client wrappers around form) */}
      <section className="rounded-lg border bg-gradient-to-br from-violet-50 to-purple-100 shadow">
        <div className="rounded-t-lg bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow px-4 py-3">
          <div className="text-base font-semibold">Bulk actions</div>
          <div className="opacity-90 text-sm">
            Apply to all filtered results
          </div>
        </div>
        <div className="space-y-3 p-3">
          <div className="text-sm text-muted-foreground">
            Apply an action to all filtered results below.
          </div>
          <form
            action={bulkFilteredAction}
            className="grid grid-cols-12 gap-2 items-end"
          >
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="rarity" value={rarity} />
            <input type="hidden" name="purch" value={purch} />
            <input type="hidden" name="pub" value={pub} />
            <input type="hidden" name="size" value={String(size)} />
            <input type="hidden" name="page" value={String(page)} />

            {/* Field + Value */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Change flags
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="field"
                  className="h-9 border rounded-md px-3 text-sm"
                >
                  <option value="isPurchasable">Set Purchasable</option>
                  <option value="isPublic">Set Public</option>
                </select>
                <select
                  name="value"
                  className="h-9 border rounded-md px-3 text-sm"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Rarity override (optional) */}
            <div className="col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Set rarity (optional)
              </div>
              <select
                name="setRarity"
                defaultValue=""
                className="h-9 w-full border rounded-md px-3 text-sm"
              >
                <option value="">(no change) Set rarity…</option>
                {rarities.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch size */}
            <div className="col-span-6 md:col-span-3 lg:col-span-2">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Batch size
              </div>
              <select
                id="clean_limit"
                name="clean_limit"
                defaultValue="500"
                className="h-9 w-full border rounded-md px-2 text-sm"
              >
                {[100, 200, 500, 1000, 2000].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 md:text-right">
                Content tools
              </div>
              <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                <Button type="submit" name="op" value="apply" className="h-9">
                  Apply to filtered
                </Button>
                <Button
                  type="submit"
                  name="op"
                  value="clean_titles"
                  variant="outline"
                  className="h-9 bg-blue-500/10 hover:bg-blue-500/20"
                >
                  Clean titles
                </Button>
                <Button
                  type="submit"
                  name="op"
                  value="title_from_character"
                  variant="outline"
                  className="h-9 bg-indigo-500/10 hover:bg-indigo-500/20"
                >
                  Title = Character
                </Button>
                <Button
                  type="submit"
                  name="op"
                  value="backfill_uploaddate"
                  variant="outline"
                  className="h-9 bg-emerald-500/10 hover:bg-emerald-500/20"
                >
                  Backfill uploadDate
                </Button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Server-rendered bulk selected actions placed outside client components */}
      <form
        id="bulkForm"
        action={bulkSelectedAction}
        className="z-0 rounded-md p-3 mt-3 mb-2 bg-gradient-to-r from-slate-50 to-gray-100 border"
      >
        <div className="grid grid-cols-12 gap-2 items-end text-sm text-foreground/90">
          <div className="col-span-12 sm:col-span-4 md:col-span-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Action
            </div>
            <select
              name="bulk_action"
              className="h-9 w-full border rounded px-3"
            >
              <option value="set_rarity">Set Rarity</option>
              <option value="set_public">Set Public</option>
              <option value="set_purch">Set Purchasable</option>
              <option value="title_from_character">Title = Character</option>
              <option value="delete">Delete</option>
            </select>
          </div>
          {/* Preserve current filters for redirect */}
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="purch" value={purch} />
          <input type="hidden" name="pub" value={pub} />
          <input type="hidden" name="size" value={String(size)} />
          <input type="hidden" name="page" value={String(page)} />
          <div className="col-span-12 sm:col-span-8 md:col-span-7">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Change attributes
            </div>
            <div className="grid grid-cols-12 gap-2">
              <select
                name="bulk_rarity"
                className="col-span-12 sm:col-span-6 md:col-span-6 h-9 border rounded px-3"
              >
                <option value="">(none)</option>
                {rarities.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
              <select
                name="bulk_public"
                className="col-span-6 sm:col-span-3 md:col-span-3 h-9 border rounded px-3"
              >
                <option value="">Public?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <select
                name="bulk_purch"
                className="col-span-6 sm:col-span-3 md:col-span-3 h-9 border rounded px-3"
              >
                <option value="">Purchasable?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-12 md:col-span-2 flex justify-end">
            <Button className="h-9" type="submit">
              Apply
            </Button>
          </div>
        </div>
      </form>

      <UICard className="bg-gradient-to-br from-rose-50 to-pink-100">
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white shadow">
          <CardTitle className="text-base">Cards ({categoryTotal})</CardTitle>
          <CardDescription>Edit properties inline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Reanalyze controls for failed/late analysis */}
          <div className="z-0 rounded-md p-2 mt-1 flex flex-col gap-2 text-xs bg-gradient-to-r from-rose-50/50 to-pink-50/50 border">
            <div className="text-muted-foreground">
              Run AI analysis again if previous attempt failed, or reanalyze all
              cards across all pages.
            </div>
            <div className="flex items-center justify-between gap-2">
              <ReanalyzeButtons
                visibleIds={cards.map((c) => c.id)}
                bulkFormId="bulkForm"
              />
              <ReanalyzeAllButton category={category} />
            </div>
          </div>
          {/* Bulk selection toolbar moved above; checkboxes below still use form="bulkForm" */}
          {cards.length === 0 && (
            <div className="text-sm text-muted-foreground">No cards found.</div>
          )}
          {cards.length > 0 && (
            <div className="overflow-auto border rounded-md">
              <table className="min-w-full table-fixed whitespace-nowrap text-[13px]">
                <thead className="sticky top-0 bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 text-white z-10 border-b border-rose-700/30 text-xs shadow-sm">
                  <tr>
                    <th className="w-8 px-2 py-1">
                      {/* Placeholder for select-all in future */}
                    </th>
                    <th className="text-left font-medium px-2 py-1 w-24">
                      Image
                    </th>
                    {/* Name and Series removed */}
                    <th className="text-left font-medium px-2 py-1">
                      Character
                    </th>
                    <th className="text-left font-medium px-2 py-1">Rarity</th>
                    <th className="text-left font-medium px-2 py-1">
                      Category
                    </th>
                    <th className="text-left font-medium px-2 py-1 w-24">
                      Price
                    </th>
                    <th className="text-left font-medium px-2 py-1 w-28">
                      Max owners
                    </th>
                    <th className="text-left font-medium px-2 py-1 w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b align-middle even:bg-gradient-to-r even:from-rose-50/30 even:to-pink-50/30 odd:bg-gradient-to-r odd:from-pink-50/50 odd:to-fuchsia-50/50 hover:bg-gradient-to-r hover:from-rose-100/60 hover:to-pink-100/60"
                    >
                      <td className="px-2 py-1">
                        <input
                          form="bulkForm"
                          type="checkbox"
                          name="ids"
                          value={c.id}
                        />
                      </td>
                      <td className="px-2 py-1">
                        {c.id ? (
                          <ImagePreview
                            src={signedPreview(c.id)}
                            thumbSrc={signedThumb(c.id)}
                            alt={c.name || c.cardTitle || "card"}
                            size={64}
                          />
                        ) : null}
                      </td>
                      {/* Name and Series cells removed */}
                      <td className="px-2 py-2">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            await prisma.card.update({
                              where: { id: c.id },
                              data: {
                                character: String(
                                  formData.get("character") || ""
                                ).trim(),
                              },
                            });
                          }}
                        >
                          <input
                            name="character"
                            defaultValue={c.character || ""}
                            className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs"
                          />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const rarity = String(
                              formData.get("rarity") || c.rarity || ""
                            ).trim();
                            let diamondPrice = c.diamondPrice ?? 0;
                            if (rarity) {
                              const r = await prisma.rarity.findUnique({
                                where: { name: rarity },
                              });
                              if (r)
                                diamondPrice = Math.max(
                                  r.minDiamondPrice,
                                  Math.min(r.maxDiamondPrice, diamondPrice)
                                );
                            }
                            await prisma.card.update({
                              where: { id: c.id },
                              data: { rarity, diamondPrice },
                            });
                          }}
                        >
                          <select
                            name="rarity"
                            defaultValue={c.rarity || ""}
                            className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs"
                          >
                            <option value="">(none)</option>
                            {rarities.map((r) => (
                              <option key={r.name} value={r.name}>
                                {r.name}
                              </option>
                            ))}
                            {/* Ensure existing value is selectable even if inactive */}
                            {c.rarity &&
                              !rarities.some((r) => r.name === c.rarity) && (
                                <option value={c.rarity}>{c.rarity}</option>
                              )}
                          </select>
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-block px-2 py-1 rounded bg-muted text-[11px] text-muted-foreground">
                          {c.category || "(none)"}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            let diamondPrice = Number(
                              formData.get("diamondPrice") ||
                                c.diamondPrice ||
                                0
                            );
                            const rarity = c.rarity || "";
                            if (rarity) {
                              const r = await prisma.rarity.findUnique({
                                where: { name: rarity },
                              });
                              if (r)
                                diamondPrice = Math.max(
                                  r.minDiamondPrice,
                                  Math.min(r.maxDiamondPrice, diamondPrice)
                                );
                            }
                            await prisma.card.update({
                              where: { id: c.id },
                              data: { diamondPrice },
                            });
                          }}
                        >
                          <input
                            name="diamondPrice"
                            type="number"
                            defaultValue={c.diamondPrice ?? 100}
                            className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs"
                          />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const mv = formData.get("maxOwners");
                            await prisma.card.update({
                              where: { id: c.id },
                              data: {
                                maxOwners:
                                  mv === null || String(mv).trim() === ""
                                    ? null
                                    : Number(mv),
                              },
                            });
                          }}
                        >
                          <input
                            name="maxOwners"
                            type="number"
                            defaultValue={c.maxOwners ?? ""}
                            className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs"
                          />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <ConfirmDeleteButton
                          action={async () => {
                            "use server";
                            try {
                              const card = await prisma.card.findUnique({
                                where: { id: c.id },
                                select: {
                                  id: true,
                                  imagePath: true,
                                  thumbnailUrl: true,
                                  imageUrl: true,
                                },
                              });
                              if (card) {
                                const absImg =
                                  toAbsolutePath((card as any).imagePath) ||
                                  toAbsolutePath((card as any).imageUrl);
                                const absThumb = deriveThumbAbs(
                                  (card as any).imagePath,
                                  (card as any).thumbnailUrl
                                );
                                await Promise.all([
                                  safeUnlink(absThumb),
                                  safeUnlink(absImg),
                                ]);
                              }
                            } catch {}
                            await prisma.card.delete({ where: { id: c.id } });
                            revalidatePath("/console/shop");
                            revalidatePath("/shop");
                          }}
                          title="Delete card"
                          description="This will permanently delete the card."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages} • {total} total
            </div>
            <div className="flex items-center gap-2">
              <a
                aria-disabled={page <= 1}
                className={`px-3 py-1 rounded border text-sm ${
                  page <= 1 ? "pointer-events-none opacity-50" : ""
                }`}
                href={buildHref(Math.max(1, page - 1))}
              >
                Prev
              </a>
              <a
                aria-disabled={page >= totalPages}
                className={`px-3 py-1 rounded border text-sm ${
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }`}
                href={buildHref(Math.min(totalPages, page + 1))}
              >
                Next
              </a>
            </div>
          </div>
        </CardContent>
      </UICard>
    </div>
  );
}

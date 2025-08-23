import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import ImagePreview from "@/components/ImagePreview";
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Prisma } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type BadgeTone = "muted" | "success" | "warning";
function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: BadgeTone }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  const tones: Record<BadgeTone, string> = {
    muted: "bg-muted text-muted-foreground",
    success: "bg-green-600/90 text-white",
    warning: "bg-amber-500/90 text-white",
  };
  return <span className={`${base} ${tones[tone]}`}>{children}</span>;
}

export default async function ShopPage({ searchParams }: { searchParams?: any }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return null;
  const sp = await searchParams;
  const getParam = (key: string) => {
    const v = sp?.[key] ?? (typeof sp?.get === "function" ? sp.get(key) : undefined);
    return typeof v === "string" ? v : "";
  };
  const q = getParam("q").trim();
  const category = getParam("category").trim();
  const rarity = getParam("rarity").trim();
  const purch = getParam("purch"); // yes/no
  const pub = getParam("pub"); // yes/no
  const page = Math.max(1, Number(getParam("page") || 1));
  const size = Math.min(100, Math.max(5, Number(getParam("size") || 10)));

  const where: Prisma.CardWhereInput | undefined = (q || category || rarity || purch || pub)
    ? {
        AND: [
          q
            ? {
                OR: [
                  { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  { cardTitle: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  { series: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  { character: { contains: q, mode: Prisma.QueryMode.insensitive } },
                ],
              }
            : {},
          category ? { category } : {},
          rarity ? { rarity } : {},
          purch ? { isPurchasable: purch === "yes" } : {},
          pub ? { isPublic: pub === "yes" } : {},
        ],
      }
    : undefined;

  const [total, cards, categories, rarities] = await Promise.all([
    prisma.card.count({ where }),
    prisma.card.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * size, take: size }),
    prisma.category.findMany({ where: { isActive: true }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.rarity.findMany({ where: { isActive: true }, select: { name: true, level: true }, orderBy: { level: "asc" } }),
  ]);

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

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Shop — Cards Admin</h1>

      <UICard className="md:sticky md:top-16">
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white shadow">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter cards and edit inline</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="get" className="grid sm:grid-cols-2 lg:grid-cols-8 gap-2">
            <input name="q" placeholder="Search name, series, character" defaultValue={q} className="border rounded-md px-3 py-2" />
            <select name="category" defaultValue={category} className="border rounded-md px-3 py-2">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="rarity" defaultValue={rarity} className="border rounded-md px-3 py-2">
              <option value="">All rarities</option>
              {rarities.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
            <select name="purch" defaultValue={purch} className="border rounded-md px-3 py-2">
              <option value="">Purchasable (any)</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <select name="pub" defaultValue={pub} className="border rounded-md px-3 py-2">
              <option value="">Public (any)</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <select name="size" defaultValue={String(size)} className="border rounded-md px-3 py-2">
              {[10,20,30,50,100].map((n) => (
                <option key={n} value={n}>{n}/page</option>
              ))}
            </select>
            <input name="page" type="number" min={1} defaultValue={page} className="border rounded-md px-3 py-2" />
            <div className="sm:col-span-2 lg:col-span-8 flex justify-end">
              <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground">Apply</button>
            </div>
          </form>
        </CardContent>
      </UICard>

      <UICard>
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white shadow">
          <details>
            <summary className="cursor-pointer list-none">
              <CardTitle className="text-base inline">Bulk image upload</CardTitle>
              <span className="ml-2 align-middle text-xs text-muted-foreground">(click to expand)</span>
              <CardDescription>Upload one or more images and choose a category. Other fields are set automatically.</CardDescription>
            </summary>
          </details>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              "use server";
              const categoryName = String(formData.get("category") || "").trim();
              const files = formData.getAll("images");
              if (!files || files.length === 0) return;

              // Resolve category slug for directory structure
              const cat = categoryName
                ? await prisma.category.findUnique({ where: { name: categoryName }, select: { slug: true, name: true } })
                : null;
              const categorySlug = cat?.slug || (categoryName ? categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "uncategorized");

              // Base directories
              const baseDir = path.join(process.cwd(), "public", "uploads", "categories", categorySlug);
              const thumbsDir = path.join(baseDir, "thumbs");
              await fs.mkdir(baseDir, { recursive: true });
              await fs.mkdir(thumbsDir, { recursive: true });

              const safeName = (name: string) => name.replace(/[^a-zA-Z0-9_.-]/g, "_");

              for (const f of files) {
                if (!f || typeof f === "string") continue;
                const file = f as unknown as File;
                const arrayBuf = await file.arrayBuffer();
                const buf = Buffer.from(arrayBuf);

                // Duplicate detection by file hash
                const fileHash = crypto.createHash("sha256").update(buf).digest("hex");
                const existing = await prisma.card.findFirst({ where: { fileHash } });
                if (existing) {
                  // Skip duplicates silently for now
                  continue;
                }

                // Process image with sharp: normalize, resize, convert to JPEG
                let processed: Buffer;
                try {
                  const img = sharp(buf).flatten({ background: { r: 255, g: 255, b: 255 } }).rotate();
                  const metadata = await img.metadata();
                  const w = metadata.width || 0;
                  const h = metadata.height || 0;
                  const maxW = 800;
                  const maxH = 1200;
                  const resized = img.resize({ width: w && w > maxW ? maxW : undefined, height: h && h > maxH ? maxH : undefined, fit: "inside", withoutEnlargement: true });
                  processed = await resized.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
                } catch {
                  // If sharp fails, fallback to original buffer
                  processed = buf;
                }

                // Thumbnail (height 300px, keep aspect)
                let thumb: Buffer;
                try {
                  thumb = await sharp(processed).resize({ height: 300, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
                } catch {
                  thumb = processed;
                }

                const stamp = Date.now();
                const rand = crypto.randomBytes(6).toString("hex");
                const base = safeName(file.name || `img_${stamp}.jpg`).replace(/\.(png|jpeg|jpg|webp|gif|bmp|tiff)$/i, "");
                const filename = `${stamp}_${rand}_${base}.jpg`;

                const outPath = path.join(baseDir, filename);
                const thumbPath = path.join(thumbsDir, filename);
                await fs.writeFile(outPath, processed);
                await fs.writeFile(thumbPath, thumb);

                const relBase = `/uploads/categories/${categorySlug}`;
                const imageUrl = `${relBase}/${filename}`;
                const thumbnailUrl = `${relBase}/thumbs/${filename}`;

                await prisma.card.create({
                  data: {
                    name: null,
                    series: null,
                    character: null,
                    diamondPrice: 0,
                    rarity: null as any,
                    category: (cat?.name || categoryName || null) as any,
                    isPublic: true,
                    isPurchasable: true,
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
              }
            }}
            className="grid gap-3"
          >
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Select images</label>
                <input name="images" type="file" accept="image/*" multiple className="block" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Category</label>
                <select name="category" className="border rounded-md px-2 py-1">
                  <option value="">(none)</option>
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <button className="px-3 py-2 rounded-md border">Import</button>
              </div>
            </div>
          </form>
        </CardContent>
      </UICard>


      <UICard>
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white shadow">
          <CardTitle className="text-base">Bulk actions</CardTitle>
          <CardDescription>Apply to all filtered results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">Show bulk actions</summary>
          <form
            action={async (formData: FormData) => {
              "use server";
              const q = String(formData.get("q") || "").trim();
              const category = String(formData.get("category") || "").trim();
              const rarity = String(formData.get("rarity") || "").trim();
              const purch = String(formData.get("purch") || "");
              const pub = String(formData.get("pub") || "");
              const field = String(formData.get("field") || "");
              const value = String(formData.get("value") || "");
              const setRarity = String(formData.get("setRarity") || "").trim();
              const setCategory = String(formData.get("setCategory") || "").trim();

              const where: Prisma.CardWhereInput | undefined = (q || category || rarity || purch || pub)
                ? {
                    AND: [
                      q
                        ? {
                            OR: [
                              { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { cardTitle: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { series: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { character: { contains: q, mode: Prisma.QueryMode.insensitive } },
                            ],
                          }
                        : {},
                      category ? { category } : {},
                      rarity ? { rarity } : {},
                      purch ? { isPurchasable: purch === "yes" } : {},
                      pub ? { isPublic: pub === "yes" } : {},
                    ],
                  }
                : undefined;

              if (field === "isPurchasable") {
                await prisma.card.updateMany({ where, data: { isPurchasable: value === "yes" } });
              } else if (field === "isPublic") {
                await prisma.card.updateMany({ where, data: { isPublic: value === "yes" } });
              }

              if (setRarity) {
                await prisma.card.updateMany({ where, data: { rarity: setRarity } });
              }
              if (setCategory) {
                await prisma.card.updateMany({ where, data: { category: setCategory } });
              }
            }}
            className="grid sm:grid-cols-2 lg:grid-cols-6 gap-2"
          >
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="rarity" value={rarity} />
            <input type="hidden" name="purch" value={purch} />
            <input type="hidden" name="pub" value={pub} />

            <div className="flex gap-2">
              <select name="field" className="border rounded-md px-3 py-2">
                <option value="isPurchasable">Set Purchasable</option>
                <option value="isPublic">Set Public</option>
              </select>
              <select name="value" className="border rounded-md px-3 py-2">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <select name="setRarity" defaultValue="" className="border rounded-md px-3 py-2">
              <option value="">(no change) Set rarity…</option>
              {rarities.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            <select name="setCategory" defaultValue="" className="border rounded-md px-3 py-2">
              <option value="">(no change) Set category…</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="sm:col-span-2 lg:col-span-6">
              <button className="px-3 py-2 rounded-md border">Apply to filtered</button>
            </div>
          </form>
          </details>
        </CardContent>
      </UICard>

      <UICard>
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white shadow">
          <CardTitle className="text-base">Cards ({cards.length})</CardTitle>
          <CardDescription>Edit properties inline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Bulk selection toolbar */}
          <details className="mb-1">
            <summary className="list-none cursor-pointer text-xs text-muted-foreground/80 hover:text-foreground/80 px-1 py-1 inline-flex items-center gap-2 select-none">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span>Bulk actions</span>
            </summary>
            <form
              id="bulkForm"
              action={async (formData: FormData) => {
                "use server";
                const ids = formData.getAll("ids").map(String).filter(Boolean);
                const action = String(formData.get("bulk_action") || "");
                const rarity = String(formData.get("bulk_rarity") || "").trim();
                const category = String(formData.get("bulk_category") || "").trim();
                const publicVal = String(formData.get("bulk_public") || ""); // yes/no/""
                const purchVal = String(formData.get("bulk_purch") || ""); // yes/no/""
                if (ids.length === 0) return;
                const where = { id: { in: ids } } as any;
                switch (action) {
                  case "delete":
                    await prisma.card.deleteMany({ where });
                    break;
                  case "set_public":
                    if (publicVal === "yes" || publicVal === "no") {
                      await prisma.card.updateMany({ where, data: { isPublic: publicVal === "yes" } });
                    }
                    break;
                  case "set_purch":
                    if (purchVal === "yes" || purchVal === "no") {
                      await prisma.card.updateMany({ where, data: { isPurchasable: purchVal === "yes" } });
                    }
                    break;
                  case "set_category":
                    if (category) await prisma.card.updateMany({ where, data: { category } });
                    break;
                  case "set_rarity":
                    if (rarity) {
                      // Clamp prices to new rarity bounds if price exists
                      const r = await prisma.rarity.findUnique({ where: { name: rarity } });
                      if (r) {
                        // Update rarity first
                        await prisma.card.updateMany({ where, data: { rarity } });
                        // Best-effort clamp by fetching and updating in small batches
                        const affected = await prisma.card.findMany({ where, select: { id: true, diamondPrice: true } });
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
                                      : Math.max(r.minDiamondPrice, Math.min(r.maxDiamondPrice, x.diamondPrice || 0)),
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
                  default:
                    break;
                }
              }}
              className="z-0 rounded-md p-2 mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-background/60 border"
            >
              <select name="bulk_action" className="border rounded px-2 h-8">
                <option value="set_category">Set Category</option>
                <option value="set_rarity">Set Rarity</option>
                <option value="set_public">Set Public</option>
                <option value="set_purch">Set Purchasable</option>
                <option value="delete">Delete</option>
              </select>
              <select name="bulk_category" className="border rounded px-2 h-8">
                <option value="">(none)</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <select name="bulk_rarity" className="border rounded px-2 h-8">
                <option value="">(none)</option>
                {rarities.map((r) => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
              <select name="bulk_public" className="border rounded px-2 h-8">
                <option value="">Public?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <select name="bulk_purch" className="border rounded px-2 h-8">
                <option value="">Purchasable?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <button className="px-3 h-8 rounded border text-xs text-foreground/80 hover:bg-muted" type="submit">Apply</button>
            </form>
          </details>
          {cards.length === 0 && <div className="text-sm text-muted-foreground">No cards found.</div>}
          {cards.length > 0 && (
            <div className="overflow-auto border rounded-md">
              <table className="min-w-full table-fixed whitespace-nowrap text-[13px]">
                <thead className="sticky top-0 bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white z-10 border-b border-sky-700/30 text-xs shadow-sm">
                  <tr>
                    <th className="w-8 px-2 py-1">
                      {/* Placeholder for select-all in future */}
                    </th>
                    <th className="text-left font-medium px-2 py-1 w-24">Image</th>
                    <th className="text-left font-medium px-2 py-1">Name</th>
                    <th className="text-left font-medium px-2 py-1">Series</th>
                    <th className="text-left font-medium px-2 py-1">Character</th>
                    <th className="text-left font-medium px-2 py-1">Rarity</th>
                    <th className="text-left font-medium px-2 py-1">Category</th>
                    <th className="text-left font-medium px-2 py-1 w-24">Price</th>
                    <th className="text-left font-medium px-2 py-1 w-28">Max owners</th>
                    <th className="text-left font-medium px-2 py-1 w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c) => (
                    <tr key={c.id} className="border-b align-middle even:bg-muted/40 hover:bg-muted/60">
                      <td className="px-2 py-1">
                        <input form="bulkForm" type="checkbox" name="ids" value={c.id} />
                      </td>
                      <td className="px-2 py-1">
                        {c.thumbnailUrl || c.imageUrl ? (
                          <ImagePreview
                            src={(c.imageUrl || c.thumbnailUrl) as string}
                            thumbSrc={(c.thumbnailUrl || c.imageUrl) as string}
                            alt={c.name || c.cardTitle || "card"}
                            size={64}
                          />
                        ) : null}
                      </td>
                      <td className="px-2 py-1">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const name = String(formData.get("name") || c.name || "").trim();
                            const series = String(formData.get("series") || c.series || "").trim();
                            const character = String(formData.get("character") || c.character || "").trim();
                            let diamondPrice = Number(formData.get("diamondPrice") || c.diamondPrice || 0);
                            const rarity = String(formData.get("rarity") || c.rarity || "").trim();
                            const category = String(formData.get("category") || c.category || "").trim();
                            const maxOwners = formData.get("maxOwners");
                            const maxOwnersVal = maxOwners === null || String(maxOwners).trim() === "" ? null : Number(maxOwners);

                            if (rarity) {
                              const r = await prisma.rarity.findUnique({ where: { name: rarity } });
                              if (r) {
                                diamondPrice = Math.max(r.minDiamondPrice, Math.min(r.maxDiamondPrice, diamondPrice));
                              }
                            }
                            await prisma.card.update({
                              where: { id: c.id },
                              data: { name, series, character, diamondPrice, rarity, category, maxOwners: maxOwnersVal as any },
                            });
                          }}
                        >
                          <input name="name" defaultValue={c.name || ""} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs" />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form action={async (formData: FormData) => {"use server"; await prisma.card.update({ where: { id: c.id }, data: { series: String(formData.get("series") || "").trim() } });}}>
                          <input name="series" defaultValue={c.series || ""} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs" />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form action={async (formData: FormData) => {"use server"; await prisma.card.update({ where: { id: c.id }, data: { character: String(formData.get("character") || "").trim() } });}}>
                          <input name="character" defaultValue={c.character || ""} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs" />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const rarity = String(formData.get("rarity") || c.rarity || "").trim();
                            let diamondPrice = c.diamondPrice ?? 0;
                            if (rarity) {
                              const r = await prisma.rarity.findUnique({ where: { name: rarity } });
                              if (r) diamondPrice = Math.max(r.minDiamondPrice, Math.min(r.maxDiamondPrice, diamondPrice));
                            }
                            await prisma.card.update({ where: { id: c.id }, data: { rarity, diamondPrice } });
                          }}
                        >
                          <select name="rarity" defaultValue={c.rarity || ""} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs">
                            <option value="">(none)</option>
                            {rarities.map((r) => (
                              <option key={r.name} value={r.name}>{r.name}</option>
                            ))}
                          </select>
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form action={async (formData: FormData) => {"use server"; await prisma.card.update({ where: { id: c.id }, data: { category: String(formData.get("category") || "").trim() } });}}>
                          <select name="category" defaultValue={c.category || ""} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs">
                            <option value="">(none)</option>
                            {categories.map((cat) => (
                              <option key={cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            let diamondPrice = Number(formData.get("diamondPrice") || c.diamondPrice || 0);
                            const rarity = c.rarity || "";
                            if (rarity) {
                              const r = await prisma.rarity.findUnique({ where: { name: rarity } });
                              if (r) diamondPrice = Math.max(r.minDiamondPrice, Math.min(r.maxDiamondPrice, diamondPrice));
                            }
                            await prisma.card.update({ where: { id: c.id }, data: { diamondPrice } });
                          }}
                        >
                          <input name="diamondPrice" type="number" defaultValue={c.diamondPrice ?? 100} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs" />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <form action={async (formData: FormData) => {"use server"; const mv=formData.get("maxOwners"); await prisma.card.update({ where: { id: c.id }, data: { maxOwners: mv===null||String(mv).trim()===""? null : Number(mv) } });}}>
                          <input name="maxOwners" type="number" defaultValue={c.maxOwners ?? ""} className="w-full h-8 px-2 rounded border border-border bg-background/60 text-xs" />
                        </form>
                      </td>
                      <td className="px-2 py-2">
                        <ConfirmDeleteButton
                          action={async () => {"use server"; await prisma.card.delete({ where: { id: c.id } });}}
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
            <div className="text-xs text-muted-foreground">Page {page} of {totalPages} • {total} total</div>
            <div className="flex items-center gap-2">
              <a aria-disabled={page <= 1} className={`px-3 py-1 rounded border text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={buildHref(Math.max(1, page - 1))}>Prev</a>
              <a aria-disabled={page >= totalPages} className={`px-3 py-1 rounded border text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={buildHref(Math.min(totalPages, page + 1))}>Next</a>
            </div>
          </div>
        </CardContent>
      </UICard>
    </div>
  );
}

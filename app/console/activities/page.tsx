import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import TypeGroupSelect from "@/components/console/TypeGroupSelect";
import ActivityTypeEditor from "@/components/console/ActivityTypeEditor";
import BulkTypeUpdate from "@/components/console/BulkTypeUpdate";
import AdvancedTypeFilter from "@/components/console/AdvancedTypeFilter";

// Aktivite tipine göre renk belirleyen fonksiyon
function getTypeColor(type: string | null | undefined): string {
  const typeStr = String(type || "").toLowerCase();
  if (typeStr.includes("quiz")) return "bg-amber-100 text-amber-800";
  if (typeStr.includes("interactive") || typeStr.includes("interactive_demo")) return "bg-blue-100 text-blue-800";
  if (typeStr.includes("theory_interactive")) return "bg-purple-100 text-purple-800";
  if (typeStr.includes("matching")) return "bg-purple-100 text-purple-800";
  if (typeStr.includes("memory") || typeStr.includes("memory_game")) return "bg-pink-100 text-pink-800";
  if (typeStr.includes("drag") || typeStr.includes("drag_drop")) return "bg-orange-100 text-orange-800";
  if (typeStr.includes("code") || typeStr.includes("coding")) return "bg-green-100 text-green-800";
  if (typeStr.includes("algorithm")) return "bg-red-100 text-red-800";
  if (typeStr.includes("data") || typeStr.includes("exploration")) return "bg-teal-100 text-teal-800";
  if (typeStr.includes("lesson")) return "bg-slate-100 text-slate-800";
  return "bg-gray-100 text-gray-800";
}

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({ searchParams }: { searchParams: any }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return null;

  const sp = await searchParams;
  const q = ((sp?.q ?? (typeof sp?.get === "function" ? sp.get("q") : "")) || "").trim();
  const category = ((sp?.category ?? (typeof sp?.get === "function" ? sp.get("category") : "")) || "").trim();
  const typeGroup = String(sp?.typeGroup ?? (typeof sp?.get === "function" ? sp.get("typeGroup") : "")).trim().toLowerCase();
  const activityType = ((sp?.activityType ?? (typeof sp?.get === "function" ? sp.get("activityType") : "")) || "").trim();
  const sizeRaw = Number(sp?.size ?? (typeof sp?.get === "function" ? sp.get("size") : 20));
  const pageRaw = Number(sp?.page ?? (typeof sp?.get === "function" ? sp.get("page") : 1));
  const sort = String(sp?.sort ?? (typeof sp?.get === "function" ? sp.get("sort") : "updatedAt")).trim();
  const dirRaw = String(sp?.dir ?? (typeof sp?.get === "function" ? sp.get("dir") : "desc")).trim().toLowerCase();
  const size = Math.min(100, Math.max(5, Number.isFinite(sizeRaw) && sizeRaw ? sizeRaw : 20));
  const page = Math.max(1, Number.isFinite(pageRaw) && pageRaw ? pageRaw : 1);
  const dir: "asc" | "desc" = dirRaw === "asc" ? "asc" : "desc";
  const allowedSorts = new Set(["updatedAt", "difficulty", "experienceReward", "diamondReward", "title"]);
  const sortKey = allowedSorts.has(sort) ? sort : "updatedAt";

  // Build activity type group filter
  let typeWhere: Prisma.LearningActivityWhereInput | {} = {};
  switch (typeGroup) {
    case "games":
      typeWhere = {
        OR: [
          { activityType: { contains: "game", mode: Prisma.QueryMode.insensitive } },
          { activityType: { in: ["matching", "memory_game", "drag_drop"], mode: Prisma.QueryMode.default as any } },
        ],
      } as any;
      break;
    case "lessons":
      typeWhere = { activityType: { contains: "lesson", mode: Prisma.QueryMode.insensitive } };
      break;
    case "challenges":
      typeWhere = {
        OR: [
          { activityType: { contains: "challenge", mode: Prisma.QueryMode.insensitive } },
          { activityType: { in: ["quiz"], mode: Prisma.QueryMode.default as any } },
        ],
      } as any;
      break;
    case "learning":
      typeWhere = { activityType: { in: ["interactive_demo", "coding_lab", "code_builder", "data_exploration", "algorithm_visualization"] } } as any;
      break;
    default:
      typeWhere = {};
  }

  // Aktivite tipi filtresi
  const activityTypeWhere = activityType ? { activityType: { equals: activityType } } : {};

  const where: Prisma.LearningActivityWhereInput | undefined = (q || category || typeGroup || activityType)
    ? {
        AND: [
          q
            ? {
                OR: [
                  { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  { category: { contains: q, mode: Prisma.QueryMode.insensitive } },
                ],
              }
            : {},
          category ? { category } : {},
          typeWhere as any,
          activityTypeWhere,
        ],
      }
    : undefined;

  const [total, activities, categories] = await Promise.all([
    prisma.learningActivity.count({ where }),
    prisma.learningActivity.findMany({
      where,
      orderBy: { [sortKey]: dir } as any,
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.learningActivity.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Activities</h1>
      <form method="get" className="mb-4 flex flex-wrap gap-3 items-center">
        <input
          name="q"
          placeholder="Search by title or category"
          defaultValue={q}
          className="border border-border rounded-md px-3 py-2 w-full"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <select name="category" defaultValue={category} className="border border-border rounded-md px-3 py-2">
            <option value="">Tüm kategoriler</option>
            {categories.map((c) => (
              <option key={c.category} value={c.category || ""}>
                {c.category}
              </option>
            ))}
          </select>
          
          {/* Genel tip grubu seçimi */}
          <div className="flex items-center gap-2">
            <TypeGroupSelect
              value={typeGroup}
              q={q}
              category={category}
              size={size}
              sortKey={sortKey}
              dir={dir}
            />
            <noscript>
              <select name="typeGroup" defaultValue={typeGroup} className="border border-border rounded-md px-3 py-2">
                <option value="">Tüm gruplar</option>
                <option value="games">Oyunlar</option>
                <option value="learning">Öğrenme Aktiviteleri</option>
                <option value="lessons">Dersler</option>
                <option value="challenges">Meydan Okumalar</option>
              </select>
            </noscript>
          </div>
          
          {/* Detaylı aktivite tipi seçimi */}
          <AdvancedTypeFilter value={activityType} />
        </div>
        
        <input type="hidden" name="size" value={String(size)} />
        <input type="hidden" name="sort" value={sortKey} />
        <input type="hidden" name="dir" value={dir} />
        <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Ara</button>
      </form>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <BulkDifficultyForm q={q} category={category} />
        <BulkTypeUpdate q={q} category={category} typeGroup={typeGroup} />
      </div>
      {/* Table view */}
      <div className="overflow-x-auto border rounded-md shadow-md">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-primary/80 to-primary/60 text-white">
            <tr>
              <th className="text-left px-3 py-3 w-[32px] font-semibold">#</th>
              <th className="text-left px-3 py-3 font-semibold">
                <a href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&size=${size}&page=1&sort=title&dir=${sortKey==='title' && dir==='asc' ? 'desc' : 'asc'}`}
                  className="inline-flex items-center gap-1 hover:underline text-white">
                  Başlık {sortKey==='title' ? (dir==='asc' ? '▲' : '▼') : ''}
                </a>
              </th>
              <th className="text-left px-3 py-3 font-semibold">Tip</th>
              <th className="text-left px-3 py-3 font-semibold">
                <a href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&size=${size}&page=1&sort=difficulty&dir=${sortKey==='difficulty' && dir==='asc' ? 'desc' : 'asc'}`}
                  className="inline-flex items-center gap-1 hover:underline text-white">
                  Zorluk {sortKey==='difficulty' ? (dir==='asc' ? '▲' : '▼') : ''}
                </a>
              </th>
              <th className="text-left px-3 py-3 font-semibold">
                <a href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&size=${size}&page=1&sort=experienceReward&dir=${sortKey==='experienceReward' && dir==='asc' ? 'desc' : 'asc'}`}
                  className="inline-flex items-center gap-1 hover:underline text-white">
                  XP {sortKey==='experienceReward' ? (dir==='asc' ? '▲' : '▼') : ''}
                </a>
              </th>
              <th className="text-left px-3 py-3 font-semibold">
                <a href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&size=${size}&page=1&sort=diamondReward&dir=${sortKey==='diamondReward' && dir==='asc' ? 'desc' : 'asc'}`}
                  className="inline-flex items-center gap-1 hover:underline text-white">
                  Elmas {sortKey==='diamondReward' ? (dir==='asc' ? '▲' : '▼') : ''}
                </a>
              </th>
              <th className="text-left px-3 py-3 font-semibold">Durum</th>
              <th className="text-right px-3 py-3 font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, idx) => (
              <tr key={a.id} className={`border-t ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                <td className="px-3 py-3 align-top text-muted-foreground">{(page - 1) * size + idx + 1}</td>
                <td className="px-3 py-3 align-top">
                  <div className="font-medium truncate max-w-[320px] mb-1">{a.title}</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                      {a.category}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getTypeColor(a.activityType)}`}>
                    {a.activityType}
                  </span>
                </td>
                <td className="px-3 py-3 align-top">{a.difficulty}</td>
                <td className="px-3 py-3 align-top">{typeof a.experienceReward === 'number' ? a.experienceReward : '-'}</td>
                <td className="px-3 py-3 align-top">{typeof a.diamondReward === 'number' ? a.diamondReward : '-'}</td>
                <td className="px-3 py-3 align-top">
                  <span className={`text-xs px-2 py-1 rounded-full ${a.isActive ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}>{a.isActive ? 'Aktif' : 'Pasif'}</span>
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <ActivityTypeEditor 
                      id={a.id} 
                      title={a.title} 
                      currentType={a.activityType || ""}
                    />
                    <form
                      action={async () => {
                        "use server";
                        await prisma.learningActivity.update({ where: { id: a.id }, data: { isActive: !a.isActive } });
                      }}
                    >
                      <button className="h-8 px-2 rounded border text-xs hover:bg-gray-100" type="submit">{a.isActive ? 'Pasif Yap' : 'Aktif Yap'}</button>
                    </form>
                    <ConfirmDeleteButton
                      action={async () => {
                        "use server";
                        await prisma.learningActivity.delete({ where: { id: a.id } });
                      }}
                      title="Delete activity"
                      description={`Are you sure you want to delete "${a.title}"? This cannot be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={8}>Aktivite bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-muted-foreground">Sayfa {page} / {totalPages} • Toplam {total} aktivite</div>
        <div className="flex items-center gap-2">
          <a
            className={`h-9 px-3 rounded border ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&activityType=${encodeURIComponent(activityType)}&size=${size}&sort=${encodeURIComponent(sortKey)}&dir=${encodeURIComponent(dir)}&page=${Math.max(1, page-1)}`}
          >
            Önceki
          </a>
          <a
            className={`h-9 px-3 rounded border ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&activityType=${encodeURIComponent(activityType)}&size=${size}&sort=${encodeURIComponent(sortKey)}&dir=${encodeURIComponent(dir)}&page=${Math.min(totalPages, page+1)}`}
          >
            Sonraki
          </a>
        </div>
      </div>
    </div>
  );
}

async function BulkDifficultyForm({ q, category }: { q: string; category: string }) {
  async function bulkUpdate(formData: FormData) {
    "use server";
    const newDiff = Number(formData.get("newDifficulty") || 1);
    const where: Prisma.LearningActivityWhereInput | undefined = (q || category)
      ? {
          AND: [
            q
              ? {
                  OR: [
                    { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                    { category: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  ],
                }
              : {},
            category ? { category } : {},
          ],
        }
      : undefined;
    await prisma.learningActivity.updateMany({ where, data: { difficulty: newDiff } });
  }
  return (
    <form action={bulkUpdate} className="p-3 border rounded-md bg-muted/20 flex items-center gap-2 flex-1">
      <div className="text-sm">Bulk difficulty</div>
      <input name="newDifficulty" type="number" min={1} max={10} defaultValue={1} className="border rounded-md px-3 py-2 w-28" />
      <button className="px-3 py-2 rounded-md border" type="submit">Apply to filtered</button>
    </form>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";

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
  const sizeRaw = Number(sp?.size ?? (typeof sp?.get === "function" ? sp.get("size") : 20));
  const pageRaw = Number(sp?.page ?? (typeof sp?.get === "function" ? sp.get("page") : 1));
  const size = Math.min(100, Math.max(5, Number.isFinite(sizeRaw) && sizeRaw ? sizeRaw : 20));
  const page = Math.max(1, Number.isFinite(pageRaw) && pageRaw ? pageRaw : 1);

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

  const where: Prisma.LearningActivityWhereInput | undefined = (q || category || typeGroup)
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
        ],
      }
    : undefined;

  const [total, activities, categories] = await Promise.all([
    prisma.learningActivity.count({ where }),
    prisma.learningActivity.findMany({
      where,
      orderBy: { updatedAt: "desc" },
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
      <form method="get" className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          name="q"
          placeholder="Search by title or category"
          defaultValue={q}
          className="border border-border rounded-md px-3 py-2 w-full"
        />
        <select name="category" defaultValue={category} className="border border-border rounded-md px-3 py-2">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category || ""}>
              {c.category}
            </option>
          ))}
        </select>
        <select name="typeGroup" defaultValue={typeGroup} className="border border-border rounded-md px-3 py-2">
          <option value="">All types</option>
          <option value="games">Games</option>
          <option value="learning">Learning Activities</option>
          <option value="lessons">Lessons</option>
          <option value="challenges">Challenges</option>
        </select>
        <input type="hidden" name="size" value={String(size)} />
        <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Search</button>
      </form>

      <BulkDifficultyForm q={q} category={category} />
      {/* Table view */}
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 w-[32px]">#</th>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Category</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Difficulty</th>
              <th className="text-left px-3 py-2">XP</th>
              <th className="text-left px-3 py-2">Diamonds</th>
              <th className="text-left px-3 py-2">Active</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a, idx) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2 align-top text-muted-foreground">{(page - 1) * size + idx + 1}</td>
                <td className="px-3 py-2 align-top">
                  <div className="font-medium truncate max-w-[320px]">{a.title}</div>
                </td>
                <td className="px-3 py-2 align-top">{a.category}</td>
                <td className="px-3 py-2 align-top">{a.activityType}</td>
                <td className="px-3 py-2 align-top">{a.difficulty}</td>
                <td className="px-3 py-2 align-top">{typeof a.experienceReward === 'number' ? a.experienceReward : '-'}</td>
                <td className="px-3 py-2 align-top">{typeof a.diamondReward === 'number' ? a.diamondReward : '-'}</td>
                <td className="px-3 py-2 align-top">
                  <span className={`text-xs px-2 py-0.5 rounded ${a.isActive ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'}`}>{a.isActive ? 'Active' : 'Inactive'}</span>
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await prisma.learningActivity.update({ where: { id: a.id }, data: { isActive: !a.isActive } });
                      }}
                    >
                      <button className="h-8 px-2 rounded border text-xs" type="submit">{a.isActive ? 'Set Inactive' : 'Set Active'}</button>
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
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={9}>No activities found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-muted-foreground">Page {page} of {totalPages} • {total} item(s)</div>
        <div className="flex items-center gap-2">
          <a
            className={`h-9 px-3 rounded border ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&size=${size}&page=${Math.max(1, page-1)}`}
          >
            Previous
          </a>
          <a
            className={`h-9 px-3 rounded border ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            href={`?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}&typeGroup=${encodeURIComponent(typeGroup)}&size=${size}&page=${Math.min(totalPages, page+1)}`}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ activity, q, category, page, size }: { activity: any; q: string; category: string; page: number; size: number }) {
  async function deleteActivity() {
    "use server";
    await prisma.learningActivity.delete({ where: { id: activity.id } });
  }
  return (
    <form
      action={async () => {
        "use server";
        await prisma.learningActivity.update({ where: { id: activity.id }, data: { isActive: !activity.isActive } });
      }}
      className="flex items-center gap-3 p-3 bg-muted/30 rounded-md"
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{activity.title}</div>
        <div className="text-xs text-muted-foreground">
          {activity.category} • Difficulty {activity.difficulty}
          {typeof activity.experienceReward === "number" && (
            <> • XP {activity.experienceReward}</>
          )}
          {typeof activity.diamondReward === "number" && (
            <> • Diamonds {activity.diamondReward}</>
          )}
        </div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-md ${activity.isActive ? "bg-green-600 text-white" : "bg-gray-300 text-gray-800"}`}>
        {activity.isActive ? "Active" : "Inactive"}
      </span>
      <button className="px-3 py-1 rounded-md border border-border text-sm" type="submit">
        {activity.isActive ? "Set Inactive" : "Set Active"}
      </button>
      <ConfirmDeleteButton
        action={deleteActivity}
        title="Delete activity"
        description={`Are you sure you want to delete "${activity.title}"? This cannot be undone.`}
      />
    </form>
  );
}

async function CreateActivityForm({ presetCategory }: { presetCategory: string }) {
  const categories = await prisma.learningActivity.findMany({
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  async function create(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "general");
    const difficulty = Number(formData.get("difficulty") || 1);
    if (!title) return;
    await prisma.learningActivity.create({
      data: {
        title,
        category,
        difficulty,
        activityType: "custom",
        content: "{}",
        description: "",
        diamondReward: 10,
        experienceReward: 25,
        isActive: true,
      },
    });
  }
  return (
    <form action={create} className="mb-4 p-3 border rounded-md bg-muted/20 grid gap-2">
      <div className="text-sm font-medium">Create Activity</div>
      <input name="title" placeholder="Title" className="border rounded-md px-3 py-2" />
      <div className="flex gap-2">
        <select name="category" defaultValue={presetCategory || ""} className="border rounded-md px-3 py-2">
          <option value="">general</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category || ""}>
              {c.category}
            </option>
          ))}
        </select>
        <input name="difficulty" type="number" min={1} max={10} defaultValue={1} className="border rounded-md px-3 py-2 w-28" />
      </div>
      <button className="px-3 py-2 rounded-md bg-primary text-primary-foreground w-max" type="submit">Create</button>
    </form>
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
    <form action={bulkUpdate} className="mb-4 p-3 border rounded-md bg-muted/20 flex items-center gap-2">
      <div className="text-sm">Bulk difficulty</div>
      <input name="newDifficulty" type="number" min={1} max={10} defaultValue={1} className="border rounded-md px-3 py-2 w-28" />
      <button className="px-3 py-2 rounded-md border" type="submit">Apply to filtered</button>
    </form>
  );
}

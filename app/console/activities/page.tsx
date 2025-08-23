import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({ searchParams }: { searchParams: any }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) return null;

  const sp = await searchParams;
  const q = ((sp?.q ?? (typeof sp?.get === "function" ? sp.get("q") : "")) || "").trim();
  const category = ((sp?.category ?? (typeof sp?.get === "function" ? sp.get("category") : "")) || "").trim();

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

  const [activities, categories] = await Promise.all([
    prisma.learningActivity.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.learningActivity.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

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
        <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Search</button>
      </form>

      <CreateActivityForm presetCategory={category} />
      <BulkDifficultyForm q={q} category={category} />
      <div className="grid gap-2">
        {activities.map((a) => (
          <ActivityRow key={a.id} activity={a} />
        ))}
        {activities.length === 0 && <div className="text-sm text-muted-foreground">No activities found.</div>}
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: any }) {
  async function toggle() {
    "use server";
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
        <div className="text-xs text-muted-foreground">{activity.category} • Difficulty {activity.difficulty}</div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-md ${activity.isActive ? "bg-green-600 text-white" : "bg-gray-300 text-gray-800"}`}>
        {activity.isActive ? "Active" : "Inactive"}
      </span>
      <button className="px-3 py-1 rounded-md border border-border text-sm" type="submit">
        Toggle
      </button>
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

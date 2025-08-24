import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2, Power } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChallengesAdminPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin =
    typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) redirect("/");

  const spRaw: any =
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as any)
      : searchParams ?? {};
  const sp =
    spRaw instanceof URLSearchParams
      ? spRaw
      : new URLSearchParams(spRaw as Record<string, string>);
  const getParam = (k: string, def = "") => {
    const v = sp.get(k);
    return typeof v === "string" && v.length > 0 ? v : def;
  };

  const page = Math.max(1, Number(getParam("page", "1")));
  const size = Math.min(100, Math.max(5, Number(getParam("size", "20"))));
  const q = getParam("q", "").trim();
  const typeFilter = getParam("type", "");
  const sort = getParam("sort", "startDate");
  const dir = getParam("dir", "desc");

  const where: any = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
            { challengeType: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(typeFilter ? { challengeType: typeFilter } : {}),
  };

  const orderBy: any = { [sort]: dir === "asc" ? "asc" : "desc" };
  const skip = (page - 1) * size;

  const [total, items, typeRows] = await Promise.all([
    prisma.weeklyChallenge.count({ where }),
    prisma.weeklyChallenge.findMany({ where, orderBy, skip, take: size }),
    prisma.weeklyChallenge.groupBy({
      by: ["challengeType"],
      _count: { challengeType: true },
      orderBy: { challengeType: "asc" },
    }),
  ]);
  const allTypes = typeRows.map((r) => r.challengeType).filter(Boolean);

  const totalPages = Math.max(1, Math.ceil(total / size));

  const makeHref = (params: Record<string, string | number>) => {
    const usp = new URLSearchParams({
      q,
      sort,
      dir,
      size: String(size),
      page: String(page),
      type: typeFilter,
    });
    Object.entries(params).forEach(([k, v]) => usp.set(k, String(v)));
    return `?${usp.toString()}`;
  };

  const th = (label: string, key: string) => (
    <th className="text-left px-3 py-2">
      <a
        className="inline-flex items-center gap-1 hover:underline"
        href={makeHref({
          sort: key,
          dir: sort === key && dir === "asc" ? "desc" : "asc",
          page: 1,
        })}
      >
        {label} {sort === key ? (dir === "asc" ? "▲" : "▼") : ""}
      </a>
    </th>
  );

  const badge = (
    text: string,
    tone: "rose" | "emerald" | "indigo" | "slate" | "amber" = "slate"
  ) => {
    const tones: Record<string, string> = {
      rose: "bg-rose-100 text-rose-800 border-rose-200",
      emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      slate: "bg-slate-100 text-slate-800 border-slate-200",
      amber: "bg-blue-100 text-blue-900 border-blue-200",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]} whitespace-nowrap`}
      >
        {text}
      </span>
    );
  };

  const toneForType = (
    t?: string | null
  ): "rose" | "emerald" | "indigo" | "slate" | "amber" => {
    const key = (t ?? "").toLowerCase();
    if (key.includes("streak") || key.includes("daily")) return "amber";
    if (key.includes("quiz") || key.includes("points")) return "emerald";
    if (key.includes("game") || key.includes("speed")) return "indigo";
    if (key.includes("hard") || key.includes("elite")) return "rose";
    return "slate";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Challenges</h1>
        <div className="flex items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search..."
              className="h-9 w-56 rounded border px-3"
            />
            <select
              name="type"
              defaultValue={typeFilter}
              className="h-9 rounded border px-2"
            >
              <option value="">All types</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="size" value={String(size)} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="dir" value={dir} />
            <button type="submit" className="h-9 rounded border px-3">
              Search
            </button>
          </form>
          <Link
            href="/console/challenges/participation"
            className="h-9 inline-flex items-center rounded border px-3"
          >
            Participation
          </Link>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Challenges</div>
            <div className="text-xs opacity-90">{total.toString()} total</div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-3 w-[40px] font-semibold">#</th>
              {th("Title", "title")}
              {th("Type", "challengeType")}
              {th("Scope", "requirements")}
              {th("Category", "category")}
              {th("Difficulty", "difficulty")}
              {th("Start", "startDate")}
              {th("End", "endDate")}
              {th("XP", "experienceReward")}
              {th("Diamonds", "diamondReward")}
              {th("Active", "isActive")}
              <th className="text-right px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c, idx) => (
              <tr
                key={c.id}
                className={
                  idx % 2
                    ? "bg-gradient-to-r from-blue-50/30 to-indigo-50/30"
                    : "bg-gradient-to-r from-indigo-50/50 to-purple-50/50 hover:bg-gradient-to-r hover:from-blue-100/60 hover:to-indigo-100/60 transition-colors"
                }
              >
                <td className="px-3 py-2">{(skip + idx + 1).toString()}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.description}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {badge(c.challengeType, toneForType(c.challengeType))}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  <span
                    title={(() => {
                      try {
                        return (c as any).requirements;
                      } catch {
                        return "";
                      }
                    })()}
                  >
                    {(() => {
                      try {
                        const req =
                          typeof (c as any).requirements === "string"
                            ? JSON.parse((c as any).requirements)
                            : (c as any).requirements;
                        const scope =
                          req?.scope ||
                          (req?.type === "games_session" ? "game" : "any");
                        const cat = req?.category ? ` • ${req.category}` : "";
                        return `${req?.type || "n/a"} • ${scope}${cat}`;
                      } catch {
                        return "n/a";
                      }
                    })()}
                  </span>
                </td>
                <td className="px-3 py-2">{badge(c.category, "indigo")}</td>
                <td className="px-3 py-2">{badge(c.difficulty, "slate")}</td>
                <td className="px-3 py-2">
                  {new Date(c.startDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  {new Date(c.endDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">{c.experienceReward}</td>
                <td className="px-3 py-2">{c.diamondReward}</td>
                <td className="px-3 py-2">
                  {c.isActive
                    ? badge("Active", "emerald")
                    : badge("Inactive", "slate")}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  {/* Toggle with confirmation */}
                  <form
                    id={`toggleForm-${c.id}`}
                    method="post"
                    action={`/api/admin/challenges/toggle?id=${c.id}`}
                    className="hidden"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded border hover:bg-muted"
                        aria-label={c.isActive ? "Deactivate" : "Activate"}
                        title={c.isActive ? "Deactivate" : "Activate"}
                      >
                        <Power
                          className={`h-4 w-4 ${
                            c.isActive ? "text-blue-600" : "text-emerald-600"
                          }`}
                        />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {c.isActive
                            ? "Deactivate challenge?"
                            : "Activate challenge?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {c.title}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          form={`toggleForm-${c.id}`}
                          type="submit"
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Delete with confirmation */}
                  <form
                    id={`deleteForm-${c.id}`}
                    method="post"
                    action={`/api/admin/challenges/delete?id=${c.id}`}
                    className="hidden"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded border hover:bg-red-50"
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete challenge?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. {c.title}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          form={`deleteForm-${c.id}`}
                          type="submit"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          Showing {(skip + 1).toString()}-
          {Math.min(skip + size, total).toString()} of {total.toString()}
        </div>
        <div className="flex items-center gap-2">
          <a
            className="rounded border px-2 py-1"
            href={makeHref({ page: Math.max(1, page - 1) })}
          >
            Prev
          </a>
          <span>
            Page {page.toString()} / {totalPages.toString()}
          </span>
          <a
            className="rounded border px-2 py-1"
            href={makeHref({ page: Math.min(totalPages, page + 1) })}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  );
}

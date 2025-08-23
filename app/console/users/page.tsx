import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import UserRow from "@/components/console/UserRow";
import UserDrawer from "@/components/console/UserDrawer";
import Link from "next/link";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams?: any }) {
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
  const page = Math.max(parseInt(getParam("page") || "1"), 1);
  const pageSize = 20;
  const sort = (getParam("sort") as keyof any) || "createdAt";
  const dir = (getParam("dir") === "asc" ? "asc" : "desc") as "asc" | "desc";
  const filterRole = getParam("role").trim();
  const filterActive = getParam("active").trim(); // yes/no

  const where: Prisma.UserWhereInput | undefined = (q || filterRole || filterActive)
    ? {
        AND: [
          q
            ? {
                OR: [
                  { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
                  { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
                ],
              }
            : {},
          filterRole ? { role: filterRole } : {},
          filterActive ? { isActive: filterActive === "yes" } : {},
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sort]: dir } as any,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold mb-4">Users</h1>
      <form method="get" className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          placeholder="Search by email or username"
          defaultValue={q}
          className="border border-border rounded-md px-3 py-2 w-full"
        />
        <select name="sort" defaultValue={String(sort)} className="border border-border rounded-md px-3 py-2">
          <option value="createdAt">Created</option>
          <option value="updatedAt">Updated</option>
          <option value="username">Username</option>
          <option value="email">Email</option>
          <option value="level">Level</option>
          <option value="experience">XP</option>
        </select>
        <select name="dir" defaultValue={dir} className="border border-border rounded-md px-3 py-2">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <select name="role" defaultValue={filterRole} className="border border-border rounded-md px-3 py-2">
          <option value="">Role (any)</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="superadmin">superadmin</option>
        </select>
        <select name="active" defaultValue={filterActive} className="border border-border rounded-md px-3 py-2">
          <option value="">Active (any)</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground">Search</button>
      </form>

      <div className="grid gap-3">
        <div className="p-4 rounded-md border">
          <div className="font-medium mb-2 text-sm">Create user</div>
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = String(formData.get("email") || "").trim();
              const username = String(formData.get("username") || "").trim();
              const password = String(formData.get("password") || "");
              const role = String(formData.get("role") || "user");
              const isActive = String(formData.get("isActive") || "yes") === "yes";
              if (!email || !username || !password) return;
              const passwordHash = await bcrypt.hash(password, 10);
              try {
                await prisma.user.create({
                  data: {
                    email,
                    username,
                    passwordHash,
                    role,
                    isActive,
                    currentDiamonds: 100,
                    totalDiamonds: 100,
                    loginStreak: 1,
                    maxLoginStreak: 1,
                    lastLoginDate: new Date(),
                    level: 1,
                    experience: 0,
                    isPremium: false,
                  },
                });
              } catch (e) {
                console.error("Create user error", e);
              }
            }}
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6"
          >
            <input name="email" placeholder="Email" className="border rounded-md px-2 py-1" />
            <input name="username" placeholder="Username" className="border rounded-md px-2 py-1" />
            <input name="password" type="password" placeholder="Password" className="border rounded-md px-2 py-1" />
            <select name="role" defaultValue="user" className="border rounded-md px-2 py-1">
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <select name="isActive" defaultValue="yes" className="border rounded-md px-2 py-1">
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
            <div>
              <button className="px-3 py-1 rounded-md border">Create</button>
            </div>
          </form>
        </div>

        <div className="p-4 rounded-md border">
          <div className="font-medium mb-2 text-sm">Bulk actions (filtered users)</div>
          <form
            action={async (formData: FormData) => {
              "use server";
              const role = String(formData.get("setRole") || "");
              const active = String(formData.get("setActive") || "");
              const wherePayload: Prisma.UserWhereInput | undefined = (q || filterRole || filterActive)
                ? {
                    AND: [
                      q
                        ? {
                            OR: [
                              { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
                              { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
                            ],
                          }
                        : {},
                      filterRole ? { role: filterRole } : {},
                      filterActive ? { isActive: filterActive === "yes" } : {},
                    ],
                  }
                : undefined;
              const data: Prisma.UserUpdateManyMutationInput = {};
              if (role) data.role = role;
              if (active) data.isActive = active === "yes";
              if (Object.keys(data).length > 0) {
                await prisma.user.updateMany({ where: wherePayload, data });
              }
            }}
            className="flex flex-wrap gap-2"
          >
            <select name="setRole" defaultValue="" className="border rounded-md px-2 py-1">
              <option value="">(no change) Set role…</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <select name="setActive" defaultValue="" className="border rounded-md px-2 py-1">
              <option value="">(no change) Set active…</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <button className="px-3 py-1 rounded-md border">Apply to filtered</button>
          </form>
        </div>
      </div>

      <div className="grid gap-2">
        {users.map((u) => (
          <div key={u.id} className="grid gap-2">
            <UserRow user={u} />
            <UserDrawer user={u} />
          </div>
        ))}
        {users.length === 0 && <div className="text-sm text-muted-foreground">No users found.</div>}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-muted-foreground">
          Page {page} / {totalPages} • {total} users
        </span>
        <div className="flex gap-2">
          <Link
            href={`?q=${encodeURIComponent(q)}&role=${encodeURIComponent(filterRole)}&active=${encodeURIComponent(filterActive)}&sort=${encodeURIComponent(String(sort))}&dir=${dir}&page=${Math.max(1, page - 1)}`}
            className={`px-3 py-1 rounded-md border ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
          >
            Prev
          </Link>
          <Link
            href={`?q=${encodeURIComponent(q)}&role=${encodeURIComponent(filterRole)}&active=${encodeURIComponent(filterActive)}&sort=${encodeURIComponent(String(sort))}&dir=${dir}&page=${Math.min(totalPages, page + 1)}`}
            className={`px-3 py-1 rounded-md border ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}


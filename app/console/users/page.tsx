import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import UserRow from "@/components/console/UserRow";
import UserDrawer from "@/components/console/UserDrawer";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Plus, Filter, UserPlus, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage({
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
  const page = Math.max(parseInt(getParam("page") || "1"), 1);
  const pageSize = 20;
  const sort = (getParam("sort") as keyof any) || "createdAt";
  const dir = (getParam("dir") === "asc" ? "asc" : "desc") as "asc" | "desc";
  const filterRole = getParam("role").trim();
  const filterActive = getParam("active").trim(); // yes/no

  const where: Prisma.UserWhereInput | undefined =
    q || filterRole || filterActive
      ? {
          AND: [
            q
              ? {
                  OR: [
                    {
                      email: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
                    {
                      username: {
                        contains: q,
                        mode: Prisma.QueryMode.insensitive,
                      },
                    },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-slate-600">
            {total.toLocaleString()} total users
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-lg text-slate-900">
              Search & Filters
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form method="get" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    name="q"
                    placeholder="Search by email or username..."
                    defaultValue={q}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sort By
                </label>
                <select
                  name="sort"
                  defaultValue={String(sort)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt">Registration Date</option>
                  <option value="updatedAt">Last Updated</option>
                  <option value="username">Username</option>
                  <option value="email">Email</option>
                  <option value="level">Level</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Order
                </label>
                <select
                  name="dir"
                  defaultValue={dir}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  defaultValue={filterRole}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="active"
                  defaultValue={filterActive}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="yes">Active</option>
                  <option value="no">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Actions Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create User */}
        <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-200 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-emerald-800">
                Create New User
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form
              action={async (formData: FormData) => {
                "use server";
                const email = String(formData.get("email") || "").trim();
                const username = String(formData.get("username") || "").trim();
                const password = String(formData.get("password") || "");
                const role = String(formData.get("role") || "user");
                const isActive =
                  String(formData.get("isActive") || "yes") === "yes";
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
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    name="email"
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    name="username"
                    placeholder="username"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue="user"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="isActive"
                    defaultValue="yes"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="yes">Active</option>
                    <option value="no">Inactive</option>
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <Card className="shadow-sm border-slate-200 bg-gradient-to-br from-violet-50 to-purple-100">
          <CardHeader className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-b border-violet-200 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg text-blue-800">
                Bulk Actions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-4">
              Apply changes to all filtered users ({users.length} users)
            </p>
            <form
              action={async (formData: FormData) => {
                "use server";
                const role = String(formData.get("setRole") || "");
                const active = String(formData.get("setActive") || "");
                const wherePayload: Prisma.UserWhereInput | undefined =
                  q || filterRole || filterActive
                    ? {
                        AND: [
                          q
                            ? {
                                OR: [
                                  {
                                    email: {
                                      contains: q,
                                      mode: Prisma.QueryMode.insensitive,
                                    },
                                  },
                                  {
                                    username: {
                                      contains: q,
                                      mode: Prisma.QueryMode.insensitive,
                                    },
                                  },
                                ],
                              }
                            : {},
                          filterRole ? { role: filterRole } : {},
                          filterActive
                            ? { isActive: filterActive === "yes" }
                            : {},
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
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Set Role
                  </label>
                  <select
                    name="setRole"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Change</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Set Status
                  </label>
                  <select
                    name="setActive"
                    defaultValue=""
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Change</option>
                    <option value="yes">Active</option>
                    <option value="no">Inactive</option>
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Apply Bulk Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="shadow-sm border-slate-200 bg-gradient-to-b from-slate-50/50 to-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 border-b border-slate-100 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-lg text-slate-900">
                Users ({users.length})
              </CardTitle>
            </div>
            <div className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No users found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search filters or create a new user.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id}>
                  <UserRow user={u} />
                  <UserDrawer user={u} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} of {total} users
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`?q=${encodeURIComponent(q)}&role=${encodeURIComponent(
                filterRole
              )}&active=${encodeURIComponent(
                filterActive
              )}&sort=${encodeURIComponent(
                String(sort)
              )}&dir=${dir}&page=${Math.max(1, page - 1)}`}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                page === 1
                  ? "pointer-events-none opacity-50 bg-slate-50"
                  : "hover:bg-slate-50"
              }`}
            >
              Previous
            </Link>
            <span className="px-4 py-2 text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <Link
              href={`?q=${encodeURIComponent(q)}&role=${encodeURIComponent(
                filterRole
              )}&active=${encodeURIComponent(
                filterActive
              )}&sort=${encodeURIComponent(
                String(sort)
              )}&dir=${dir}&page=${Math.min(totalPages, page + 1)}`}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                page === totalPages
                  ? "pointer-events-none opacity-50 bg-slate-50"
                  : "hover:bg-slate-50"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

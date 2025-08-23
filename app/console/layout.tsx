import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConsoleShell from "@/components/console/ConsoleShell";

export const metadata = {
  title: "Control Center",
};

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isAdmin = typeof role === "string" && role.toLowerCase().includes("admin");
  if (!isAdmin) redirect("/");

  const username = (session?.user as any)?.username ?? session?.user?.email?.split("@")[0] ?? "User";
  const email = session?.user?.email ?? "";

  return (
    <ConsoleShell username={username} email={email} role={role}>
      {children}
    </ConsoleShell>
  );
}

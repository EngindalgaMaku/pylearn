"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/hooks/use-toast";

export default function ConsoleShell({
  children,
  username,
  email,
  role,
}: {
  children: React.ReactNode;
  username: string;
  email: string;
  role?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const userChangedRef = useRef(false);
  useEffect(() => {
    const stored = localStorage.getItem("console_sidebar_collapsed");
    if (stored !== null) {
      setCollapsed(stored === "1");
      return;
    }
    // Default to collapsed on small screens
    const media = window.matchMedia("(max-width: 767px)");
    setCollapsed(media.matches);
    const onChange = () => {
      if (!userChangedRef.current) setCollapsed(media.matches);
    };
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);
  useEffect(() => {
    if (userChangedRef.current) {
      localStorage.setItem("console_sidebar_collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  // Keyboard shortcut: Alt+[ toggles sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "[" || e.code === "BracketLeft")) {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () => {
    userChangedRef.current = true;
    setCollapsed((v) => !v);
  };

  const handleLogout = () => {
    toast({ title: "Signed out", description: "See you soon!" });
    // Redirect after brief tick so toast can enqueue
    setTimeout(() => signOut({ callbackUrl: "/" }), 50);
  };

  const itemCls = "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted";
  const labelCls = collapsed ? "hidden" : "";
  const asideWidth = collapsed ? "w-14" : "w-64 md:w-72 xl:w-80";

  return (
    <div className="min-h-screen grid grid-cols-[auto_1fr]">
      <aside className={`${asideWidth} border-r border-border bg-card/40 transition-[width] duration-200 ease-in-out`}>
        <div className="p-3 sticky top-0">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-sm font-semibold ${labelCls}`}>Admin</div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="h-8 w-8 inline-flex items-center justify-center rounded border text-xs"
              title={collapsed ? "Expand" : "Collapse"}
              aria-label="Toggle sidebar"
              aria-expanded={!collapsed}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <div className={`mb-3 rounded-lg border bg-background p-3 ${labelCls}`}>
            <div className="text-sm font-medium truncate" title={username}>{username}</div>
            <div className="text-xs text-muted-foreground truncate" title={email}>{email}</div>
            <div className="mt-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{role || "user"}</div>
          </div>

          <div className={`font-semibold mb-2 text-xs uppercase text-muted-foreground ${labelCls}`}>Overview</div>
          <nav className="space-y-1 text-sm mb-4">
            <Link href="/console" className={itemCls}>
              <span className="text-base">📊</span>
              <span className={labelCls}>Dashboard</span>
            </Link>
          </nav>

          <div className={`font-semibold mb-2 text-xs uppercase text-muted-foreground ${labelCls}`}>Management</div>
          <nav className="space-y-1 text-sm mb-4">
            <Link href="/console/users" className={itemCls}>
              <span className="text-base">👤</span>
              <span className={labelCls}>Users</span>
            </Link>
            <Link href="/console/activities" className={itemCls}>
              <span className="text-base">🎯</span>
              <span className={labelCls}>Activities</span>
            </Link>
            <Link href="/console/shop" className={itemCls}>
              <span className="text-base">💎</span>
              <span className={labelCls}>Shop</span>
            </Link>
          </nav>

          <div className={`font-semibold mb-2 text-xs uppercase text-muted-foreground ${labelCls}`}>System</div>
          <nav className="space-y-1 text-sm">
            <Link href="/" className={itemCls}>
              <span className="text-base">🏠</span>
              <span className={labelCls}>Back to App</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={`${itemCls} w-full text-left text-red-600`}
            >
              <span className="text-base">🚪</span>
              <span className={labelCls}>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      <section>
        <header className="sticky top-0 z-10 border-b border-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow">
          <div className="mx-auto max-w-screen-2xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="h-8 w-8 inline-flex items-center justify-center rounded border border-white/30 text-xs text-white hover:bg-white/10"
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-label="Toggle sidebar"
                  aria-expanded={!collapsed}
                >
                  {collapsed ? "»" : "«"}
                </button>
                <h1 className="text-base font-semibold text-white">Admin Console</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`hidden md:inline text-xs text-white/80 ${labelCls}`}>Signed in as {username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  aria-label="Logout"
                  className="h-8 w-8 inline-flex items-center justify-center rounded border border-white/30 text-xs text-white hover:bg-white/10"
                >
                  ⎋
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-screen-2xl px-4 py-6">{children}</main>
      </section>
    </div>
  );
}

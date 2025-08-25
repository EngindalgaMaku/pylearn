"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import {
  BarChart3,
  Users,
  Target,
  Trophy,
  Calendar,
  TrendingUp,
  Clock,
  Diamond,
  Home,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

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
    <div className="min-h-screen grid grid-cols-[auto_1fr] bg-slate-50">
      <aside
        className={`${asideWidth} bg-white border-r border-slate-200 shadow-lg transition-[width] duration-300 ease-in-out`}
      >
        <div className="p-4 sticky top-0">
          <div className="flex items-center justify-between mb-6">
            <div className={`${labelCls}`}>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PyLearn
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Admin Console
              </p>
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title={collapsed ? "Expand" : "Collapse"}
              aria-label="Toggle sidebar"
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          <div
            className={`mb-6 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 shadow-sm ${labelCls}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold text-slate-900 truncate"
                  title={username}
                >
                  {username}
                </div>
                <div className="text-xs text-slate-500 truncate" title={email}>
                  {email}
                </div>
              </div>
            </div>
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-white/80 mr-2"></div>
              {role || "user"}
            </div>
          </div>

          <div
            className={`font-semibold mb-3 text-xs uppercase tracking-wide text-slate-400 ${labelCls}`}
          >
            Overview
          </div>
          <nav className="space-y-1 text-sm mb-6">
            <Link
              href="/console"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors group"
            >
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className={labelCls}>Dashboard</span>
            </Link>
          </nav>

          <div
            className={`font-semibold mb-3 text-xs uppercase tracking-wide text-slate-400 ${labelCls}`}
          >
            Management
          </div>
          <nav className="space-y-1 text-sm mb-6">
            <Link
              href="/console/users"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors"
            >
              <Users className="w-5 h-5 text-emerald-500" />
              <span className={labelCls}>Users</span>
            </Link>
            <Link
              href="/console/activities"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors"
            >
              <Target className="w-5 h-5 text-purple-500" />
              <span className={labelCls}>Activities</span>
            </Link>
            <Link
              href="/console/challenges"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-colors"
            >
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className={labelCls}>Challenges</span>
            </Link>
            <Link
              href="/console/daily"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors"
            >
              <Calendar className="w-5 h-5 text-rose-500" />
              <span className={labelCls}>Daily Challenges</span>
            </Link>
            <Link
              href="/console/challenges/participation"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span className={labelCls}>Participation</span>
            </Link>
            <Link
              href="/console/challenges/progress-log"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 transition-colors"
            >
              <Clock className="w-5 h-5 text-cyan-500" />
              <span className={labelCls}>Progress Log</span>
            </Link>
            <Link
              href="/console/shop"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-yellow-50 text-slate-700 hover:text-yellow-700 transition-colors"
            >
              <Diamond className="w-5 h-5 text-yellow-500" />
              <span className={labelCls}>Shop</span>
            </Link>
            <Link
              href="/console/tips"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-orange-50 text-slate-700 hover:text-orange-700 transition-colors"
            >
              <Lightbulb className="w-5 h-5 text-orange-500" />
              <span className={labelCls}>Tips</span>
            </Link>
          </nav>

          <div
            className={`font-semibold mb-3 text-xs uppercase tracking-wide text-slate-400 ${labelCls}`}
          >
            System
          </div>
          <nav className="space-y-1 text-sm">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-colors"
            >
              <Home className="w-5 h-5 text-slate-500" />
              <span className={labelCls}>Back to App</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-slate-700 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span className={labelCls}>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      <section className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-label="Toggle sidebar"
                  aria-expanded={!collapsed}
                >
                  <Menu className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Dashboard
                  </h1>
                  <p className="text-sm text-slate-500">
                    Welcome back to PyLearn Admin
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-slate-700 font-medium">
                    {username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  aria-label="Logout"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 bg-slate-50">{children}</main>
      </section>
    </div>
  );
}

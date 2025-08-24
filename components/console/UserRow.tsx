"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  ShieldCheck,
  Calendar,
  Mail,
  Trophy,
  Zap,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function UserRow({ user }: { user: any }) {
  const [role, setRole] = useState<string>(user.role);
  const [isActive, setIsActive] = useState<boolean>(user.isActive);
  const [pending, startTransition] = useTransition();

  const save = (payload: Partial<{ role: string; isActive: boolean }>) => {
    startTransition(async () => {
      await fetch("/api/console/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...payload }),
      });
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "superadmin":
        return <ShieldCheck className="w-4 h-4" />;
      case "admin":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-slate-200">
            User
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {(user.username || user.email).charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-slate-900 truncate">
                {user.username || user.email}
              </h3>
              {getRoleBadge(role)}
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </div>
              {user.level && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Level {user.level}
                </div>
              )}
              {user.experience && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {user.experience} XP
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Role:</label>
            <select
              value={role}
              onChange={(e) => {
                const v = e.target.value;
                setRole(v);
                save({ role: v });
              }}
              disabled={pending}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">
              Status:
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => {
                  const v = e.target.checked;
                  setIsActive(v);
                  save({ isActive: v });
                }}
                disabled={pending}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {pending && (
            <div className="px-3 py-1.5 text-sm text-blue-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              Saving...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

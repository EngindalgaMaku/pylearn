"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Key,
  User,
  Mail,
  Calendar,
  Activity,
  Diamond,
  Trophy,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function UserDrawer({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const sendReset = () => {
    startTransition(async () => {
      setMessage(null);
      const res = await fetch("/api/console/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Failed to send reset link");
      } else {
        setMessage("Password reset email sent (if SMTP configured).");
      }
    });
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <User className="w-4 h-4" />
          User Details & Actions
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
            {/* User Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Account Information
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    User ID
                  </label>
                  <div className="text-sm text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">
                    {user.id}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Username
                  </label>
                  <div className="text-sm text-slate-900">
                    {user.username || "Not set"}
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Email
                  </label>
                  <div className="text-sm text-slate-900 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Joined
                  </label>
                  <div className="text-sm text-slate-900 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Last Updated
                  </label>
                  <div className="text-sm text-slate-900 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Stats & Actions */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Game Statistics
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-amber-50 to-orange-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Level
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-900">
                    {user.level || 1}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Experience
                    </span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {user.experience || 0}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Diamond className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Current Diamonds
                    </span>
                  </div>
                  <div className="text-lg font-bold text-purple-900">
                    {user.currentDiamonds || 0}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      Login Streak
                    </span>
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {user.loginStreak || 0}
                  </div>
                </div>
              </div>

              {/* Password Reset Action */}
              <div className="pt-4 border-t border-slate-200">
                <h5 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Account Actions
                </h5>
                <div className="space-y-3">
                  <Button
                    onClick={sendReset}
                    disabled={pending}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    {pending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Send Password Reset Link
                      </>
                    )}
                  </Button>

                  {message && (
                    <div
                      className={`p-3 rounded-lg flex items-center gap-2 ${
                        message.includes("error") || message.includes("Failed")
                          ? "bg-red-50 text-red-800"
                          : "bg-green-50 text-green-800"
                      }`}
                    >
                      {message.includes("error") ||
                      message.includes("Failed") ? (
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="text-sm">{message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{user.username || user.email}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
      </div>
      <select
        value={role}
        onChange={(e) => {
          const v = e.target.value;
          setRole(v);
          save({ role: v });
        }}
        className="border border-border rounded-md px-2 py-1 text-sm"
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
        <option value="superadmin">superadmin</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => {
            const v = e.target.checked;
            setIsActive(v);
            save({ isActive: v });
          }}
        />
        Active
      </label>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => save({ role, isActive })}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

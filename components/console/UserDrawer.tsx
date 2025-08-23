"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="bg-card/40 rounded-md border border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-sm text-muted-foreground">Details</div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open && (
        <div className="px-3 pb-3 text-sm space-y-2">
          <div>
            <span className="text-muted-foreground">ID:</span> {user.id}
          </div>
          <div>
            <span className="text-muted-foreground">Username:</span> {user.username}
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span> {user.email}
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={sendReset} disabled={pending}>
              {pending ? "Sending..." : "Send reset password link"}
            </Button>
            {message && <span className="text-xs text-muted-foreground">{message}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

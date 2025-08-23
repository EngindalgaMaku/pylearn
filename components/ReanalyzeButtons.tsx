"use client";

import React, { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ReanalyzeButtons({
  visibleIds,
  bulkFormId = "bulkForm",
}: {
  visibleIds: string[];
  bulkFormId?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"none" | "sel" | "all">("none");
  const [msg, setMsg] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const collectSelected = useCallback(() => {
    const root = document.getElementById(bulkFormId) as HTMLFormElement | null;
    if (!root) return [] as string[];
    const inputs = root.querySelectorAll<HTMLInputElement>('input[name="ids"]:checked');
    return Array.from(inputs).map((i) => i.value).filter(Boolean);
  }, [bulkFormId]);

  const callAnalyze = useCallback(async (ids: string[]) => {
    if (!ids.length) return { ok: false, message: "No cards selected" } as const;
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulkAnalysis: true, cardIds: ids, forceReAnalysis: true }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, message: t || "Analyze request failed" } as const;
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, message: `Analyzed ${data.successful ?? ids.length}/${ids.length}, failed ${data.failed ?? 0}` } as const;
  }, []);

  const runSel = useCallback(async () => {
    const ids = collectSelected();
    setBusy("sel");
    setMsg("");
    const r = await callAnalyze(ids);
    setMsg(r.message);
    setBusy("none");
    if (r.ok) {
      setTimeout(() => {
        router.refresh();
      }, 400);
    }
  }, [collectSelected, callAnalyze, router]);

  const runAll = useCallback(async () => {
    setBusy("all");
    setMsg("");
    const r = await callAnalyze(visibleIds);
    setMsg(r.message);
    setBusy("none");
    if (r.ok) {
      setTimeout(() => {
        router.refresh();
      }, 400);
    }
  }, [visibleIds, callAnalyze, router]);

  const onConfirmSel = useCallback(() => {
    startTransition(async () => {
      await runSel();
    });
  }, [runSel]);
  const onConfirmAll = useCallback(() => {
    startTransition(async () => {
      await runAll();
    });
  }, [runAll]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Reanalyze selected */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {}}
            disabled={busy !== "none"}
            aria-busy={busy === "sel"}
            title="Reanalyze selected cards"
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 11h-4"/><path d="M12 7v8"/><circle cx="12" cy="12" r="10"/></svg>
            {busy === "sel" ? "Reanalyzing selected…" : "Reanalyze selected"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reanalyze selected cards?</AlertDialogTitle>
            <AlertDialogDescription>
              This will run AI analysis again and may overwrite names, stats, and pricing for the selected cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmSel} disabled={pending}>
              {pending ? "Running…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reanalyze visible */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={() => {}}
            disabled={busy !== "none" || visibleIds.length === 0}
            aria-busy={busy === "all"}
            title="Reanalyze all visible on this page"
            className="bg-sky-600 hover:bg-sky-700"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 22v-6h6"/><path d="M21 8a13.94 13.94 0 0 0-9-3.4A14 14 0 0 0 3 18"/></svg>
            {busy === "all" ? "Reanalyzing visible…" : `Reanalyze visible (${visibleIds.length})`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reanalyze visible cards?</AlertDialogTitle>
            <AlertDialogDescription>
              This will run AI analysis again and may overwrite names, stats, and pricing for all cards visible on this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmAll} disabled={pending}>
              {pending ? "Running…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}

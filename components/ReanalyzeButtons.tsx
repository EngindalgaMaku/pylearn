"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

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

  const onSel = useCallback(async () => {
    const ids = collectSelected();
    setBusy("sel");
    setMsg("");
    const r = await callAnalyze(ids);
    setMsg(r.message);
    setBusy("none");
    if (r.ok) {
      // brief feedback then refresh data
      setTimeout(() => {
        router.refresh();
      }, 400);
    }
  }, [collectSelected, callAnalyze]);

  const onAll = useCallback(async () => {
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
  }, [visibleIds, callAnalyze]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        className="px-2 h-8 rounded border text-xs disabled:opacity-50"
        onClick={onSel}
        disabled={busy !== "none"}
        aria-busy={busy === "sel"}
      >
        {busy === "sel" ? "Reanalyzing selected…" : "Reanalyze selected"}
      </button>
      <button
        className="px-2 h-8 rounded border text-xs disabled:opacity-50"
        onClick={onAll}
        disabled={busy !== "none" || visibleIds.length === 0}
        aria-busy={busy === "all"}
      >
        {busy === "all" ? "Reanalyzing visible…" : `Reanalyze visible (${visibleIds.length})`}
      </button>
      {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
    </div>
  );
}

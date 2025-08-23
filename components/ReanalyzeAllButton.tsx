"use client";

import React, { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ReanalyzeAllButton({
  category = "all",
  pageSize = 100,
  batchSize = 25,
}: {
  category?: string;
  pageSize?: number;
  batchSize?: number;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const esRef = useRef<EventSource | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [pending, startTransition] = useTransition();

  const closeES = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  };

  const run = useCallback(() => {
    if (running) return;
    setRunning(true);
    setProgress("Starting...");

    const url = `/api/reanalyze?category=${encodeURIComponent(category)}&pageSize=${pageSize}&batchSize=${batchSize}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data || "{}");
        if (data?.type === "start") {
          setProgress(data.message || `Starting (${data.total})...`);
        } else if (data?.type === "progress") {
          const { processed, total, success, failed } = data;
          setProgress(`Processed ${processed}/${total} • Success ${success} • Failed ${failed}`);
        } else if (data?.type === "done") {
          const { processed, total, success, failed } = data;
          setProgress(`Done. Processed ${processed}/${total}. Success ${success}, Failed ${failed}.`);
          closeES();
          setRunning(false);
          setTimeout(() => router.refresh(), 600);
        } else if (data?.type === "error") {
          setProgress(data.message || "Error");
          closeES();
          setRunning(false);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setProgress("Connection lost.");
      closeES();
      setRunning(false);
    };
  }, [running, category, pageSize, batchSize, router]);

  const cancel = useCallback(() => {
    closeES();
    setRunning(false);
    setProgress("Cancelled.");
  }, []);

  const openConfirm = () => {
    setConfirmOpen(true);
    dialogRef.current?.showModal();
  };
  const closeConfirm = () => {
    setConfirmOpen(false);
    dialogRef.current?.close();
  };
  const onConfirm = () => {
    startTransition(async () => {
      try {
        run();
      } finally {
        closeConfirm();
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="px-3 py-2 rounded-md text-sm disabled:opacity-50 bg-violet-600 text-white hover:bg-violet-700 inline-flex items-center gap-1"
        onClick={openConfirm}
        disabled={running}
        aria-busy={running}
        title="Reanalyze all cards across all pages"
      >
        <span aria-hidden>🔁</span>
        {running ? "Reanalyzing all…" : "Reanalyze ALL cards"}
      </button>
      {running && (
        <button
          type="button"
          className="px-2 py-2 rounded-md text-sm bg-rose-600 text-white hover:bg-rose-700"
          onClick={cancel}
          title="Cancel reanalysis"
        >
          <span aria-hidden>✖️</span> Cancel
        </button>
      )}
      {progress && <span className="text-xs text-muted-foreground">{progress}</span>}

      {/* Confirm dialog */}
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-0 w-[420px] max-w-[92vw] backdrop:bg-black/40"
      >
        <div className="p-4 space-y-3">
          <div className="text-base font-medium">Reanalyze ALL cards?</div>
          <div className="text-sm text-muted-foreground">
            This will re-run AI analysis for all pages in the {category === "all" ? "current default" : category} category.
            It may overwrite names, stats, and pricing. Proceed?
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeConfirm}
              className="h-8 px-3 rounded border text-sm"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="h-8 px-3 rounded text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              disabled={pending}
            >
              {pending ? "Starting…" : "Confirm"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

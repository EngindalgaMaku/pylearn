"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

export type UploadResult = {
  createdIds: string[];
  errors?: Array<{ fileName: string; message: string }>
};

export type CategoryOption = { name: string; slug: string };

export default function BulkUploadClient({
  categories,
  defaultCategory = "anime-collection",
  onUpload,
}: {
  categories: CategoryOption[];
  defaultCategory?: string;
  onUpload: (formData: FormData) => Promise<UploadResult>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [analyzeAfter, setAnalyzeAfter] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Array<{ fileName: string; message: string }>>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const f = Array.from(dt.files).filter((x) => x.type.startsWith("image/"));
    if (f.length) setFiles((prev) => [...prev, ...f]);
  }, []);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []).filter((x) => x.type.startsWith("image/"));
    if (f.length) setFiles((prev) => [...prev, ...f]);
  }, []);

  const removeAt = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const clearAll = () => setFiles([]);

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f), size: f.size })),
    [files]
  );

  const importAll = async () => {
    if (!category || files.length === 0) return;
    setIsImporting(true);
    setStatus("Uploading files…");
    setErrors([]);

    try {
      const fd = new FormData();
      fd.set("uploadCategory", category);
      for (const f of files) fd.append("images", f);
      if (analyzeAfter) fd.set("analyzeAfter", "on");

      const result = await onUpload(fd);
      setCreatedIds(result.createdIds || []);

      if ((result.errors?.length || 0) > 0) setErrors(result.errors || []);

      if (analyzeAfter && (result.createdIds?.length || 0) > 0) {
        setStatus("Analyzing " + result.createdIds.length + " card(s)…");
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bulkAnalysis: true, cardIds: result.createdIds, forceReAnalysis: true }),
          });
          if (!res.ok) throw new Error("Analyze request failed");
          setStatus("Analysis completed");
          // Clear selection after successful upload + analysis
          clearAll();
          if (inputRef.current) inputRef.current.value = "";
        } catch (err: any) {
          setStatus("Analyze failed");
          setErrors((prev) => [...prev, { fileName: "(bulk)", message: err?.message || "Analyze failed" }]);
        }
      } else {
        setStatus("Upload completed");
        if ((result.createdIds?.length || 0) > 0) {
          // Clear selection after successful upload (no analysis path)
          clearAll();
          if (inputRef.current) inputRef.current.value = "";
        }
      }
    } catch (err: any) {
      setStatus("Upload failed");
      setErrors([{ fileName: "(all)", message: err?.message || "Upload failed" }]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-md px-3 py-2"
            aria-label="Category"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-1 lg:col-span-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onDrop}
            className="border border-dashed rounded-md p-4 text-center cursor-pointer bg-muted/20 hover:bg-muted/30"
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
          >
            <div className="text-sm">Drag & drop images here, or click to select</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              JPEG recommended. We resize to max 800x1200 and generate 300px thumbnails.
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onSelect}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="accent-indigo-600"
              checked={analyzeAfter}
              onChange={(e) => setAnalyzeAfter(e.target.checked)}
              aria-label="Analyze after upload"
            />
            Analyze after upload
          </label>
          <button
            className="px-3 py-2 rounded-md border w-full disabled:opacity-50"
            onClick={importAll}
            disabled={isImporting || files.length === 0 || !category}
          >
            {isImporting ? "Importing…" : `Import${files.length ? ` (${files.length})` : ""}`}
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{files.length} file(s) selected</div>
            <button className="text-xs underline" onClick={clearAll}>Clear all</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {previews.map((p, idx) => (
              <div key={p.url} className="relative border rounded-md overflow-hidden bg-background">
                <img src={p.url} alt={p.name} className="w-full h-32 object-cover" />
                <div className="p-2 text-[11px] truncate">{p.name}</div>
                <button
                  className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
                  onClick={() => removeAt(idx)}
                  aria-label={`Remove ${p.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {status && <div className="text-sm">{status}</div>}
      {createdIds.length > 0 && (
        <div className="text-xs text-muted-foreground">Created {createdIds.length} card(s)</div>
      )}
      {errors.length > 0 && (
        <div className="text-xs text-red-600 space-y-1">
          {errors.map((e, i) => (
            <div key={i}>{e.fileName}: {e.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}

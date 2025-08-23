"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ImagePreview({
  src,
  thumbSrc,
  alt,
  size = 64,
}: {
  src: string;
  thumbSrc?: string;
  alt?: string;
  size?: number; // thumbnail square size in px
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbSrc || src}
        alt={alt || "image"}
        width={size}
        height={size}
        className="rounded object-cover cursor-zoom-in"
        style={{ width: size, height: size }}
        onClick={() => setOpen(true)}
      />

      {/* Modal via portal to avoid clipping by overflow parents */}
      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  aria-label="Close image"
                  className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white text-black border shadow"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
                <div className="max-h-[85vh] max-w-[95vw]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={alt || "image"} className="h-full w-full object-contain rounded" />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

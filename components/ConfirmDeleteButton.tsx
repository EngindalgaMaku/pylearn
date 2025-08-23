"use client";
import React, { useRef, useState, useTransition } from "react";

type Props = {
  action: () => Promise<void>;
  title?: string;
  description?: string;
};

export default function ConfirmDeleteButton({ action, title = "Delete item", description = "This action cannot be undone." }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onOpen = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };
  const onClose = () => {
    setOpen(false);
    dialogRef.current?.close();
  };

  const onConfirm = () => {
    startTransition(async () => {
      try {
        await action();
      } finally {
        onClose();
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        title="Delete"
        className="inline-flex h-8 w-8 items-center justify-center rounded border text-red-600 hover:bg-red-50"
        aria-label="Delete"
      >
        {/* Icon-only button: simple trash glyph */}
        <span aria-hidden>🗑️</span>
      </button>
      <dialog ref={dialogRef} className="rounded-lg p-0 w-[360px] max-w-[90vw]">
        <div className="p-4 space-y-3">
          <div className="text-base font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded border text-sm"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="h-8 px-3 rounded border text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              disabled={pending}
            >
              {pending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

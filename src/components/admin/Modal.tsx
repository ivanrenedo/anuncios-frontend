"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[88vh] w-full overflow-y-auto rounded-2xl bg-surface-lowest p-6 shadow-card ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-container"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const openPanels = new Set<HTMLDivElement>();
let pageOverflow = "";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const isTopmost = () =>
      Array.from(document.querySelectorAll('[role="dialog"]')).at(-1) === panel;
    if (isTopmost()) panel.focus();
    if (openPanels.size === 0) pageOverflow = document.body.style.overflow;
    openPanels.add(panel);
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTopmost()) return;
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === panelRef.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || document.activeElement === panelRef.current)
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openPanels.delete(panel);
      if (openPanels.size === 0) document.body.style.overflow = pageOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="sheet-panel relative z-10 max-h-[90dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-md outline-none sm:rounded-(--radius-lg)"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-(--color-border) bg-(--color-surface) px-5 py-4 sm:px-8">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="icon-button shrink-0 text-(--color-text-muted) hover:bg-(--color-surface-2)"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

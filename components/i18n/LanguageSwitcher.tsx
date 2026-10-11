"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, type LocaleCode } from "@/lib/i18n";
import { usePreferences } from "@/components/providers/preferences-provider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = usePreferences();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (code: LocaleCode) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className="inline-flex items-center gap-2 rounded-xl border border-(--color-border) bg-(--color-surface-2)/70 px-3 py-1.5 text-xs font-semibold text-(--color-text) backdrop-blur-md transition hover:border-(--color-border-hover) hover:bg-(--color-surface-2) active:scale-[0.98]"
      >
        <Globe size={14} className="text-(--color-accent)" aria-hidden="true" />
        <span className="font-bold">{current.nativeLabel}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`text-(--color-text-muted) transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-2xl border border-(--color-border) bg-(--color-surface) p-1.5 shadow-xl ring-1 ring-black/10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase">
            Select Language (10 Available)
          </div>
          <div className="max-h-72 space-y-0.5 overflow-y-auto pr-0.5">
            {LOCALES.map((l) => {
              const isSelected = l.code === locale;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(l.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-(--color-accent) text-white font-bold"
                      : "text-(--color-text) hover:bg-(--color-surface-2)"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{l.nativeLabel}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? "text-white/80" : "text-(--color-text-muted)"
                      }`}
                    >
                      {l.label}
                    </span>
                  </div>
                  {isSelected && <Check size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

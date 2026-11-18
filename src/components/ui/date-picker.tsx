"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DAY_NAMES_ID,
  MONTH_NAMES_ID,
  buildMonthGrid,
  formatId,
  isPast,
  parseIso,
  toIso,
  todayLocal,
} from "@/lib/calendar";

// noir-debt: grid kalender sengaja tanpa roving-tabindex / ARIA grid penuh
// (cek WAI-ARIA pattern bila a11y reviewer menuntut operasi keyboard penuh).
export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal…",
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [today] = useState(todayLocal);

  const initial = parseIso(value) ?? today;
  const [view, setView] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  const cells = buildMonthGrid(view.year, view.month);
  const canGoPrev =
    view.year > today.getFullYear() ||
    (view.year === today.getFullYear() && view.month > today.getMonth());

  function shift(delta: number) {
    setView((v) => {
      const m = v.month + delta;
      const year = v.year + Math.floor(m / 12);
      const month = ((m % 12) + 12) % 12;
      return { year, month };
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => (open ? close() : setOpen(true))}
        className="flex w-full items-center justify-between gap-2 rounded border-2 border-ink bg-surface px-3 py-2 text-left text-sm text-ink"
      >
        <span className={value ? "text-ink" : "text-muted/60"}>
          {value ? formatId(value) : placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className="h-4 w-4 shrink-0 text-ink"
        >
          <rect
            x="2"
            y="3"
            width="12"
            height="11"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 1.5v3M11 1.5v3M2.5 6h11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={`${id}-panel`}
          role="dialog"
          aria-label="Pilih tanggal"
          onKeyDown={onKeyDown}
          className="absolute z-50 mt-1 w-[17rem] rounded border-2 border-ink bg-surface p-3 shadow-hard"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shift(-1)}
              disabled={!canGoPrev}
              aria-label="Bulan sebelumnya"
              className="flex h-7 w-7 items-center justify-center rounded border-2 border-ink text-ink disabled:opacity-30"
            >
              ‹
            </button>
            <span className="font-display text-sm font-semibold text-ink">
              {MONTH_NAMES_ID[view.month]} {view.year}
            </span>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Bulan berikutnya"
              className="flex h-7 w-7 items-center justify-center rounded border-2 border-ink text-ink"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES_ID.map((d) => (
              <span
                key={d}
                className="text-center text-xs font-semibold text-muted"
              >
                {d}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const iso = toIso(d);
              const disabled = isPast(d, today);
              const isSelected = value === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  aria-current={isSelected ? "date" : undefined}
                  onClick={() => {
                    onChange(iso);
                    close();
                  }}
                  className={`h-8 text-sm ${
                    disabled
                      ? "text-muted/30"
                      : isSelected
                        ? "bg-sun font-semibold text-ink"
                        : "text-ink hover:bg-wash"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

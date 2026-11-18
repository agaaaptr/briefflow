"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Select-only combobox (WAI-ARIA). Dua mode:
 * - controlled: beri `value` + `onChange` (dipakai form publik).
 * - uncontrolled: beri `name` + `defaultValue` → render hidden input dengan
 *   `name` tersebut, sehingga GET form / server action tetap menerima nilai.
 */
export function Select({
  name,
  value,
  defaultValue,
  options,
  placeholder = "Pilih…",
  onChange,
  "aria-label": ariaLabel,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  "aria-label"?: string;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [typeahead, setTypeahead] = useState("");

  const selected = value ?? internal;
  const currentIndex = useMemo(() => {
    const i = options.findIndex((o) => o.value === selected);
    return i < 0 ? -1 : i;
  }, [options, selected]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function choose(v: string) {
    setInternal(v);
    onChange?.(v);
    setOpen(false);
  }

  function openList() {
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter" ||
        e.key === " "
      ) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (options[activeIndex]) choose(options[activeIndex].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1) {
          const q = (typeahead + e.key.toLowerCase()).slice(-8);
          setTypeahead(q);
          const match = options.findIndex((o) =>
            o.label.toLowerCase().startsWith(q),
          );
          if (match >= 0) setActiveIndex(match);
        }
    }
  }

  const label =
    options.find((o) => o.value === selected)?.label ?? placeholder;

  return (
    <div ref={rootRef} className="relative">
      {name && !onChange && (
        <input type="hidden" name={name} value={selected} />
      )}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded border-2 border-ink bg-surface px-3 py-1.5 text-left text-sm text-ink"
      >
        <span className="truncate">{label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className={`h-3.5 w-3.5 shrink-0 text-ink transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border-2 border-ink bg-surface shadow-hard-sm"
        >
          {options.map((o, i) => {
            const isSelected = o.value === selected;
            const isActive = i === activeIndex;
            return (
              <li
                key={o.value}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o.value);
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                  isActive ? "bg-wash" : ""
                } ${isSelected ? "font-semibold" : ""}`}
              >
                <span>{o.label}</span>
                {isSelected && (
                  <span aria-hidden="true" className="text-ink">
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

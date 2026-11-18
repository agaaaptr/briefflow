export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded border-2 font-semibold transition-[transform,box-shadow] disabled:pointer-events-none disabled:opacity-60";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "border-ink bg-sun text-ink shadow-hard-sm hover:bg-sun-deep active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
  secondary:
    "border-ink bg-surface text-ink hover:bg-wash active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "sm",
  extra = "",
) {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${extra}`.trim();
}

export const inputClass =
  "w-full rounded border-2 border-ink bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60";

export const labelClass = "mb-1.5 block text-sm font-medium text-ink";

export const cardClass = "rounded border-2 border-ink bg-surface";

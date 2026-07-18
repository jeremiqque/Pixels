"use client"

export type AppMode = "dither" | "shape"

const MODES: { value: AppMode; label: string }[] = [
  { value: "dither", label: "Dither" },
  { value: "shape", label: "Shape" },
]

interface ModeTabsProps {
  mode: AppMode
  onChange: (m: AppMode) => void
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  return (
    <div className="flex shrink-0 border-b border-border">
      {MODES.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={
            "flex-1 px-3 py-2.5 text-[9px] tracking-[0.2em] uppercase transition-colors " +
            (mode === m.value
              ? "border-b-2 border-foreground text-foreground -mb-px"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

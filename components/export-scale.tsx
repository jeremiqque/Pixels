"use client"

const SCALES = [1, 2, 3, 4]

interface ExportScaleProps {
  value: number
  onChange: (v: number) => void
}

export function ExportScale({ value, onChange }: ExportScaleProps) {
  return (
    <div className="flex w-full">
      {SCALES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={
            "flex-1 border-y border-r py-1.5 text-[9px] tracking-[0.15em] uppercase transition-colors first:border-l " +
            (value === s
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:text-foreground")
          }
        >
          {s}×
        </button>
      ))}
    </div>
  )
}

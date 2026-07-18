export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="shrink-0 text-[9px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

export function ControlRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[9px] tracking-[0.15em] text-foreground/60 uppercase">
          {label}
        </span>
        {value && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

"use client"

import { PALETTES } from "@/lib/palettes"

interface PalettePickerProps {
  darkColor: string
  lightColor: string
  onSelect: (dark: string, light: string) => void
}

export function PalettePicker({ darkColor, lightColor, onSelect }: PalettePickerProps) {
  return (
    <div className="grid grid-cols-4 gap-1">
      {PALETTES.map((p) => {
        const active =
          p.dark.toLowerCase() === darkColor.toLowerCase() &&
          p.light.toLowerCase() === lightColor.toLowerCase()
        return (
          <button
            key={p.name}
            type="button"
            title={p.name}
            onClick={() => onSelect(p.dark, p.light)}
            className={
              "group flex h-6 w-full overflow-hidden border transition-colors " +
              (active ? "border-foreground" : "border-border hover:border-foreground/50")
            }
          >
            <div className="flex-1" style={{ backgroundColor: p.dark }} />
            <div className="flex-1" style={{ backgroundColor: p.light }} />
          </button>
        )
      })}
    </div>
  )
}

export interface Palette {
  name: string
  dark: string
  light: string
}

export const PALETTES: Palette[] = [
  { name: "Mono",     dark: "#000000", light: "#ffffff" },
  { name: "Game Boy", dark: "#0f380f", light: "#9bbc0f" },
  { name: "Amber",    dark: "#1a0a00", light: "#ffb000" },
  { name: "Terminal", dark: "#0d0d0d", light: "#00ff41" },
  { name: "Blueprint",dark: "#0a1628", light: "#4a9eff" },
  { name: "Sepia",    dark: "#2c1810", light: "#f5e6d3" },
  { name: "Rose",     dark: "#1a0010", light: "#ff6eb4" },
  { name: "Arctic",   dark: "#0a1a2e", light: "#a8d8ea" },
  { name: "Rust",     dark: "#1c0a00", light: "#e8652a" },
  { name: "Violet",   dark: "#0d0021", light: "#b388ff" },
  { name: "Khaki",    dark: "#1a1a00", light: "#d4c97a" },
  { name: "Coral",    dark: "#1a0500", light: "#ff6b6b" },
]

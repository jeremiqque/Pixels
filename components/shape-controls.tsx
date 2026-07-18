"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { UploadSimple, DownloadSimple, Eye, EyeSlash } from "@phosphor-icons/react"
import {
  type ShapeStyle,
  type LinesDirection,
  SHAPE_STYLES,
} from "@/lib/shapes"
import { SectionDivider, ControlRow } from "@/components/control-primitives"
import { PalettePicker } from "@/components/palette-picker"
import { ExportScale } from "@/components/export-scale"

export type ShapeControlsProps = {
  style: ShapeStyle
  setStyle: (v: ShapeStyle) => void
  cellSize: number[]
  setCellSize: (v: number[]) => void
  minSize: number[]
  setMinSize: (v: number[]) => void
  maxSize: number[]
  setMaxSize: (v: number[]) => void
  useSourceColor: boolean
  setUseSourceColor: (v: boolean) => void
  fgColor: string
  setFgColor: (v: string) => void
  bgColor: string
  setBgColor: (v: string) => void
  bgTransparent: boolean
  setBgTransparent: (v: boolean) => void
  linesDirection: LinesDirection
  setLinesDirection: (v: LinesDirection) => void
  onUpload: () => void
  onDownload: () => void
  imageUrl: string | null
  showActions?: boolean
  onSliderDragStart?: () => void
  onSliderDragEnd?: () => void
  exportScale?: number
  setExportScale?: (v: number) => void
}

export function ShapeControlsContent({
  style,
  setStyle,
  cellSize,
  setCellSize,
  minSize,
  setMinSize,
  maxSize,
  setMaxSize,
  useSourceColor,
  setUseSourceColor,
  fgColor,
  setFgColor,
  bgColor,
  setBgColor,
  bgTransparent,
  setBgTransparent,
  linesDirection,
  setLinesDirection,
  onUpload,
  onDownload,
  imageUrl,
  showActions = true,
  onSliderDragStart,
  onSliderDragEnd,
  exportScale = 1,
  setExportScale,
}: ShapeControlsProps) {
  const showSizing = style !== "pixel-art" && style !== "lego"

  return (
    <>
      <div className="flex flex-col gap-4 p-4 pb-2">
        <ControlRow label="Style">
          <Select
            value={style}
            onValueChange={(v) => setStyle(v as ShapeStyle)}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHAPE_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-[11px]">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlRow>

        <SectionDivider label="Parameters" />

        <ControlRow label="Cell Size" value={`${cellSize[0]}px`}>
          <Slider
            min={2}
            max={64}
            step={1}
            value={cellSize}
            onValueChange={(v) => { onSliderDragStart?.(); setCellSize(v) }}
            onValueCommit={onSliderDragEnd}
          />
        </ControlRow>

        {showSizing && (
          <>
            <ControlRow label="Min Fill" value={minSize[0].toFixed(2)}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={minSize}
                onValueChange={(v) => { onSliderDragStart?.(); setMinSize(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>

            <ControlRow label="Max Fill" value={maxSize[0].toFixed(2)}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={maxSize}
                onValueChange={(v) => { onSliderDragStart?.(); setMaxSize(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}

        {style === "lines" && (
          <>
            <SectionDivider label="Lines" />
            <ControlRow label="Direction">
              <Select
                value={linesDirection}
                onValueChange={(v) => setLinesDirection(v as LinesDirection)}
              >
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal" className="text-[11px]">Horizontal</SelectItem>
                  <SelectItem value="vertical" className="text-[11px]">Vertical</SelectItem>
                  <SelectItem value="both" className="text-[11px]">Both</SelectItem>
                </SelectContent>
              </Select>
            </ControlRow>
          </>
        )}

        <SectionDivider label="Output" />

        {!useSourceColor && style !== "lego" && (
          <ControlRow label="Palette">
            <PalettePicker
              darkColor={fgColor}
              lightColor={bgColor}
              onSelect={(dark, light) => {
                setFgColor(dark)
                setBgColor(light)
              }}
            />
          </ControlRow>
        )}

        {style !== "lego" && (
          <div className="flex items-center justify-between">
            <Label
              htmlFor="use-source-color"
              className="cursor-pointer text-[9px] tracking-[0.15em] text-foreground/60 uppercase"
            >
              Source Colors
            </Label>
            <Switch
              id="use-source-color"
              checked={useSourceColor}
              onCheckedChange={setUseSourceColor}
            />
          </div>
        )}

        {!useSourceColor && style !== "lego" && (
          <div className="flex items-center gap-2.5">
            <label className="group flex flex-1 cursor-pointer items-center gap-2.5">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden border border-border">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <div className="h-full w-full" style={{ backgroundColor: fgColor }} />
              </div>
              <span className="text-[9px] tracking-[0.15em] text-foreground/60 uppercase">
                Foreground
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground tabular-nums transition-colors group-hover:text-foreground">
                {fgColor.toUpperCase()}
              </span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <label className="group flex flex-1 cursor-pointer items-center gap-2.5">
            <div
              className="relative h-5 w-5 shrink-0 overflow-hidden border border-border"
              style={{
                backgroundImage: bgTransparent
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : undefined,
                backgroundSize: bgTransparent ? "6px 6px" : undefined,
                backgroundPosition: bgTransparent
                  ? "0 0, 0 3px, 3px -3px, -3px 0px"
                  : undefined,
              }}
            >
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div
                className="h-full w-full"
                style={{ backgroundColor: bgColor, opacity: bgTransparent ? 0 : 1 }}
              />
            </div>
            <span className="text-[9px] tracking-[0.15em] text-foreground/60 uppercase">
              Background
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground tabular-nums transition-colors group-hover:text-foreground">
              {bgColor.toUpperCase()}
            </span>
          </label>
          <button
            type="button"
            onClick={() => setBgTransparent(!bgTransparent)}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            title={bgTransparent ? "Background: transparent" : "Background: opaque"}
          >
            {bgTransparent ? (
              <EyeSlash size={13} weight="regular" />
            ) : (
              <Eye size={13} weight="regular" />
            )}
          </button>
        </div>
      </div>

      {showActions && (
        <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
          {setExportScale && (
            <ControlRow label="Export Size">
              <ExportScale value={exportScale} onChange={setExportScale} />
            </ControlRow>
          )}
          <Button
            variant="default"
            className="h-8 w-full gap-2 text-[11px] tracking-[0.05em] uppercase"
            onClick={onDownload}
            disabled={!imageUrl}
          >
            <DownloadSimple size={12} weight="regular" />
            Download PNG
          </Button>
          <Button
            variant="outline"
            className="h-8 w-full gap-2 text-[11px] tracking-[0.05em] uppercase"
            onClick={onUpload}
          >
            <UploadSimple size={12} weight="regular" />
            Upload Image
          </Button>
          <p className="text-center text-[9px] tracking-wider text-muted-foreground/50">
            or paste · drag & drop
          </p>
        </div>
      )}
    </>
  )
}

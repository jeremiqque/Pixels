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
import { UploadSimple, DownloadSimple } from "@phosphor-icons/react"
import { type ShaderEffect, SHADER_EFFECTS } from "@/lib/shaders"
import { SectionDivider, ControlRow } from "@/components/control-primitives"
import { ExportScale } from "@/components/export-scale"

export type ShaderControlsProps = {
  effect: ShaderEffect
  setEffect: (v: ShaderEffect) => void
  intensity: number[]
  setIntensity: (v: number[]) => void
  blurRadius: number[]
  setBlurRadius: (v: number[]) => void
  glitchSlices: number[]
  setGlitchSlices: (v: number[]) => void
  glitchDisplace: number[]
  setGlitchDisplace: (v: number[]) => void
  chromaticOffset: number[]
  setChromaticOffset: (v: number[]) => void
  noiseAmount: number[]
  setNoiseAmount: (v: number[]) => void
  noiseAnimated: boolean
  setNoiseAnimated: (v: boolean) => void
  vignetteSize: number[]
  setVignetteSize: (v: number[]) => void
  vignetteSoftness: number[]
  setVignetteSoftness: (v: number[]) => void
  onUpload: () => void
  onDownload: () => void
  imageUrl: string | null
  showActions?: boolean
  onSliderDragStart?: () => void
  onSliderDragEnd?: () => void
  exportScale?: number
  setExportScale?: (v: number) => void
}

export function ShaderControlsContent({
  effect,
  setEffect,
  intensity,
  setIntensity,
  blurRadius,
  setBlurRadius,
  glitchSlices,
  setGlitchSlices,
  glitchDisplace,
  setGlitchDisplace,
  chromaticOffset,
  setChromaticOffset,
  noiseAmount,
  setNoiseAmount,
  noiseAnimated,
  setNoiseAnimated,
  vignetteSize,
  setVignetteSize,
  vignetteSoftness,
  setVignetteSoftness,
  onUpload,
  onDownload,
  imageUrl,
  showActions = true,
  onSliderDragStart,
  onSliderDragEnd,
  exportScale = 1,
  setExportScale,
}: ShaderControlsProps) {
  return (
    <>
      <div className="flex flex-col gap-4 p-4 pb-2">
        <ControlRow label="Effect">
          <Select
            value={effect}
            onValueChange={(v) => setEffect(v as ShaderEffect)}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHADER_EFFECTS.map((e) => (
                <SelectItem key={e.value} value={e.value} className="text-[11px]">
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlRow>

        <SectionDivider label="Parameters" />

        <ControlRow label="Intensity" value={intensity[0].toFixed(2)}>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={intensity}
            onValueChange={(v) => { onSliderDragStart?.(); setIntensity(v) }}
            onValueCommit={onSliderDragEnd}
          />
        </ControlRow>

        {effect === "blur" && (
          <ControlRow label="Radius" value={`${blurRadius[0]}px`}>
            <Slider
              min={1}
              max={20}
              step={1}
              value={blurRadius}
              onValueChange={(v) => { onSliderDragStart?.(); setBlurRadius(v) }}
              onValueCommit={onSliderDragEnd}
            />
          </ControlRow>
        )}

        {effect === "glitch" && (
          <>
            <ControlRow label="Slices" value={String(glitchSlices[0])}>
              <Slider
                min={2}
                max={20}
                step={1}
                value={glitchSlices}
                onValueChange={(v) => { onSliderDragStart?.(); setGlitchSlices(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Displace" value={`${glitchDisplace[0]}px`}>
              <Slider
                min={1}
                max={40}
                step={1}
                value={glitchDisplace}
                onValueChange={(v) => { onSliderDragStart?.(); setGlitchDisplace(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}

        {effect === "chromatic" && (
          <ControlRow label="Offset" value={`${chromaticOffset[0]}px`}>
            <Slider
              min={1}
              max={20}
              step={1}
              value={chromaticOffset}
              onValueChange={(v) => { onSliderDragStart?.(); setChromaticOffset(v) }}
              onValueCommit={onSliderDragEnd}
            />
          </ControlRow>
        )}

        {effect === "noise" && (
          <>
            <ControlRow label="Amount" value={noiseAmount[0].toFixed(2)}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={noiseAmount}
                onValueChange={(v) => { onSliderDragStart?.(); setNoiseAmount(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="noise-animated"
                className="cursor-pointer text-[9px] tracking-[0.15em] text-foreground/60 uppercase"
              >
                Animated
              </Label>
              <Switch
                id="noise-animated"
                checked={noiseAnimated}
                onCheckedChange={setNoiseAnimated}
              />
            </div>
          </>
        )}

        {effect === "vignette" && (
          <>
            <ControlRow label="Size" value={vignetteSize[0].toFixed(2)}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={vignetteSize}
                onValueChange={(v) => { onSliderDragStart?.(); setVignetteSize(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Softness" value={vignetteSoftness[0].toFixed(2)}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={vignetteSoftness}
                onValueChange={(v) => { onSliderDragStart?.(); setVignetteSoftness(v) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}
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

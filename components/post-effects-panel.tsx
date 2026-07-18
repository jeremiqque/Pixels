"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SectionDivider, ControlRow } from "@/components/control-primitives"
import { type PostEffectsConfig } from "@/lib/shaders"

interface PostEffectsPanelProps {
  config: PostEffectsConfig
  onChange: (config: PostEffectsConfig) => void
  onSliderDragStart?: () => void
  onSliderDragEnd?: () => void
}

function EffectToggle({
  id,
  label,
  enabled,
  onToggle,
}: {
  id: string
  label: string
  enabled: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label
        htmlFor={id}
        className="cursor-pointer text-[9px] tracking-[0.15em] text-foreground/60 uppercase"
      >
        {label}
      </Label>
      <Switch id={id} checked={enabled} onCheckedChange={onToggle} />
    </div>
  )
}

export function PostEffectsPanel({
  config,
  onChange,
  onSliderDragStart,
  onSliderDragEnd,
}: PostEffectsPanelProps) {
  const set = <K extends keyof PostEffectsConfig>(
    key: K,
    patch: Partial<PostEffectsConfig[K]>
  ) => onChange({ ...config, [key]: { ...config[key], ...patch } })

  return (
    <div className="flex flex-col gap-4 p-4 pt-2">
      <SectionDivider label="Post Effects" />

      {/* Blur */}
      <div className="flex flex-col gap-2.5">
        <EffectToggle
          id="fx-blur"
          label="Blur"
          enabled={config.blur.enabled}
          onToggle={(v) => set("blur", { enabled: v })}
        />
        {config.blur.enabled && (
          <>
            <ControlRow label="Intensity" value={config.blur.intensity.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.blur.intensity]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("blur", { intensity: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Radius" value={`${config.blur.radius}px`}>
              <Slider
                min={1} max={20} step={1}
                value={[config.blur.radius]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("blur", { radius: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}
      </div>

      {/* Noise */}
      <div className="flex flex-col gap-2.5">
        <EffectToggle
          id="fx-noise"
          label="Noise"
          enabled={config.noise.enabled}
          onToggle={(v) => set("noise", { enabled: v })}
        />
        {config.noise.enabled && (
          <>
            <ControlRow label="Intensity" value={config.noise.intensity.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.noise.intensity]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("noise", { intensity: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Amount" value={config.noise.amount.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.noise.amount]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("noise", { amount: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <div className="flex items-center justify-between">
              <Label
                htmlFor="fx-noise-animated"
                className="cursor-pointer text-[9px] tracking-[0.15em] text-foreground/60 uppercase"
              >
                Animated
              </Label>
              <Switch
                id="fx-noise-animated"
                checked={config.noise.animated}
                onCheckedChange={(v) => set("noise", { animated: v })}
              />
            </div>
          </>
        )}
      </div>

      {/* Vignette */}
      <div className="flex flex-col gap-2.5">
        <EffectToggle
          id="fx-vignette"
          label="Vignette"
          enabled={config.vignette.enabled}
          onToggle={(v) => set("vignette", { enabled: v })}
        />
        {config.vignette.enabled && (
          <>
            <ControlRow label="Intensity" value={config.vignette.intensity.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.vignette.intensity]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("vignette", { intensity: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Size" value={config.vignette.size.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.vignette.size]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("vignette", { size: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Softness" value={config.vignette.softness.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.vignette.softness]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("vignette", { softness: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}
      </div>

      {/* Chromatic Aberration */}
      <div className="flex flex-col gap-2.5">
        <EffectToggle
          id="fx-chromatic"
          label="Chromatic Aberration"
          enabled={config.chromatic.enabled}
          onToggle={(v) => set("chromatic", { enabled: v })}
        />
        {config.chromatic.enabled && (
          <>
            <ControlRow label="Intensity" value={config.chromatic.intensity.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.chromatic.intensity]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("chromatic", { intensity: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Offset" value={`${config.chromatic.offset}px`}>
              <Slider
                min={1} max={20} step={1}
                value={[config.chromatic.offset]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("chromatic", { offset: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}
      </div>

      {/* Glitch */}
      <div className="flex flex-col gap-2.5">
        <EffectToggle
          id="fx-glitch"
          label="Glitch"
          enabled={config.glitch.enabled}
          onToggle={(v) => set("glitch", { enabled: v })}
        />
        {config.glitch.enabled && (
          <>
            <ControlRow label="Intensity" value={config.glitch.intensity.toFixed(2)}>
              <Slider
                min={0} max={1} step={0.01}
                value={[config.glitch.intensity]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("glitch", { intensity: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Slices" value={String(config.glitch.slices)}>
              <Slider
                min={2} max={20} step={1}
                value={[config.glitch.slices]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("glitch", { slices: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
            <ControlRow label="Displace" value={`${config.glitch.displace}px`}>
              <Slider
                min={1} max={40} step={1}
                value={[config.glitch.displace]}
                onValueChange={([v]) => { onSliderDragStart?.(); set("glitch", { displace: v }) }}
                onValueCommit={onSliderDragEnd}
              />
            </ControlRow>
          </>
        )}
      </div>
    </div>
  )
}

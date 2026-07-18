export type ShaderEffect =
  | "blur"
  | "glitch"
  | "chromatic"
  | "noise"
  | "vignette"

export interface PostEffectsConfig {
  blur:     { enabled: boolean; radius: number; intensity: number }
  noise:    { enabled: boolean; amount: number; intensity: number; animated: boolean }
  vignette: { enabled: boolean; size: number; softness: number; intensity: number }
  chromatic:{ enabled: boolean; offset: number; intensity: number }
  glitch:   { enabled: boolean; slices: number; displace: number; intensity: number }
}

export const DEFAULT_POST_EFFECTS: PostEffectsConfig = {
  blur:     { enabled: false, radius: 4,   intensity: 0.5 },
  noise:    { enabled: false, amount: 0.3, intensity: 0.5, animated: false },
  vignette: { enabled: false, size: 0.5,   softness: 0.5, intensity: 0.8 },
  chromatic:{ enabled: false, offset: 5,   intensity: 0.5 },
  glitch:   { enabled: false, slices: 8,   displace: 10,  intensity: 0.5 },
}

export interface ShaderOpts {
  effect: ShaderEffect
  intensity: number
  blurRadius: number
  glitchSlices: number
  glitchDisplace: number
  chromaticOffset: number
  noiseAmount: number
  noiseAnimated: boolean
  vignetteSize: number
  vignetteSoftness: number
  previewScale?: number
}

export const SHADER_EFFECTS: { value: ShaderEffect; label: string }[] = [
  { value: "blur", label: "Blur" },
  { value: "glitch", label: "Glitch" },
  { value: "chromatic", label: "Chromatic Aberration" },
  { value: "noise", label: "Noise" },
  { value: "vignette", label: "Vignette" },
]

function clamp(v: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, v))
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

// Simple LCG for stable noise seeded by pixel position
function lcgRandom(seed: number) {
  const s = (seed * 1664525 + 1013904223) & 0xffffffff
  return (s >>> 0) / 0xffffffff
}

function applyBlur(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
): Uint8ClampedArray {
  const r = Math.max(1, Math.round(radius))
  const tmp = new Float32Array(w * h * 4)
  const dst = new Uint8ClampedArray(w * h * 4)

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0
      for (let dx = -r; dx <= r; dx++) {
        const nx = clamp(x + dx, 0, w - 1)
        const i = (y * w + nx) * 4
        rSum += src[i]
        gSum += src[i + 1]
        bSum += src[i + 2]
        aSum += src[i + 3]
        count++
      }
      const i = (y * w + x) * 4
      tmp[i] = rSum / count
      tmp[i + 1] = gSum / count
      tmp[i + 2] = bSum / count
      tmp[i + 3] = aSum / count
    }
  }

  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0
      for (let dy = -r; dy <= r; dy++) {
        const ny = clamp(y + dy, 0, h - 1)
        const i = (ny * w + x) * 4
        rSum += tmp[i]
        gSum += tmp[i + 1]
        bSum += tmp[i + 2]
        aSum += tmp[i + 3]
        count++
      }
      const i = (y * w + x) * 4
      dst[i] = rSum / count
      dst[i + 1] = gSum / count
      dst[i + 2] = bSum / count
      dst[i + 3] = aSum / count
    }
  }

  return dst
}

function applyGlitch(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  slices: number,
  displace: number,
  intensity: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src)
  const maxDisplace = Math.round(displace * intensity)

  // Generate random slice boundaries
  let y = 0
  const rng = (n: number) => lcgRandom(n * 9301 + 49297)

  for (let s = 0; s < slices && y < h; s++) {
    const sliceH = Math.max(1, Math.round((h / slices) * (0.5 + rng(s) * 1.0)))
    const endY = Math.min(h, y + sliceH)
    const shouldDisplace = rng(s + 100) < intensity
    const swapChannels = rng(s + 200) < 0.2 * intensity

    if (shouldDisplace) {
      const shift = Math.round((rng(s + 300) * 2 - 1) * maxDisplace)
      for (let row = y; row < endY; row++) {
        for (let x = 0; x < w; x++) {
          const srcX = clamp(x - shift, 0, w - 1)
          const di = (row * w + x) * 4
          const si = (row * w + srcX) * 4
          if (swapChannels) {
            dst[di] = src[si + 2]     // R ← B
            dst[di + 1] = src[si + 1] // G stays
            dst[di + 2] = src[si]     // B ← R
          } else {
            dst[di] = src[si]
            dst[di + 1] = src[si + 1]
            dst[di + 2] = src[si + 2]
          }
          dst[di + 3] = src[si + 3]
        }
      }
    }
    y = endY
  }

  return dst
}

function applyChromatic(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  offset: number,
  intensity: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src)
  const shift = Math.round(offset * intensity)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const di = (y * w + x) * 4

      // R channel shifted right
      const rSrcX = clamp(x - shift, 0, w - 1)
      const ri = (y * w + rSrcX) * 4
      dst[di] = src[ri]

      // G channel unchanged
      dst[di + 1] = src[di + 1]

      // B channel shifted left
      const bSrcX = clamp(x + shift, 0, w - 1)
      const bi = (y * w + bSrcX) * 4
      dst[di + 2] = src[bi + 2]

      dst[di + 3] = src[di + 3]
    }
  }

  return dst
}

function applyNoise(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number,
  intensity: number,
  animated: boolean
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src)
  const scale = amount * intensity * 255

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const rand = animated
        ? Math.random()
        : lcgRandom(x * 1234 + y * 5678)
      const n = (rand * 2 - 1) * scale
      dst[i] = clamp(src[i] + n)
      dst[i + 1] = clamp(src[i + 1] + n)
      dst[i + 2] = clamp(src[i + 2] + n)
      dst[i + 3] = src[i + 3]
    }
  }

  return dst
}

function applyVignette(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  size: number,
  softness: number,
  intensity: number
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(src)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w - 0.5
      const ny = y / h - 0.5
      const d = Math.sqrt(nx * nx + ny * ny) * 2

      const factor = smoothstep(size, size + Math.max(0.01, softness), d) * intensity

      const i = (y * w + x) * 4
      dst[i] = clamp(src[i] * (1 - factor))
      dst[i + 1] = clamp(src[i + 1] * (1 - factor))
      dst[i + 2] = clamp(src[i + 2] * (1 - factor))
      dst[i + 3] = src[i + 3]
    }
  }

  return dst
}

export function renderShader(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  opts: ShaderOpts
) {
  const {
    effect,
    intensity,
    blurRadius,
    glitchSlices,
    glitchDisplace,
    chromaticOffset,
    noiseAmount,
    noiseAnimated,
    vignetteSize,
    vignetteSoftness,
    previewScale = 1,
  } = opts

  const origW = img.naturalWidth
  const origH = img.naturalHeight

  // Work at reduced resolution during preview
  const w = Math.max(1, Math.floor(origW * previewScale))
  const h = Math.max(1, Math.floor(origH * previewScale))

  // Draw image at work size onto a temporary canvas
  const work = document.createElement("canvas")
  work.width = w
  work.height = h
  const wCtx = work.getContext("2d")!
  wCtx.drawImage(img, 0, 0, w, h)

  const imageData = wCtx.getImageData(0, 0, w, h)
  const src = imageData.data

  let result: Uint8ClampedArray

  switch (effect) {
    case "blur":
      result = applyBlur(src, w, h, blurRadius * intensity)
      break
    case "glitch":
      result = applyGlitch(src, w, h, glitchSlices, glitchDisplace, intensity)
      break
    case "chromatic":
      result = applyChromatic(src, w, h, chromaticOffset, intensity)
      break
    case "noise":
      result = applyNoise(src, w, h, noiseAmount, intensity, noiseAnimated)
      break
    case "vignette":
      result = applyVignette(src, w, h, vignetteSize, vignetteSoftness, intensity)
      break
    default:
      result = src
  }

  const out = wCtx.createImageData(w, h)
  out.data.set(result)
  wCtx.putImageData(out, 0, 0)

  // Upscale work canvas onto the output canvas at full original size
  canvas.width = origW
  canvas.height = origH
  const ctx = canvas.getContext("2d")!
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(work, 0, 0, origW, origH)
}

// Applies all enabled post-effects in order onto an existing canvas.
// Works at whatever resolution the canvas is currently at (respects previewScale).
export function applyPostEffects(
  canvas: HTMLCanvasElement,
  config: PostEffectsConfig
) {
  const { blur, noise, vignette, chromatic, glitch } = config
  const anyEnabled =
    blur.enabled || noise.enabled || vignette.enabled ||
    chromatic.enabled || glitch.enabled
  if (!anyEnabled) return

  const ctx = canvas.getContext("2d")!
  const w = canvas.width
  const h = canvas.height
  let src = ctx.getImageData(0, 0, w, h).data as Uint8ClampedArray

  // Fixed order: blur → noise → vignette → chromatic → glitch (destructive last)
  if (blur.enabled)
    src = applyBlur(src, w, h, blur.radius * blur.intensity)
  if (noise.enabled)
    src = applyNoise(src, w, h, noise.amount, noise.intensity, noise.animated)
  if (vignette.enabled)
    src = applyVignette(src, w, h, vignette.size, vignette.softness, vignette.intensity)
  if (chromatic.enabled)
    src = applyChromatic(src, w, h, chromatic.offset, chromatic.intensity)
  if (glitch.enabled)
    src = applyGlitch(src, w, h, glitch.slices, glitch.displace, glitch.intensity)

  const out = ctx.createImageData(w, h)
  out.data.set(src)
  ctx.putImageData(out, 0, 0)
}

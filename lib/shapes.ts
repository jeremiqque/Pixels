export type ShapeStyle =
  | "pixel-art"
  | "dot"
  | "lego"
  | "diamond"
  | "lines"
  | "cross"
  | "blocks"

export type LinesDirection = "horizontal" | "vertical" | "both"

export interface ShapeOpts {
  style: ShapeStyle
  cellSize: number
  minSize: number
  maxSize: number
  useSourceColor: boolean
  fgColor: string
  bgColor: string
  bgTransparent: boolean
  linesDirection: LinesDirection
  previewScale?: number
}

export const SHAPE_STYLES: { value: ShapeStyle; label: string }[] = [
  { value: "pixel-art", label: "Pixel Art" },
  { value: "dot", label: "Dot" },
  { value: "lego", label: "Lego" },
  { value: "diamond", label: "Diamond" },
  { value: "lines", label: "Lines" },
  { value: "cross", label: "Cross" },
  { value: "blocks", label: "Blocks" },
]

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToStyle(r: number, g: number, b: number) {
  return `rgb(${r},${g},${b})`
}

export function renderShape(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  opts: ShapeOpts
) {
  const {
    style,
    cellSize,
    minSize,
    maxSize,
    useSourceColor,
    fgColor,
    bgColor,
    bgTransparent,
    linesDirection,
    previewScale = 1,
  } = opts

  const origW = img.naturalWidth
  const origH = img.naturalHeight

  // Work at reduced resolution during preview
  const workW = Math.max(1, Math.floor(origW * previewScale))
  const workH = Math.max(1, Math.floor(origH * previewScale))

  // Number of cells in work space
  const cols = Math.max(1, Math.floor(workW / cellSize))
  const rows = Math.max(1, Math.floor(workH / cellSize))

  // Sample image at cell resolution
  const tmp = document.createElement("canvas")
  tmp.width = cols
  tmp.height = rows
  const tCtx = tmp.getContext("2d")!
  tCtx.drawImage(img, 0, 0, cols, rows)
  const sampleData = tCtx.getImageData(0, 0, cols, rows).data

  // Draw shapes onto a work canvas at reduced size
  const work = document.createElement("canvas")
  work.width = workW
  work.height = workH
  const ctx = work.getContext("2d")!

  // Background
  if (bgTransparent) {
    ctx.clearRect(0, 0, workW, workH)
  } else {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, workW, workH)
  }

  const fg = hexToRgb(fgColor)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const si = (row * cols + col) * 4
      const sr = sampleData[si]
      const sg = sampleData[si + 1]
      const sb = sampleData[si + 2]

      const brightness = (0.299 * sr + 0.587 * sg + 0.114 * sb) / 255
      const sizeFrac = minSize + (1 - brightness) * (maxSize - minSize)

      // Cell top-left in output space
      const cx = col * cellSize + cellSize / 2
      const cy = row * cellSize + cellSize / 2
      const cellX = col * cellSize
      const cellY = row * cellSize

      const fillColor = useSourceColor
        ? rgbToStyle(sr, sg, sb)
        : rgbToStyle(fg.r, fg.g, fg.b)

      ctx.fillStyle = fillColor

      switch (style) {
        case "pixel-art": {
          ctx.fillStyle = rgbToStyle(sr, sg, sb)
          ctx.fillRect(cellX, cellY, cellSize, cellSize)
          break
        }

        case "dot": {
          const radius = (cellSize / 2) * sizeFrac
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, Math.PI * 2)
          ctx.fill()
          break
        }

        case "lego": {
          // Base square
          const padding = 1
          ctx.fillStyle = rgbToStyle(sr, sg, sb)
          ctx.fillRect(
            cellX + padding,
            cellY + padding,
            cellSize - padding * 2,
            cellSize - padding * 2
          )
          // Stud (lighter circle on top)
          const studR = cellSize * 0.28
          const studColor = Math.min(255, sr + 20)
          const studG = Math.min(255, sg + 20)
          const studB = Math.min(255, sb + 20)
          ctx.fillStyle = rgbToStyle(studColor, studG, studB)
          ctx.beginPath()
          ctx.arc(cx, cy - cellSize * 0.05, studR, 0, Math.PI * 2)
          ctx.fill()
          break
        }

        case "diamond": {
          const half = (cellSize / 2) * sizeFrac
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(Math.PI / 4)
          ctx.fillRect(-half, -half, half * 2, half * 2)
          ctx.restore()
          break
        }

        case "lines": {
          const thickness = Math.max(0.5, cellSize * sizeFrac)
          if (linesDirection === "horizontal" || linesDirection === "both") {
            ctx.fillRect(cellX, cy - thickness / 2, cellSize, thickness)
          }
          if (linesDirection === "vertical" || linesDirection === "both") {
            ctx.fillRect(cx - thickness / 2, cellY, thickness, cellSize)
          }
          break
        }

        case "cross": {
          const half = (cellSize / 2) * sizeFrac
          const thickness = Math.max(0.5, half * 0.45)
          // Horizontal bar
          ctx.fillRect(cx - half, cy - thickness / 2, half * 2, thickness)
          // Vertical bar
          ctx.fillRect(cx - thickness / 2, cy - half, thickness, half * 2)
          break
        }

        case "blocks": {
          const pad = ((1 - sizeFrac) * cellSize) / 2
          ctx.fillRect(
            cellX + pad,
            cellY + pad,
            cellSize - pad * 2,
            cellSize - pad * 2
          )
          break
        }
      }
    }
  }

  // Upscale work canvas onto the output canvas at full original size
  canvas.width = origW
  canvas.height = origH
  const outCtx = canvas.getContext("2d")!
  outCtx.imageSmoothingEnabled = false
  outCtx.drawImage(work, 0, 0, origW, origH)
}

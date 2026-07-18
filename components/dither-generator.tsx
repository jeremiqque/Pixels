"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  UploadSimple,
  DownloadSimple,
  Sun,
  Moon,
  SlidersHorizontal,
  XLogo,
  Crop,
  X,
  Check,
} from "@phosphor-icons/react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { type DitherAlgorithm, renderDither } from "@/lib/dither"
import { type ShapeStyle, type LinesDirection, renderShape } from "@/lib/shapes"
import {
  type PostEffectsConfig,
  DEFAULT_POST_EFFECTS,
  applyPostEffects,
} from "@/lib/shaders"
import { ControlsContent } from "@/components/dither-controls"
import { ShapeControlsContent } from "@/components/shape-controls"
import { PostEffectsPanel } from "@/components/post-effects-panel"
import { ModeTabs, type AppMode } from "@/components/mode-tabs"
import { ControlRow } from "@/components/control-primitives"
import { ExportScale } from "@/components/export-scale"

export default function DitherGenerator() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [algorithm, setAlgorithm] = useState<DitherAlgorithm>("floyd-steinberg")
  const [threshold, setThreshold] = useState([128])
  const [ditherStrength, setDitherStrength] = useState([0.5])
  const [scale, setScale] = useState([100])
  const [darkColor, setDarkColor] = useState("#000000")
  const [darkTransparent, setDarkTransparent] = useState(false)
  const [lightColor, setLightColor] = useState("#ffffff")
  const [lightTransparent, setLightTransparent] = useState(false)
  const [preserveColor, setPreserveColor] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<AppMode>("dither")

  // Shape state
  const [shapeStyle, setShapeStyle] = useState<ShapeStyle>("dot")
  const [cellSize, setCellSize] = useState([8])
  const [shapeMinSize, setShapeMinSize] = useState([0.05])
  const [shapeMaxSize, setShapeMaxSize] = useState([1.0])
  const [useSourceColor, setUseSourceColor] = useState(true)
  const [shapeFgColor, setShapeFgColor] = useState("#000000")
  const [shapeBgColor, setShapeBgColor] = useState("#ffffff")
  const [shapeBgTransparent, setShapeBgTransparent] = useState(false)
  const [linesDirection, setLinesDirection] = useState<LinesDirection>("horizontal")

  // Post-effects state (stackable on top of any mode)
  const [postEffects, setPostEffects] = useState<PostEffectsConfig>(DEFAULT_POST_EFFECTS)

  const [exportScale, setExportScale] = useState(1)

  // Preview scale: 0.25 while dragging a slider, 1 on commit
  const [previewScale, setPreviewScale] = useState(1)
  const handleSliderDragStart = useCallback(() => setPreviewScale(0.25), [])
  const handleSliderDragEnd = useCallback(() => setPreviewScale(1), [])

  // Crop state
  const [cropMode, setCropMode] = useState(false)
  const [cropDragging, setCropDragging] = useState(false)
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null)

  const exitCropMode = useCallback(() => {
    setCropMode(false)
    setCropDragging(false)
    setCropStart(null)
    setCropEnd(null)
  }, [])

  const handleCropMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setCropStart(pt)
    setCropEnd(pt)
    setCropDragging(true)
  }, [])

  const handleCropMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [cropDragging])

  const handleCropMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setCropDragging(false)
  }, [cropDragging])

  const applyCrop = useCallback(() => {
    if (!cropStart || !cropEnd || !imgRef.current || !canvasRef.current) return
    const displayRect = canvasRef.current.getBoundingClientRect()
    const scaleX = imgRef.current.naturalWidth / displayRect.width
    const scaleY = imgRef.current.naturalHeight / displayRect.height

    const x1 = Math.round(Math.min(cropStart.x, cropEnd.x) * scaleX)
    const y1 = Math.round(Math.min(cropStart.y, cropEnd.y) * scaleY)
    const x2 = Math.round(Math.max(cropStart.x, cropEnd.x) * scaleX)
    const y2 = Math.round(Math.max(cropStart.y, cropEnd.y) * scaleY)
    const cropW = Math.max(1, x2 - x1)
    const cropH = Math.max(1, y2 - y1)

    const out = document.createElement("canvas")
    out.width = cropW
    out.height = cropH
    out.getContext("2d")!.drawImage(imgRef.current, x1, y1, cropW, cropH, 0, 0, cropW, cropH)
    out.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      setImageUrl(url)
      exitCropMode()
    })
  }, [cropStart, cropEnd, exitCropMode])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!imageUrl) {
      imgRef.current = null
      setImgLoaded(false)
      return
    }
    const img = new window.Image()
    img.onload = () => {
      imgRef.current = img
      setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight })
      setImgLoaded(true)
    }
    img.src = imageUrl
  }, [imageUrl])

  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !canvasRef.current) return
    if (mode === "dither") {
      renderDither(imgRef.current, canvasRef.current, {
        algorithm,
        threshold: threshold[0],
        strength: ditherStrength[0],
        darkColor,
        lightColor,
        preserveColor,
        scale: scale[0],
        darkTransparent,
        lightTransparent,
        previewScale,
      })
    } else if (mode === "shape") {
      renderShape(imgRef.current, canvasRef.current, {
        style: shapeStyle,
        cellSize: cellSize[0],
        minSize: shapeMinSize[0],
        maxSize: shapeMaxSize[0],
        useSourceColor,
        fgColor: shapeFgColor,
        bgColor: shapeBgColor,
        bgTransparent: shapeBgTransparent,
        linesDirection,
        previewScale,
      })
    }
    applyPostEffects(canvasRef.current, postEffects)
  }, [
    imgLoaded, mode, previewScale,
    algorithm, threshold, ditherStrength, darkColor, darkTransparent,
    lightColor, lightTransparent, preserveColor, scale,
    shapeStyle, cellSize, shapeMinSize, shapeMaxSize, useSourceColor,
    shapeFgColor, shapeBgColor, shapeBgTransparent, linesDirection,
    postEffects,
  ])

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) setImageUrl(e.target.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ""
  }, [handleFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDownload = useCallback(() => {
    const src = canvasRef.current
    if (!src) return
    const w = src.width * exportScale
    const h = src.height * exportScale
    const out = document.createElement("canvas")
    out.width = w
    out.height = h
    const ctx = out.getContext("2d")!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(src, 0, 0, w, h)
    out.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pixels-${exportScale}x.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [exportScale])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      )
      if (item) handleFileSelect(item.getAsFile()!)
    }
    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [handleFileSelect])

  // Derived crop selection rect (in display px)
  const cropRect = cropStart && cropEnd ? {
    x: Math.min(cropStart.x, cropEnd.x),
    y: Math.min(cropStart.y, cropEnd.y),
    w: Math.abs(cropEnd.x - cropStart.x),
    h: Math.abs(cropEnd.y - cropStart.y),
  } : null
  const hasCropSelection = cropRect && cropRect.w > 4 && cropRect.h > 4

  const shapeControlProps = {
    style: shapeStyle, setStyle: setShapeStyle,
    cellSize, setCellSize,
    minSize: shapeMinSize, setMinSize: setShapeMinSize,
    maxSize: shapeMaxSize, setMaxSize: setShapeMaxSize,
    useSourceColor, setUseSourceColor,
    fgColor: shapeFgColor, setFgColor: setShapeFgColor,
    bgColor: shapeBgColor, setBgColor: setShapeBgColor,
    bgTransparent: shapeBgTransparent, setBgTransparent: setShapeBgTransparent,
    linesDirection, setLinesDirection,
    onUpload: () => fileInputRef.current?.click(),
    onDownload: handleDownload,
    imageUrl, showActions: false,
    onSliderDragStart: handleSliderDragStart,
    onSliderDragEnd: handleSliderDragEnd,
  }

  const sharedControlProps = {
    algorithm, setAlgorithm,
    threshold, setThreshold,
    ditherStrength, setDitherStrength,
    scale, setScale,
    preserveColor, setPreserveColor,
    darkColor, setDarkColor,
    darkTransparent, setDarkTransparent,
    lightColor, setLightColor,
    lightTransparent, setLightTransparent,
    onUpload: () => fileInputRef.current?.click(),
    onDownload: handleDownload,
    imageUrl, fileInputRef, showActions: false,
    onSliderDragStart: handleSliderDragStart,
    onSliderDragEnd: handleSliderDragEnd,
  }

  const postEffectsPanelProps = {
    config: postEffects,
    onChange: setPostEffects,
    onSliderDragStart: handleSliderDragStart,
    onSliderDragEnd: handleSliderDragEnd,
  }

  const actionsSection = (
    <div className="shrink-0 border-t border-border p-4 flex flex-col gap-2">
      <ControlRow label="Export Size">
        <ExportScale value={exportScale} onChange={setExportScale} />
      </ControlRow>
      {imageUrl && (
        <Button
          variant="outline"
          className={cn(
            "h-8 w-full gap-2 text-[11px] tracking-[0.05em] uppercase",
            cropMode && "border-foreground text-foreground"
          )}
          onClick={() => cropMode ? exitCropMode() : setCropMode(true)}
        >
          <Crop size={12} weight="regular" />
          {cropMode ? "Cancel Crop" : "Crop Image"}
        </Button>
      )}
      <Button
        variant="default"
        className="h-8 w-full gap-2 text-[11px] tracking-[0.05em] uppercase"
        onClick={handleDownload}
        disabled={!imageUrl}
      >
        <DownloadSimple size={12} weight="regular" />
        Download PNG
      </Button>
      <Button
        variant="outline"
        className="h-8 w-full gap-2 text-[11px] tracking-[0.05em] uppercase"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadSimple size={12} weight="regular" />
        Upload Image
      </Button>
      <p className="text-center text-[9px] tracking-wider text-muted-foreground/50">
        or paste · drag & drop
      </p>
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="-1.5 -1.5 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M1.24108 5.52029e-05C1.28428 -0.00119681 1.41842 0.0190018 1.53894 0.0449771C1.65948 0.0709653 1.82164 0.129809 1.89929 0.175836C1.9769 0.222161 2.10148 0.324149 2.17663 0.402399C2.25209 0.480677 2.3328 0.579893 2.35534 0.623102C2.39569 0.700674 2.39365 0.703264 2.05358 0.874079C1.86509 0.968638 1.7105 1.05655 1.71081 1.06939C1.71085 1.08222 1.8487 1.08425 2.01647 1.0733C2.25252 1.05764 2.37869 1.06557 2.57214 1.10845C2.70987 1.13913 2.88605 1.19116 2.96374 1.22466C3.04139 1.25848 3.18102 1.33849 3.27526 1.40142C3.36908 1.46428 3.51455 1.58585 3.59851 1.67193C3.7369 1.81346 3.74794 1.81928 3.71569 1.73443C3.69532 1.68152 3.53981 1.36162 3.36901 1.02252C3.19942 0.685805 3.06019 0.402447 3.05749 0.388727C3.05749 0.379973 3.12438 0.343314 3.20593 0.307672C3.28762 0.271679 3.46073 0.221052 3.58972 0.195368C3.74904 0.163441 3.90511 0.154892 4.07507 0.168024C4.2128 0.17898 4.42766 0.222444 4.55261 0.264704C4.6775 0.306959 4.8602 0.38737 4.95886 0.443415C5.0578 0.499462 5.21652 0.6182 5.3114 0.708063C5.40646 0.797501 5.49468 0.871012 5.50769 0.872126C5.52052 0.872752 5.45376 0.718705 5.35925 0.529352C5.26469 0.33992 5.1864 0.170597 5.1864 0.153376C5.18678 0.136107 5.25433 0.10222 5.33581 0.0781802C5.41741 0.0538131 5.5421 0.0254163 5.61315 0.0156802C5.68453 0.00597532 5.82581 0.0121374 5.92663 0.0293521C6.02777 0.0465732 6.19335 0.0995729 6.29479 0.14654C6.40746 0.199175 6.54238 0.298607 6.64343 0.404352C6.7338 0.498845 6.83854 0.646404 6.87585 0.732477C6.9131 0.818556 6.9576 0.981051 6.97546 1.09283C7.00113 1.25533 6.99796 1.34375 6.95788 1.53131C6.92876 1.66809 6.86567 1.83598 6.80651 1.93365C6.75078 2.02602 6.64884 2.15119 6.57995 2.21099C6.51124 2.27062 6.41979 2.3381 6.37683 2.36138C6.29886 2.40334 6.29743 2.40243 6.12585 2.05865C6.03129 1.8689 5.94337 1.70714 5.93054 1.70025C5.91774 1.69345 5.916 1.83966 5.92663 2.02447C5.9429 2.30707 5.93475 2.40605 5.8778 2.64263C5.84088 2.79752 5.76731 3.00209 5.71472 3.09673C5.6618 3.19129 5.55989 3.33973 5.48913 3.42584C5.41868 3.51152 5.33643 3.59919 5.30554 3.62115C5.27486 3.64275 5.25705 3.67424 5.2655 3.69146C5.27395 3.70868 5.57673 3.57524 5.93835 3.39459C6.29746 3.21519 6.59872 3.06754 6.6112 3.06548C6.61965 3.06548 6.65623 3.13225 6.69128 3.21392C6.72665 3.29562 6.777 3.47559 6.80456 3.61334C6.83837 3.78428 6.8486 3.93622 6.83483 4.09088C6.82387 4.21581 6.7791 4.42347 6.7362 4.55279C6.69298 4.68179 6.61253 4.86827 6.55651 4.96685C6.50045 5.06546 6.38475 5.22086 6.2987 5.31256C6.21376 5.40274 6.15067 5.4836 6.1571 5.4942C6.16555 5.50264 6.32408 5.4358 6.50866 5.34478C6.73133 5.2348 6.85392 5.18982 6.87585 5.21002C6.89307 5.22724 6.92966 5.3473 6.9569 5.47662C6.99601 5.66407 6.9998 5.75232 6.97351 5.91509C6.95534 6.02669 6.905 6.19176 6.86218 6.28228C6.81899 6.37272 6.71494 6.52088 6.63073 6.61138C6.54682 6.70187 6.40212 6.8134 6.30944 6.85943C6.21713 6.90574 6.04326 6.95948 5.92272 6.97955C5.74022 7.0096 5.66423 7.00781 5.46862 6.96588C5.33931 6.93832 5.1703 6.87714 5.09265 6.83111C5.01506 6.78473 4.89037 6.68365 4.8153 6.60552C4.73993 6.52733 4.65924 6.4278 4.63659 6.38482C4.59621 6.30719 4.59829 6.30465 4.93835 6.13384C5.12566 6.03988 5.27951 5.95223 5.28112 5.93853C5.28112 5.9257 5.14326 5.92367 4.97546 5.93463C4.73943 5.95028 4.61321 5.94234 4.41979 5.89947C4.28203 5.86878 4.10584 5.81578 4.02819 5.78228C3.95053 5.74843 3.81084 5.66937 3.71667 5.6065C3.62291 5.54368 3.47741 5.42207 3.39343 5.33599C3.25515 5.19458 3.24409 5.18788 3.27624 5.27252C3.29597 5.32418 3.45165 5.64537 3.62292 5.98541C3.79369 6.32445 3.93366 6.60921 3.93444 6.6192C3.93444 6.62764 3.8676 6.66459 3.78601 6.70025C3.70431 6.73625 3.53121 6.78687 3.40222 6.81256C3.24288 6.84448 3.08684 6.85206 2.91687 6.83892C2.77916 6.82797 2.56428 6.78547 2.43933 6.74322C2.31449 6.70098 2.13176 6.62055 2.03308 6.56451C1.93418 6.50849 1.77542 6.38971 1.68054 6.29986C1.58535 6.21031 1.49709 6.13576 1.48425 6.13482C1.47141 6.13419 1.53813 6.28914 1.63269 6.47857C1.72724 6.66799 1.80554 6.83733 1.80554 6.85455C1.8045 6.87189 1.73721 6.90582 1.65612 6.92974C1.5745 6.95411 1.45153 6.98154 1.38269 6.99127C1.3138 7.00097 1.17254 6.99579 1.06921 6.97857C0.965877 6.96134 0.798565 6.90834 0.697138 6.86138C0.584453 6.80876 0.44959 6.70935 0.348506 6.60357C0.25803 6.50901 0.153336 6.36056 0.116084 6.27447C0.0788972 6.18836 0.0343352 6.02669 0.0164744 5.91509C-0.0091939 5.75263 -0.00599562 5.66407 0.0340525 5.47662C0.0631719 5.33979 0.126242 5.17099 0.18542 5.0733C0.241216 4.98098 0.343215 4.85663 0.411982 4.79693C0.48065 4.73733 0.571767 4.66989 0.615107 4.64654C0.693072 4.60458 0.694499 4.60548 0.866084 4.94927C0.960012 5.13774 1.04771 5.29793 1.0614 5.3067C1.07423 5.3139 1.07559 5.17561 1.06433 4.99908C1.04868 4.75086 1.05725 4.6215 1.09948 4.42779C1.12952 4.2901 1.19732 4.08551 1.25085 3.97369C1.30407 3.86192 1.41148 3.69228 1.48913 3.59771C1.56678 3.50315 1.65914 3.4016 1.69421 3.3731C1.72917 3.34433 1.74707 3.31279 1.73425 3.30279C1.71558 3.29561 1.4115 3.43453 1.05358 3.61334C0.694139 3.7929 0.392646 3.94067 0.380732 3.94244C0.372278 3.94244 0.33775 3.88192 0.30456 3.80865C0.271383 3.73521 0.219698 3.55649 0.190303 3.41021C0.152754 3.22372 0.143051 3.0763 0.157099 2.91705C0.168054 2.79216 0.213553 2.58071 0.257685 2.44732C0.302088 2.31411 0.382893 2.12762 0.437373 2.03326C0.492088 1.93884 0.607167 1.78684 0.693232 1.69537C0.779338 1.60425 0.843288 1.52152 0.834834 1.51275C0.826384 1.5043 0.667894 1.57209 0.483271 1.66314C0.259339 1.77375 0.136996 1.81798 0.116084 1.79693C0.0988679 1.77971 0.062267 1.66026 0.0350291 1.53131C-0.00410744 1.34376 -0.00786865 1.25563 0.0184275 1.09283C0.036588 0.981048 0.0868594 0.815154 0.129756 0.724665C0.173004 0.634165 0.275615 0.488735 0.357295 0.401422C0.438911 0.314223 0.568722 0.207416 0.646357 0.164118C0.723999 0.120601 0.872134 0.0665496 0.975459 0.0440005C1.0784 0.0212278 1.19778 0.0011291 1.24108 5.52029e-05ZM3.91882 2.19048C3.9016 2.19142 3.50082 2.38546 3.02819 2.62115C2.5554 2.85661 2.17123 3.06015 2.17468 3.0733C2.17853 3.08726 2.3724 3.48148 2.60632 3.95025C2.84053 4.4196 3.03923 4.81094 3.04675 4.81939C3.06055 4.82472 3.45858 4.63576 3.9364 4.39654C4.41753 4.1555 4.81073 3.94746 4.81042 3.93463C4.80978 3.92053 4.61701 3.52273 4.38073 3.04986C4.14523 2.57854 3.93788 2.19317 3.91882 2.19048Z" fill="currentColor"/>
            </svg>
            <span className="text-[11px] font-medium tracking-[0.3em] uppercase">
              Pixels
            </span>
          </div>
          {imageUrl && imageDimensions && (
            <span className="hidden text-[9px] tracking-[0.15em] text-muted-foreground tabular-nums sm:block">
              {imageDimensions.w} × {imageDimensions.h}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://x.com/jeremiqque"
            target="_blank"
            rel="noopener noreferrer"
            title="@jeremiqque on X"
            className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <XLogo size={13} weight="regular" />
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun size={13} weight="regular" />
            ) : (
              <Moon size={13} weight="regular" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-border md:flex">
          <ModeTabs mode={mode} onChange={setMode} />
          <div className="flex-1 overflow-y-auto">
            {mode === "dither" && <ControlsContent {...sharedControlProps} />}
            {mode === "shape" && <ShapeControlsContent {...shapeControlProps} />}
            <PostEffectsPanel {...postEffectsPanelProps} />
          </div>
          {actionsSection}
        </aside>

        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div
            className="relative flex flex-1 items-center justify-center overflow-auto"
            style={{
              backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
            }}
            onDrop={handleDrop}
          >
            {imageUrl ? (
              <div className="relative m-8">
                <canvas
                  ref={canvasRef}
                  className="block max-h-[calc(100vh-6rem)] max-w-full shadow-md"
                  style={{ imageRendering: mode === "dither" ? "pixelated" : "auto" }}
                />

                {/* Crop overlay */}
                {cropMode && (
                  <div
                    className="absolute inset-0 cursor-crosshair select-none"
                    onMouseDown={handleCropMouseDown}
                    onMouseMove={handleCropMouseMove}
                    onMouseUp={handleCropMouseUp}
                  >
                    {/* dim everything */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* selection box with surrounding dim via box-shadow */}
                    {cropRect && cropRect.w > 2 && cropRect.h > 2 && (
                      <div
                        className="absolute border border-white/90"
                        style={{
                          left: cropRect.x,
                          top: cropRect.y,
                          width: cropRect.w,
                          height: cropRect.h,
                          boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                        }}
                      >
                        {/* corner handles */}
                        {[
                          "top-0 left-0 -translate-x-px -translate-y-px",
                          "top-0 right-0 translate-x-px -translate-y-px",
                          "bottom-0 left-0 -translate-x-px translate-y-px",
                          "bottom-0 right-0 translate-x-px translate-y-px",
                        ].map((pos, i) => (
                          <div
                            key={i}
                            className={`absolute h-2.5 w-2.5 border-2 border-white bg-transparent ${pos}`}
                          />
                        ))}

                        {/* size label */}
                        {hasCropSelection && (
                          <div className="absolute -top-6 left-0 text-[9px] tracking-wider text-white/80 tabular-nums whitespace-nowrap">
                            {Math.round(cropRect.w)} × {Math.round(cropRect.h)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* instructions when no selection yet */}
                    {!cropRect && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-white/70 text-[10px] tracking-[0.2em] uppercase">
                          Drag to select crop area
                        </span>
                      </div>
                    )}

                    {/* action buttons */}
                    {hasCropSelection && !cropDragging && (
                      <div
                        className="absolute flex gap-1.5 pointer-events-auto"
                        style={{
                          top: Math.min(
                            (cropRect?.y ?? 0) + (cropRect?.h ?? 0) + 8,
                            window.innerHeight - 60
                          ),
                          left: cropRect?.x ?? 0,
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={applyCrop}
                          className="flex items-center gap-1.5 bg-foreground px-2.5 py-1.5 text-background text-[10px] tracking-[0.1em] uppercase transition-opacity hover:opacity-80"
                        >
                          <Check size={10} weight="bold" />
                          Apply
                        </button>
                        <button
                          onClick={exitCropMode}
                          className="flex items-center gap-1.5 border border-white/30 bg-black/60 px-2.5 py-1.5 text-white text-[10px] tracking-[0.1em] uppercase backdrop-blur-sm transition-opacity hover:opacity-80"
                        >
                          <X size={10} weight="bold" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "mx-4 flex cursor-pointer flex-col items-center gap-4 border border-dashed border-border px-12 py-14 transition-all duration-150 sm:px-20",
                  isDragging && "scale-[1.02] border-foreground bg-foreground/5"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple
                  size={32}
                  weight="thin"
                  className={cn("text-muted-foreground transition-colors", isDragging && "text-foreground")}
                />
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-[11px] tracking-[0.25em] uppercase">
                    {isDragging ? "Release to upload" : "Drop image here"}
                  </span>
                  <span className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase">
                    or click to browse · paste from clipboard
                  </span>
                </div>
              </div>
            )}

            {isDragging && imageUrl && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-foreground bg-background/80 backdrop-blur-sm">
                <span className="text-[11px] tracking-[0.25em] uppercase">
                  Release to replace image
                </span>
              </div>
            )}
          </div>

          {/* Mobile toolbar */}
          <div className="flex shrink-0 items-center gap-2 border-t border-border p-3 md:hidden">
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-1 gap-2 text-[11px] tracking-[0.05em] uppercase"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadSimple size={12} weight="regular" />
              Upload
            </Button>

            {imageUrl && (
              <Button
                variant="outline"
                size="icon"
                className={cn("h-9 w-9 shrink-0", cropMode && "border-foreground")}
                onClick={() => cropMode ? exitCropMode() : setCropMode(true)}
                title="Crop image"
              >
                <Crop size={14} weight="regular" />
              </Button>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                  <SlidersHorizontal size={14} weight="regular" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="flex h-[85dvh] flex-col p-0">
                <SheetHeader className="shrink-0 px-4 pt-4 pb-0">
                  <SheetTitle className="text-left text-[11px] tracking-[0.25em] uppercase">
                    Settings
                  </SheetTitle>
                </SheetHeader>
                <ModeTabs mode={mode} onChange={setMode} />
                <div className="flex-1 overflow-y-auto pb-8">
                  {mode === "dither" && <ControlsContent {...sharedControlProps} />}
                  {mode === "shape" && <ShapeControlsContent {...shapeControlProps} />}
                  <PostEffectsPanel {...postEffectsPanelProps} />
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="default"
              size="sm"
              className="h-9 flex-1 gap-2 text-[11px] tracking-[0.05em] uppercase"
              onClick={handleDownload}
              disabled={!imageUrl}
            >
              <DownloadSimple size={12} weight="regular" />
              Download
            </Button>
          </div>
        </main>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}

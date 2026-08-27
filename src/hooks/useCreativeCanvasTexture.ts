import { useEffect, useState } from 'react'
import * as THREE from 'three'
import type { CreativeDisplaySettings } from '@/stores/projectStore'

interface CreativeCanvasOptions extends CreativeDisplaySettings {
  autoRotationRadians: number
  targetAspectRatio: number
}

/** Rasterises the complete creative transform before it reaches Three.js. */
export function useCreativeCanvasTexture(
  url: string | undefined,
  options: CreativeCanvasOptions,
) {
  const [rendered, setRendered] = useState<{
    url: string
    texture: THREE.CanvasTexture
  } | null>(null)

  useEffect(() => {
    if (!url) {
      return
    }
    let cancelled = false
    let renderedTexture: THREE.CanvasTexture | null = null
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      const portrait = options.targetAspectRatio <= 1
      const width = portrait ? 512 : 1536
      const height = portrait
        ? Math.round(width / options.targetAspectRatio)
        : Math.round(width / options.targetAspectRatio)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(256, Math.min(1536, width))
      canvas.height = Math.max(256, Math.min(2048, height))
      const context = canvas.getContext('2d')
      if (!context) return

      context.clearRect(0, 0, canvas.width, canvas.height)
      if (options.fitMode === 'contain') {
        context.fillStyle = options.backgroundColor
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      const angle =
        options.autoRotationRadians + THREE.MathUtils.degToRad(options.rotation)
      const cos = Math.abs(Math.cos(angle))
      const sin = Math.abs(Math.sin(angle))
      const rotatedWidth = image.naturalWidth * cos + image.naturalHeight * sin
      const rotatedHeight = image.naturalWidth * sin + image.naturalHeight * cos
      const baseScale =
        options.fitMode === 'cover'
          ? Math.max(canvas.width / rotatedWidth, canvas.height / rotatedHeight)
          : Math.min(canvas.width / rotatedWidth, canvas.height / rotatedHeight)

      context.save()
      context.translate(
        canvas.width * (0.5 + options.offsetX * 0.22),
        canvas.height * (0.5 - options.offsetY * 0.22),
      )
      context.rotate(angle)
      context.scale(baseScale * options.zoom, baseScale * options.zoom)
      context.drawImage(
        image,
        -image.naturalWidth / 2,
        -image.naturalHeight / 2,
      )
      context.restore()

      renderedTexture = new THREE.CanvasTexture(canvas)
      renderedTexture.colorSpace = THREE.SRGBColorSpace
      renderedTexture.anisotropy = 8
      renderedTexture.needsUpdate = true
      setRendered({ url, texture: renderedTexture })
    }
    image.src = url
    return () => {
      cancelled = true
      renderedTexture?.dispose()
    }
  }, [
    options.autoRotationRadians,
    options.backgroundColor,
    options.fitMode,
    options.offsetX,
    options.offsetY,
    options.rotation,
    options.targetAspectRatio,
    options.zoom,
    url,
  ])

  return rendered && rendered.url === url ? rendered.texture : null
}

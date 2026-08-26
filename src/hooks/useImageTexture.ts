import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

interface TextureFitOptions {
  sourceAspectRatio: number
  targetAspectRatio: number
  fitMode: 'contain' | 'cover'
  rotation?: number
  offsetX?: number
  offsetY?: number
}

export function useImageTexture(url?: string, fit?: TextureFitOptions) {
  const fitMode = fit?.fitMode
  const sourceAspectRatio = fit?.sourceAspectRatio
  const targetAspectRatio = fit?.targetAspectRatio
  const rotation = fit?.rotation ?? 0
  const offsetX = fit?.offsetX ?? 0
  const offsetY = fit?.offsetY ?? 0
  const texture = useMemo(() => {
    if (!url) return null
    const value = new THREE.TextureLoader().load(url)
    value.colorSpace = THREE.SRGBColorSpace
    value.anisotropy = 8
    value.wrapS = THREE.ClampToEdgeWrapping
    value.wrapT = THREE.ClampToEdgeWrapping
    value.center.set(0.5, 0.5)
    value.rotation = THREE.MathUtils.degToRad(rotation)
    if (
      fitMode === 'cover' &&
      sourceAspectRatio !== undefined &&
      targetAspectRatio !== undefined
    ) {
      if (sourceAspectRatio > targetAspectRatio) {
        const visibleWidth = targetAspectRatio / sourceAspectRatio
        value.repeat.set(visibleWidth, 1)
        value.offset.set((1 - visibleWidth) / 2, 0)
      } else {
        const visibleHeight = sourceAspectRatio / targetAspectRatio
        value.repeat.set(1, visibleHeight)
        value.offset.set(0, (1 - visibleHeight) / 2)
      }
    }
    value.offset.x += offsetX * Math.max(0, 1 - value.repeat.x)
    value.offset.y += offsetY * Math.max(0, 1 - value.repeat.y)
    value.needsUpdate = true
    return value
  }, [fitMode, offsetX, offsetY, rotation, sourceAspectRatio, targetAspectRatio, url])
  useEffect(() => () => texture?.dispose(), [texture])
  return texture
}

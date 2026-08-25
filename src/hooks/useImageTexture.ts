import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

interface TextureFitOptions {
  sourceAspectRatio: number
  targetAspectRatio: number
  fitMode: 'contain' | 'cover'
}

export function useImageTexture(url?: string, fit?: TextureFitOptions) {
  const fitMode = fit?.fitMode
  const sourceAspectRatio = fit?.sourceAspectRatio
  const targetAspectRatio = fit?.targetAspectRatio
  const texture = useMemo(() => {
    if (!url) return null
    const value = new THREE.TextureLoader().load(url)
    value.colorSpace = THREE.SRGBColorSpace
    value.anisotropy = 8
    value.wrapS = THREE.ClampToEdgeWrapping
    value.wrapT = THREE.ClampToEdgeWrapping
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
    value.needsUpdate = true
    return value
  }, [fitMode, sourceAspectRatio, targetAspectRatio, url])
  useEffect(() => () => texture?.dispose(), [texture])
  return texture
}

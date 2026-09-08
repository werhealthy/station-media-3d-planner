import { useEffect, useState } from 'react'
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
  const textureKey = `${url ?? ''}:${fitMode ?? ''}:${sourceAspectRatio ?? ''}:${targetAspectRatio ?? ''}`
  const [loaded, setLoaded] = useState<{
    key: string
    texture: THREE.Texture
  } | null>(null)

  useEffect(() => {
    if (!url) return
    let active = true
    const value = new THREE.TextureLoader().load(url, () => {
      if (!active) return
      value.needsUpdate = true
      setLoaded({ key: textureKey, texture: value })
    })
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
    return () => {
      active = false
      value.dispose()
    }
  }, [fitMode, sourceAspectRatio, targetAspectRatio, textureKey, url])

  return loaded?.key === textureKey ? loaded.texture : null
}

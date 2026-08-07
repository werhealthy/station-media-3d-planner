import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
export function useImageTexture(url?: string) {
  const texture = useMemo(() => {
    if (!url) return null
    const value = new THREE.TextureLoader().load(url)
    value.colorSpace = THREE.SRGBColorSpace
    value.anisotropy = 8
    return value
  }, [url])
  useEffect(() => () => texture?.dispose(), [texture])
  return texture
}

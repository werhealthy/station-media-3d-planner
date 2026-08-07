import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { StationModel } from './StationModel'
import type { StationModelAdapter } from '@/adapters/station-model/types'

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

function handle(source: 'procedural' | 'external-fbx') {
  return {
    root: new THREE.Group(),
    occlusionMeshes: [],
    boundingBox: new THREE.Box3(
      new THREE.Vector3(),
      new THREE.Vector3(1, 1, 1),
    ),
    diagnostics: {
      source,
      rawSize: [1, 1, 1] as [number, number, number],
      normalizedSize: [1, 1, 1] as [number, number, number],
      center: [0, 0, 0] as [number, number, number],
      meshCount: 0,
      materialCount: 0,
      textureNames: [],
      missingTextures: [],
      scaleApplied: 1,
      hierarchy: [],
    },
  }
}

describe('StationModel fallback', () => {
  it('sostituisce un adapter fallito con il procedural e comunica entrambi gli stati', async () => {
    const fallbackHandle = handle('procedural')
    const adapter: StationModelAdapter = {
      load: vi.fn().mockRejectedValue(new Error('FBX non disponibile')),
      dispose: vi.fn(),
    }
    const fallbackAdapter: StationModelAdapter = {
      load: vi.fn().mockResolvedValue(fallbackHandle),
      dispose: vi.fn(),
    }
    const onError = vi.fn()
    const onLoaded = vi.fn()

    const { unmount } = render(
      <StationModel
        adapter={adapter}
        fallbackAdapter={fallbackAdapter}
        onError={onError}
        onLoaded={onLoaded}
      />,
    )

    await waitFor(() => expect(onLoaded).toHaveBeenCalledWith(fallbackHandle))
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('fallback procedurale'),
    )
    unmount()
    expect(fallbackAdapter.dispose).toHaveBeenCalledWith(fallbackHandle)
  })
})

import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'

const loadMock =
  vi.fn<
    (
      url: string,
      onLoad: (gltf: { scene: THREE.Group }) => void,
      onProgress: undefined,
      onError: (error: unknown) => void
    ) => void
  >()

vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(function (this: {
    load: typeof loadMock
  }) {
    this.load = loadMock
  }),
}))

const { createGlbAdapter } = await import('./glbAdapter')

describe('glbAdapter', () => {
  it('risolve con root, mesh di occlusione e bounding box quando il caricamento riesce', async () => {
    const scene = new THREE.Group()
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    )
    scene.add(mesh)

    loadMock.mockImplementationOnce((_url, onLoad) => {
      onLoad({ scene })
    })

    const adapter = createGlbAdapter({ url: '/fake-station.glb' })
    const handle = await adapter.load()

    expect(handle.root).toBe(scene)
    expect(handle.occlusionMeshes).toEqual([mesh])
    expect(handle.boundingBox).toBeInstanceOf(THREE.Box3)
  })

  it('rigetta con un errore leggibile quando il caricamento fallisce', async () => {
    loadMock.mockImplementationOnce((_url, _onLoad, _onProgress, onError) => {
      onError(new Error('404 not found'))
    })

    const adapter = createGlbAdapter({ url: '/missing.glb' })

    await expect(adapter.load()).rejects.toThrow(
      /Impossibile caricare il modello GLB da "\/missing.glb"/
    )
  })

  it('dispose() libera geometria e materiale di ogni mesh caricata', async () => {
    const scene = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    loadMock.mockImplementationOnce((_url, onLoad) => {
      onLoad({ scene })
    })

    const adapter = createGlbAdapter({ url: '/fake-station.glb' })
    const handle = await adapter.load()

    const geometrySpy = vi.spyOn(geometry, 'dispose')
    const materialSpy = vi.spyOn(material, 'dispose')

    adapter.dispose(handle)

    expect(geometrySpy).toHaveBeenCalledOnce()
    expect(materialSpy).toHaveBeenCalledOnce()
  })
})

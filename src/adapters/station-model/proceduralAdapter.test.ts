import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { proceduralAdapter } from './proceduralAdapter'

describe('proceduralAdapter', () => {
  it('carica una stazione con mesh di occlusione e bounding box non vuoto', async () => {
    const handle = await proceduralAdapter.load()

    expect(handle.root).toBeInstanceOf(THREE.Object3D)
    expect(handle.occlusionMeshes.length).toBeGreaterThan(0)
    expect(handle.occlusionMeshes.every((m) => m instanceof THREE.Mesh)).toBe(
      true
    )

    const size = new THREE.Vector3()
    handle.boundingBox.getSize(size)
    expect(size.x).toBeGreaterThan(0)
    expect(size.y).toBeGreaterThan(0)
    expect(size.z).toBeGreaterThan(0)

    proceduralAdapter.dispose(handle)
  })

  it('dispose() libera geometria e materiale di ogni mesh', async () => {
    const handle = await proceduralAdapter.load()
    const meshes = handle.occlusionMeshes.filter(
      (m): m is THREE.Mesh => m instanceof THREE.Mesh
    )
    const disposeSpies = meshes.map((mesh) => ({
      geometry: vi.spyOn(mesh.geometry, 'dispose'),
      material: Array.isArray(mesh.material)
        ? mesh.material.map((m) => vi.spyOn(m, 'dispose'))
        : [vi.spyOn(mesh.material, 'dispose')],
    }))

    proceduralAdapter.dispose(handle)

    // Alcuni materiali sono condivisi tra piu' mesh (es. colonne, pali):
    // dispose() puo' quindi essere invocato piu' volte sullo stesso
    // materiale, operazione idempotente in Three.js. Verifichiamo solo che
    // ogni geometria e materiale sia stato effettivamente disposto.
    for (const spy of disposeSpies) {
      expect(spy.geometry).toHaveBeenCalled()
      for (const materialSpy of spy.material) {
        expect(materialSpy).toHaveBeenCalled()
      }
    }
  })
})

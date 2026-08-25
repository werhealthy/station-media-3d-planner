import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { proceduralAdapter } from './proceduralAdapter'

function names(
  root: Awaited<ReturnType<typeof proceduralAdapter.load>>['root'],
) {
  const result: string[] = []
  root.traverse((object) => result.push(object.name))
  return result
}

describe('proceduralAdapter composition', () => {
  it('loads occlusion meshes and a non-empty bounding box', async () => {
    const handle = await proceduralAdapter.load()

    expect(handle.root).toBeInstanceOf(THREE.Object3D)
    expect(handle.occlusionMeshes.length).toBeGreaterThan(0)
    expect(
      handle.occlusionMeshes.every((mesh) => mesh instanceof THREE.Mesh),
    ).toBe(true)

    const size = new THREE.Vector3()
    handle.boundingBox.getSize(size)
    expect(size.x).toBeGreaterThan(0)
    expect(size.y).toBeGreaterThan(0)
    expect(size.z).toBeGreaterThan(0)

    proceduralAdapter.dispose(handle)
  })

  it('disposes every mesh geometry and material', async () => {
    const handle = await proceduralAdapter.load()
    const meshes = handle.occlusionMeshes.filter(
      (mesh): mesh is THREE.Mesh => mesh instanceof THREE.Mesh,
    )
    const disposeSpies = meshes.map((mesh) => ({
      geometry: vi.spyOn(mesh.geometry, 'dispose'),
      material: Array.isArray(mesh.material)
        ? mesh.material.map((material) => vi.spyOn(material, 'dispose'))
        : [vi.spyOn(mesh.material, 'dispose')],
    }))

    proceduralAdapter.dispose(handle)

    for (const spy of disposeSpies) {
      expect(spy.geometry).toHaveBeenCalled()
      for (const materialSpy of spy.material)
        expect(materialSpy).toHaveBeenCalled()
    }
  })

  it('uses two compact pumps and a walkable Svolta entrance', async () => {
    const handle = await proceduralAdapter.load()
    const sceneNames = names(handle.root)

    expect(
      sceneNames.filter((name) => name.startsWith('fuel-dispenser-')),
    ).toHaveLength(2)
    expect(
      sceneNames.filter((name) => name === 'shop-entry-door'),
    ).toHaveLength(2)
    expect(sceneNames).not.toContain('shop-glazing')
    expect(sceneNames).not.toContain('shop-structural-shell')
    expect(sceneNames).toContain('shop-back-wall')
    expect(sceneNames).toContain('shop-checkout-counter')
    expect(
      sceneNames.filter((name) => name.startsWith('landscape-tree-')).length,
    ).toBeGreaterThanOrEqual(36)
    expect(sceneNames).toContain('price-pylon')
    expect(sceneNames).not.toContain('price-pylon-stendardo-panel')
    expect(sceneNames).toContain('q8-easy-main-body')
    expect(sceneNames).toContain('q8-easy-grade-column-0')
    expect(sceneNames).toContain('q8-easy-transaction-display')
    expect(sceneNames).not.toContain('payment-kiosk')
    expect(sceneNames).not.toContain('totem')

    proceduralAdapter.dispose(handle)
  })

  it('reports completed procedural diagnostics', async () => {
    const handle = await proceduralAdapter.load()

    expect(handle.diagnostics).toMatchObject({
      source: 'procedural',
      missingTextures: [],
      scaleApplied: 1,
    })
    expect(handle.diagnostics?.meshCount).toBeGreaterThan(100)

    proceduralAdapter.dispose(handle)
  })
})

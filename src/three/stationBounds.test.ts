import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { applyHiddenMeshes, calculateUsefulBox, isHiddenMesh, meshPath } from './stationBounds'

function scene() {
  const root = new THREE.Group()
  root.name = 'station'
  const useful = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 8))
  useful.name = 'building'
  useful.position.y = 1
  const dome = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100))
  dome.name = 'vendor-shell'
  root.add(useful, dome)
  root.updateMatrixWorld(true)
  return { root, useful, dome }
}

describe('useful bounds', () => {
  it('filters hidden meshes instead of framing the whole model', () => {
    const { root, dome } = scene()
    const box = calculateUsefulBox(root, [meshPath(dome)])
    expect(box.getSize(new THREE.Vector3()).toArray()).toEqual([10, 2, 8])
  })

  it('supports configured names and updates viewer visibility', () => {
    const { root, dome } = scene()
    expect(isHiddenMesh(dome, ['vendor-shell'])).toBe(true)
    applyHiddenMeshes(root, ['vendor-shell'])
    expect(dome.visible).toBe(false)
  })

  it('ignores meshes hidden by an ancestor', () => {
    const { root, useful, dome } = scene()
    useful.visible = false
    const box = calculateUsefulBox(root, [meshPath(dome)])
    expect(box.isEmpty()).toBe(true)
  })
})

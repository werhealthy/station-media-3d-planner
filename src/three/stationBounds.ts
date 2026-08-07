import * as THREE from 'three'
import type { RuntimeBounds } from '@/stores/stationRuntimeStore'

export function meshPath(object: THREE.Object3D): string {
  const parts: string[] = []
  let current: THREE.Object3D | null = object
  while (current) {
    const index = current.parent?.children.indexOf(current) ?? 0
    parts.unshift(`${current.name || current.type}[${index}]`)
    current = current.parent
  }
  return parts.join('/')
}

export function isEffectivelyVisible(object: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

export function isHiddenMesh(mesh: THREE.Object3D, hidden: string[]): boolean {
  const path = meshPath(mesh)
  return hidden.includes(path) || (!!mesh.name && hidden.includes(mesh.name))
}

export function calculateUsefulBox(
  root: THREE.Object3D,
  hidden: string[],
): THREE.Box3 {
  root.updateMatrixWorld(true)
  const result = new THREE.Box3()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (!isEffectivelyVisible(object) || isHiddenMesh(object, hidden)) return
    if (object.userData.stationHelper) return
    const box = new THREE.Box3().setFromObject(object)
    if (!box.isEmpty()) result.union(box)
  })
  return result
}

export function boxToRuntimeBounds(box: THREE.Box3): RuntimeBounds | null {
  if (box.isEmpty()) return null
  return {
    min: box.min.toArray(),
    max: box.max.toArray(),
    center: box.getCenter(new THREE.Vector3()).toArray(),
    size: box.getSize(new THREE.Vector3()).toArray(),
  }
}

export function applyHiddenMeshes(root: THREE.Object3D, hidden: string[]) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh)
      object.visible = !isHiddenMesh(object, hidden)
  })
}

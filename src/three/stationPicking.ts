import * as THREE from 'three'
import type { Intersection } from 'three'
import type { MeshInspection } from '@/stores/stationSetupStore'
import { meshPath } from './stationBounds'

function materials(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

export function worldNormal(hit: Intersection<THREE.Object3D>): THREE.Vector3 {
  const normal = hit.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0)
  return normal.transformDirection(hit.object.matrixWorld).normalize()
}

export function inspectIntersection(
  hit: Intersection<THREE.Object3D>,
): MeshInspection | null {
  if (!(hit.object instanceof THREE.Mesh)) return null
  const mesh = hit.object
  const box = new THREE.Box3().setFromObject(mesh)
  const textureSet = new Set<string>()
  const materialNames: string[] = []
  for (const material of materials(mesh)) {
    materialNames.push(material.name || material.type)
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture)
        textureSet.add(value.name || value.source.data?.src || '(embedded)')
    }
  }
  return {
    name: mesh.name || '(unnamed)',
    path: meshPath(mesh),
    parent: mesh.parent?.name || mesh.parent?.type || '(none)',
    materials: materialNames,
    textures: [...textureSet],
    position: mesh.getWorldPosition(new THREE.Vector3()).toArray(),
    min: box.min.toArray(),
    max: box.max.toArray(),
    size: box.getSize(new THREE.Vector3()).toArray(),
    visible: mesh.visible,
    hitPoint: hit.point.toArray(),
    normal: worldNormal(hit).toArray(),
  }
}

export function rotationFromSurfaceNormal(
  normal: [number, number, number],
): [number, number, number] {
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(...normal).normalize(),
  )
  const euler = new THREE.Euler().setFromQuaternion(quaternion, 'XYZ')
  return [euler.x, euler.y, euler.z].map(THREE.MathUtils.radToDeg) as [number, number, number]
}

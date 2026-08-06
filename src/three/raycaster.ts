import * as THREE from 'three'

let _raycaster: THREE.Raycaster | null = null

export function getRaycaster(): THREE.Raycaster {
  if (!_raycaster) {
    _raycaster = new THREE.Raycaster()
  }
  return _raycaster
}

export function checkOcclusion(
  origin: THREE.Vector3,
  target: THREE.Vector3,
  occluders: THREE.Object3D[]
): boolean {
  const raycaster = getRaycaster()
  const direction = new THREE.Vector3().subVectors(target, origin).normalize()
  const distance = origin.distanceTo(target)

  raycaster.set(origin, direction)
  const intersections = raycaster.intersectObjects(occluders, true)

  const closest = intersections[0]
  return closest !== undefined && closest.distance < distance
}

export function extractFrustumPlanes(camera: THREE.Camera): THREE.Plane[] {
  const frustum = new THREE.Frustum()
  const projScreenMatrix = new THREE.Matrix4()
  projScreenMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  )
  frustum.setFromProjectionMatrix(projScreenMatrix)

  return frustum.planes
}

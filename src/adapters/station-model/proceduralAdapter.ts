import * as THREE from 'three'
import type { StationModelAdapter, StationModelHandle } from './types'

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  options?: { castShadow?: boolean; receiveShadow?: boolean }
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.castShadow = options?.castShadow ?? false
  mesh.receiveShadow = options?.receiveShadow ?? false
  parent.add(mesh)
  return mesh
}

function buildStation(): THREE.Group {
  const root = new THREE.Group()
  root.name = 'proceduralStation'

  const groundMat = new THREE.MeshStandardMaterial({
    color: '#888888',
    roughness: 0.7,
  })
  const groundGeo = new THREE.PlaneGeometry(50, 50)
  groundGeo.rotateX(-Math.PI / 2)
  addMesh(root, groundGeo, groundMat, [0, 0, 0], { receiveShadow: true })

  const canopyMat = new THREE.MeshStandardMaterial({
    color: '#cccccc',
    roughness: 0.5,
  })
  addMesh(root, new THREE.BoxGeometry(40, 0.5, 30), canopyMat, [0, 4, 0], {
    castShadow: true,
    receiveShadow: true,
  })

  const columnMat = new THREE.MeshStandardMaterial({ color: '#999999' })
  const columnPositions: [number, number, number][] = [
    [-15, 2, -10],
    [15, 2, -10],
    [-15, 2, 10],
    [15, 2, 10],
  ]
  for (const pos of columnPositions) {
    addMesh(
      root,
      new THREE.CylinderGeometry(0.8, 0.8, 4, 16),
      columnMat,
      pos,
      { castShadow: true }
    )
  }

  const pumpBaseMat = new THREE.MeshStandardMaterial({ color: '#333333' })
  const pumpDisplayMat = new THREE.MeshStandardMaterial({ color: '#111111' })
  const pumpPositions: [number, number, number][] = [
    [-10, 0, -5],
    [0, 0, -5],
    [-10, 0, 5],
    [0, 0, 5],
  ]
  for (const pos of pumpPositions) {
    const pumpGroup = new THREE.Group()
    pumpGroup.position.set(...pos)
    addMesh(pumpGroup, new THREE.BoxGeometry(3, 1.5, 3), pumpBaseMat, [0, 0, 0], {
      castShadow: true,
      receiveShadow: true,
    })
    addMesh(
      pumpGroup,
      new THREE.BoxGeometry(2, 1, 0.1),
      pumpDisplayMat,
      [0, 1, 0],
      { castShadow: true }
    )
    root.add(pumpGroup)
  }

  const buildingMat = new THREE.MeshStandardMaterial({ color: '#bb9966' })
  addMesh(root, new THREE.BoxGeometry(12, 6, 10), buildingMat, [20, 3, 0], {
    castShadow: true,
    receiveShadow: true,
  })

  const windowMat = new THREE.MeshStandardMaterial({
    color: '#4488ff',
    emissive: '#2244ff',
    emissiveIntensity: 0.3,
  })
  const windowGeo = new THREE.PlaneGeometry(1.5, 1.5)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      addMesh(root, windowGeo.clone(), windowMat, [
        20 + (i - 1) * 3,
        4 + j * 2,
        5.1,
      ])
    }
  }

  const parkingMat = new THREE.MeshStandardMaterial({
    color: '#444444',
    roughness: 0.8,
  })
  const parkingGeo = new THREE.PlaneGeometry(15, 20)
  parkingGeo.rotateX(-Math.PI / 2)
  addMesh(root, parkingGeo, parkingMat, [-25, 0.01, 0], {
    receiveShadow: true,
  })

  const roadMat = new THREE.MeshStandardMaterial({
    color: '#2f2f2f',
    roughness: 0.9,
  })
  const roadGeo = new THREE.PlaneGeometry(10, 30)
  roadGeo.rotateX(-Math.PI / 2)
  addMesh(root, roadGeo, roadMat, [0, 0.01, 25], { receiveShadow: true })

  const roadLineMat = new THREE.MeshStandardMaterial({ color: '#e8e8a0' })
  const roadLineGeo = new THREE.PlaneGeometry(0.3, 3)
  roadLineGeo.rotateX(-Math.PI / 2)
  for (let z = 12; z < 40; z += 6) {
    addMesh(root, roadLineGeo.clone(), roadLineMat, [0, 0.02, z])
  }

  const signGroup = new THREE.Group()
  signGroup.position.set(-20, 0, -15)
  const poleMat = new THREE.MeshStandardMaterial({ color: '#333333' })
  addMesh(signGroup, new THREE.CylinderGeometry(0.2, 0.2, 4, 8), poleMat, [
    0, 0, 0,
  ], { castShadow: true })
  addMesh(
    signGroup,
    new THREE.BoxGeometry(3, 2, 0.1),
    new THREE.MeshStandardMaterial({ color: '#ff4444' }),
    [0, 2, 0],
    { castShadow: true }
  )
  root.add(signGroup)

  const lampGroup = new THREE.Group()
  lampGroup.position.set(15, 0, -20)
  addMesh(
    lampGroup,
    new THREE.CylinderGeometry(0.15, 0.15, 8, 8),
    poleMat,
    [0, 0, 0],
    { castShadow: true }
  )
  addMesh(
    lampGroup,
    new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#ffff99', emissive: '#ffff00' }),
    [0, 4, 0],
    { castShadow: true }
  )
  root.add(lampGroup)

  return root
}

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child)
    }
  })
  return meshes
}

function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose()
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => m.dispose())
  } else {
    mesh.material.dispose()
  }
}

export const proceduralAdapter: StationModelAdapter = {
  async load(): Promise<StationModelHandle> {
    const root = buildStation()
    const occlusionMeshes = collectMeshes(root)
    const boundingBox = new THREE.Box3().setFromObject(root)

    return { root, occlusionMeshes, boundingBox }
  },

  dispose(handle: StationModelHandle): void {
    for (const mesh of collectMeshes(handle.root)) {
      disposeMesh(mesh)
    }
  },
}

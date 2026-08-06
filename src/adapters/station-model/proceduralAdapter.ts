import * as THREE from 'three'
import type { StationModelAdapter, StationModelHandle } from './types'

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  options?: { castShadow?: boolean; receiveShadow?: boolean; rotation?: [number, number, number] }
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  if (options?.rotation) {
    mesh.rotation.order = 'XYZ'
    mesh.rotation.set(...options.rotation)
  }
  mesh.castShadow = options?.castShadow ?? false
  mesh.receiveShadow = options?.receiveShadow ?? false
  parent.add(mesh)
  return mesh
}

function buildStation(): THREE.Group {
  const root = new THREE.Group()
  root.name = 'proceduralStation'

  // Ground - better asphalt color
  const groundMat = new THREE.MeshStandardMaterial({
    color: '#5a5a5a',
    roughness: 0.8,
    metalness: 0.1,
  })
  const groundGeo = new THREE.PlaneGeometry(80, 80)
  groundGeo.rotateX(-Math.PI / 2)
  addMesh(root, groundGeo, groundMat, [0, 0, 0], { receiveShadow: true })

  // Canopy structure - improved materials
  const canopyRoofMat = new THREE.MeshStandardMaterial({
    color: '#e8e8e8',
    roughness: 0.4,
    metalness: 0.3,
  })
  const canopyRoof = new THREE.BoxGeometry(45, 0.4, 32)
  addMesh(root, canopyRoof, canopyRoofMat, [0, 4.2, 0], {
    castShadow: true,
    receiveShadow: true,
  })

  // Canopy edge supports - metallic look
  const edgeMat = new THREE.MeshStandardMaterial({
    color: '#cccccc',
    roughness: 0.3,
    metalness: 0.6,
  })
  addMesh(root, new THREE.BoxGeometry(45, 0.3, 0.5), edgeMat, [0, 4.3, -16], {
    castShadow: true,
  })
  addMesh(root, new THREE.BoxGeometry(45, 0.3, 0.5), edgeMat, [0, 4.3, 16], {
    castShadow: true,
  })

  // Canopy columns - sleek white/gray
  const columnMat = new THREE.MeshStandardMaterial({
    color: '#f5f5f5',
    roughness: 0.3,
    metalness: 0.4,
  })
  const columnGeo = new THREE.CylinderGeometry(0.6, 0.6, 4.2, 12)
  const columnPositions: [number, number, number][] = [
    [-20, 2.1, -12],
    [-10, 2.1, -12],
    [0, 2.1, -12],
    [10, 2.1, -12],
    [20, 2.1, -12],
    [-20, 2.1, 12],
    [-10, 2.1, 12],
    [0, 2.1, 12],
    [10, 2.1, 12],
    [20, 2.1, 12],
  ]
  for (const pos of columnPositions) {
    addMesh(root, columnGeo.clone(), columnMat, pos, { castShadow: true })
  }

  // Pump islands - much more detailed and realistic
  const pumpBaseMat = new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.4,
    metalness: 0.5,
  })
  const pumpAccentMat = new THREE.MeshStandardMaterial({
    color: '#00aa00',
    roughness: 0.3,
    metalness: 0.7,
  })
  const pumpDisplayMat = new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.2,
    metalness: 0.3,
  })

  const pumpPositions: [number, number, number][] = [
    [-12, 0, -6],
    [-4, 0, -6],
    [4, 0, -6],
    [12, 0, -6],
    [-12, 0, 6],
    [-4, 0, 6],
    [4, 0, 6],
    [12, 0, 6],
  ]

  for (const pos of pumpPositions) {
    const pumpGroup = new THREE.Group()
    pumpGroup.position.set(...pos)

    // Base pedestal
    addMesh(pumpGroup, new THREE.BoxGeometry(2.8, 0.4, 2.8), pumpBaseMat, [0, 0.2, 0], {
      castShadow: true,
      receiveShadow: true,
    })

    // Main pump body
    addMesh(pumpGroup, new THREE.BoxGeometry(2.5, 1.8, 1.2), pumpBaseMat, [0, 1, 0], {
      castShadow: true,
      receiveShadow: true,
    })

    // Screen/Display
    addMesh(
      pumpGroup,
      new THREE.BoxGeometry(2, 0.8, 0.15),
      pumpDisplayMat,
      [0, 1.4, 0.6],
      { castShadow: true }
    )

    // Green accent stripe
    addMesh(
      pumpGroup,
      new THREE.BoxGeometry(2.6, 0.15, 1.3),
      pumpAccentMat,
      [0, 1.8, 0],
      { castShadow: true }
    )

    // Nozzle holder area
    addMesh(
      pumpGroup,
      new THREE.BoxGeometry(0.3, 0.6, 0.5),
      pumpAccentMat,
      [-0.8, 0.3, 0],
      { castShadow: true }
    )
    addMesh(
      pumpGroup,
      new THREE.BoxGeometry(0.3, 0.6, 0.5),
      pumpAccentMat,
      [0.8, 0.3, 0],
      { castShadow: true }
    )

    root.add(pumpGroup)
  }

  // Building - improved colors and details
  const buildingMat = new THREE.MeshStandardMaterial({
    color: '#d4a574',
    roughness: 0.6,
    metalness: 0,
  })
  addMesh(root, new THREE.BoxGeometry(14, 5.5, 11), buildingMat, [22, 2.75, 0], {
    castShadow: true,
    receiveShadow: true,
  })

  // Building roof - darker tone
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#8b5a3c',
    roughness: 0.7,
  })
  addMesh(root, new THREE.BoxGeometry(14.2, 0.5, 11.2), roofMat, [22, 5.75, 0], {
    castShadow: true,
    receiveShadow: true,
  })

  // Building windows - bright, reflective
  const windowMat = new THREE.MeshStandardMaterial({
    color: '#66bbff',
    emissive: '#1144aa',
    emissiveIntensity: 0.4,
    roughness: 0.1,
    metalness: 0.5,
  })
  const windowGeo = new THREE.PlaneGeometry(1.2, 1.2)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      addMesh(root, windowGeo.clone(), windowMat, [
        16 + (i - 1) * 2.8,
        4 + j * 1.8,
        5.55,
      ])
    }
  }

  // Building entrance door
  const doorMat = new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.5,
  })
  addMesh(root, new THREE.BoxGeometry(1.2, 2.2, 0.15), doorMat, [28, 1.1, 5.55], {
    castShadow: true,
  })

  // Door handle
  const handleMat = new THREE.MeshStandardMaterial({
    color: '#d4af37',
    roughness: 0.2,
    metalness: 0.9,
  })
  addMesh(
    root,
    new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8),
    handleMat,
    [28.5, 1.1, 5.57],
    { castShadow: true, rotation: [0, 0, Math.PI / 2] }
  )

  // Parking area - better contrast
  const parkingMat = new THREE.MeshStandardMaterial({
    color: '#6a6a6a',
    roughness: 0.7,
    metalness: 0.1,
  })
  const parkingGeo = new THREE.PlaneGeometry(20, 25)
  parkingGeo.rotateX(-Math.PI / 2)
  addMesh(root, parkingGeo, parkingMat, [-28, 0.01, 0], {
    receiveShadow: true,
  })

  // Parking lines - more visible
  const parkingLineMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.5,
    metalness: 0.1,
  })
  const parkingLineGeo = new THREE.PlaneGeometry(15, 0.25)
  parkingLineGeo.rotateX(-Math.PI / 2)
  for (let z = -10; z <= 10; z += 2.5) {
    addMesh(root, parkingLineGeo.clone(), parkingLineMat, [-28, 0.02, z])
  }

  // Road - darker asphalt
  const roadMat = new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.8,
    metalness: 0.05,
  })
  const roadGeo = new THREE.PlaneGeometry(12, 35)
  roadGeo.rotateX(-Math.PI / 2)
  addMesh(root, roadGeo, roadMat, [0, 0.01, 28], { receiveShadow: true })

  // Road center line - visible yellow
  const roadLineMat = new THREE.MeshStandardMaterial({
    color: '#ffff00',
    roughness: 0.4,
  })
  const roadLineGeo = new THREE.PlaneGeometry(0.4, 4)
  roadLineGeo.rotateX(-Math.PI / 2)
  for (let z = 10; z < 45; z += 4) {
    addMesh(root, roadLineGeo.clone(), roadLineMat, [0, 0.02, z])
  }

  // Sign - Q8-style branding area
  const signGroup = new THREE.Group()
  signGroup.position.set(-22, 0, -18)

  const poleMat = new THREE.MeshStandardMaterial({
    color: '#444444',
    roughness: 0.4,
    metalness: 0.5,
  })
  addMesh(signGroup, new THREE.CylinderGeometry(0.25, 0.3, 5, 8), poleMat, [0, 0, 0], {
    castShadow: true,
  })

  // Sign board - bright green (Q8 color)
  const signMat = new THREE.MeshStandardMaterial({
    color: '#00aa00',
    roughness: 0.3,
    metalness: 0.4,
  })
  addMesh(signGroup, new THREE.BoxGeometry(4, 2, 0.15), signMat, [0, 2.5, 0], {
    castShadow: true,
  })

  root.add(signGroup)

  // Street lamps - improved lighting
  const lampGroup1 = new THREE.Group()
  lampGroup1.position.set(18, 0, -22)

  addMesh(
    lampGroup1,
    new THREE.CylinderGeometry(0.2, 0.2, 7, 8),
    poleMat,
    [0, 0, 0],
    { castShadow: true }
  )

  const lampHeadMat = new THREE.MeshStandardMaterial({
    color: '#ffff88',
    emissive: '#ffff00',
    emissiveIntensity: 0.5,
    roughness: 0.4,
  })
  addMesh(
    lampGroup1,
    new THREE.SphereGeometry(0.45, 8, 8),
    lampHeadMat,
    [0, 3.5, 0],
    { castShadow: true }
  )

  root.add(lampGroup1)

  // Second lamp on opposite side
  const lampGroup2 = new THREE.Group()
  lampGroup2.position.set(-18, 0, -22)

  addMesh(
    lampGroup2,
    new THREE.CylinderGeometry(0.2, 0.2, 7, 8),
    poleMat,
    [0, 0, 0],
    { castShadow: true }
  )

  addMesh(
    lampGroup2,
    new THREE.SphereGeometry(0.45, 8, 8),
    lampHeadMat,
    [0, 3.5, 0],
    { castShadow: true }
  )

  root.add(lampGroup2)

  // Additional landscape - trash/recycling area
  const wasteAreaMat = new THREE.MeshStandardMaterial({
    color: '#7a7a7a',
    roughness: 0.6,
  })
  const wasteGeo = new THREE.PlaneGeometry(6, 5)
  wasteGeo.rotateX(-Math.PI / 2)
  addMesh(root, wasteGeo, wasteAreaMat, [30, 0.01, 12], { receiveShadow: true })

  // Waste bins
  const binMat = new THREE.MeshStandardMaterial({
    color: '#444444',
    roughness: 0.5,
  })
  for (let i = 0; i < 3; i++) {
    addMesh(
      root,
      new THREE.BoxGeometry(1.2, 1.5, 1),
      binMat,
      [28 + i * 1.5, 0.75, 12],
      { castShadow: true, receiveShadow: true }
    )
  }

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

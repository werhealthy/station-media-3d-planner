import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { STATION_LAYOUT as L } from '@/domain/stationLayout'
import type { StationModelAdapter } from './types'
import { BRAND_ASSETS } from '@/config/brandAssets'
import {
  loadProceduralVisualAssets,
  type ProceduralVisualAssets,
  type SurfaceTextureSet,
} from './visualAssets'
const mat = (color: string, roughness = 0.55, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness })
function mesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  pos: [number, number, number],
  name: string,
  rotation?: [number, number, number],
) {
  const m = new THREE.Mesh(geo, material)
  m.name = name
  m.position.set(...pos)
  if (rotation) m.rotation.set(...rotation)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}
function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  material: THREE.Material,
  pos: [number, number, number],
  name: string,
  rotation?: [number, number, number],
) {
  return mesh(
    parent,
    new THREE.BoxGeometry(...size),
    material,
    pos,
    name,
    rotation,
  )
}
function roundedBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  radius: number,
  material: THREE.Material,
  pos: [number, number, number],
  name: string,
) {
  const geometry = new RoundedBoxGeometry(...size, 4, radius)
  return mesh(parent, geometry, material, pos, name)
}
function tube(
  parent: THREE.Object3D,
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  name: string,
) {
  return mesh(
    parent,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, radius, 10),
    material,
    [0, 0, 0],
    name,
  )
}

function noiseTexture(
  size: number,
  variation: number,
  repeat: [number, number],
  seed: number,
  colorTexture: boolean,
) {
  const data = new Uint8Array(size * size * 4)
  let state = seed >>> 0
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      state = (state * 1664525 + 1013904223) >>> 0
      const random = state / 0xffffffff
      const broad = Math.sin(x * 0.21) * Math.cos(y * 0.17) * 0.28
      const value = THREE.MathUtils.clamp(
        Math.round(210 + (random - 0.5 + broad) * variation),
        0,
        255,
      )
      const offset = (y * size + x) * 4
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(...repeat)
  texture.anisotropy = 8
  if (colorTexture) texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function aggregateMaterial(
  color: string,
  roughness: number,
  repeat: [number, number],
  seed: number,
  bumpScale: number,
) {
  const map = noiseTexture(128, 56, repeat, seed, true)
  const bumpMap = noiseTexture(128, 76, repeat, seed, false)
  return new THREE.MeshStandardMaterial({
    color,
    map,
    bumpMap,
    bumpScale,
    roughness,
    metalness: 0.01,
  })
}

function pbrSurfaceMaterial(
  textures: SurfaceTextureSet | undefined,
  fallback: {
    color: string
    roughness: number
    repeat: [number, number]
    seed: number
    bumpScale: number
  },
) {
  if (!textures)
    return aggregateMaterial(
      fallback.color,
      fallback.roughness,
      fallback.repeat,
      fallback.seed,
      fallback.bumpScale,
    )
  return new THREE.MeshStandardMaterial({
    color: fallback.color,
    map: textures.map,
    normalMap: textures.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughnessMap: textures.roughnessMap,
    roughness: fallback.roughness,
    metalness: 0.01,
  })
}

function tree(
  root: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
  seed: number,
) {
  const group = new THREE.Group()
  group.name = `landscape-tree-${seed}`
  group.position.set(x, 0, z)
  group.scale.setScalar(scale)
  root.add(group)
  const bark = mat('#72513a', 0.94)
  const darkLeaf = mat('#315d35', 0.93)
  const lightLeaf = mat('#4f7d44', 0.9)
  mesh(
    group,
    new THREE.CylinderGeometry(0.24, 0.34, 4.6, 18),
    bark,
    [0, 2.3, 0],
    'tree-trunk',
  )
  const branches: Array<[number, number, number, number]> = [
    [-0.7, 3.5, 0.1, 0.72],
    [0.65, 3.65, -0.15, -0.68],
    [0.12, 4.05, 0.5, 0.18],
  ]
  for (const [index, branch] of branches.entries())
    mesh(
      group,
      new THREE.CylinderGeometry(0.08, 0.14, 1.65, 12),
      bark,
      [branch[0], branch[1], branch[2]],
      `tree-branch-${index}`,
      [0, 0, branch[3]],
    )
  const lobes: Array<[number, number, number, number, number, number]> = [
    [0, 5.35, 0, 1.9, 1.65, 1.72],
    [-1.35, 4.85, 0.18, 1.35, 1.2, 1.28],
    [1.25, 4.9, -0.18, 1.4, 1.22, 1.34],
    [-0.55, 6.25, -0.1, 1.3, 1.15, 1.22],
    [0.78, 6.05, 0.25, 1.28, 1.12, 1.2],
  ]
  for (const [index, [lx, ly, lz, sx, sy, sz]] of lobes.entries()) {
    const crown = mesh(
      group,
      new THREE.SphereGeometry(1, 20, 14),
      index % 2 ? lightLeaf : darkLeaf,
      [lx, ly, lz],
      `tree-crown-${index}`,
    )
    crown.scale.set(sx, sy, sz)
  }
}

function shrubRow(
  root: THREE.Object3D,
  startX: number,
  z: number,
  count: number,
  spacing: number,
) {
  const foliage = mat('#3d6b3d', 0.96)
  for (let index = 0; index < count; index += 1) {
    const shrub = mesh(
      root,
      new THREE.SphereGeometry(0.58, 16, 10),
      foliage,
      [startX + index * spacing, 0.55, z + Math.sin(index * 1.7) * 0.08],
      'landscape-shrub',
    )
    shrub.scale.set(1.18, 0.82, 0.9)
  }
}

const assetTreePositions: Array<[number, number, number]> = [
  [-21, -14.5, 0.92],
  [-16, -14.2, 1.08],
  [-10.5, -14.6, 0.88],
  [-4.5, -14.2, 1.16],
  [2, -14.5, 0.96],
  [8.5, -14.3, 1.12],
  [15, -14.5, 0.9],
  [21, -14.1, 1.08],
  [-22, -8, 0.9],
  [-22, 4, 1.02],
  [-30, -27.1, 0.92],
  [-22, -27.8, 1.03],
  [-13, -26.9, 0.95],
  [-4, -27.7, 1.08],
  [5, -27.2, 0.9],
  [14, -27.9, 1.05],
  [23, -27.1, 0.94],
  [32, -27.6, 1.02],
  [-35, -18, 0.92],
  [-35, -6, 1.04],
  [35, -17, 0.96],
  [35, -5, 1.02],
  [-32, -39, 0.94],
  [-24, -40, 1.05],
  [-16, -39.2, 0.98],
  [-8, -40.3, 1.08],
  [0, -39.4, 1.02],
  [8, -40.1, 0.96],
  [16, -39.3, 1.07],
  [24, -40.2, 0.98],
  [32, -39.5, 1.04],
  [-35, 7, 0.96],
  [35, 7, 1.02],
]

function createOrganicTrunkGeometry() {
  const geometry = new THREE.CylinderGeometry(0.18, 0.34, 4, 14, 9)
  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index)
    const height = THREE.MathUtils.clamp((y + 2) / 4, 0, 1)
    const x = positions.getX(index)
    const z = positions.getZ(index)
    const irregularity = 1 + Math.sin(index * 2.17 + height * 9) * 0.035
    positions.setXYZ(
      index,
      x * irregularity + Math.sin(height * 2.7) * height * 0.17,
      y,
      z * irregularity + Math.sin(height * 4.1) * height * 0.11,
    )
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function addAssetVegetation(root: THREE.Object3D, source: THREE.Mesh) {
  const sourceMaterial = Array.isArray(source.material)
    ? source.material[0]!
    : source.material
  const foliageMaterial = sourceMaterial.clone()
  if (foliageMaterial instanceof THREE.MeshStandardMaterial) {
    foliageMaterial.color.multiply(new THREE.Color('#c8efb8'))
    foliageMaterial.roughness = 0.9
    foliageMaterial.alphaTest = Math.max(foliageMaterial.alphaTest, 0.28)
  }
  const shrubPositions: Array<[number, number]> = []
  for (let index = 0; index < 29; index += 1)
    shrubPositions.push([
      -20.5 + index * 1.42,
      -15.15 + Math.sin(index * 1.7) * 0.08,
    ])
  for (let index = 0; index < 12; index += 1)
    shrubPositions.push([
      -8.45 + index * 1.52,
      12 + Math.sin(index * 1.7) * 0.08,
    ])
  for (let index = 0; index < 25; index += 1)
    shrubPositions.push([
      -28 + index * 2.32,
      -22.8 + Math.sin(index * 1.15) * 0.38,
    ])
  for (let index = 0; index < 12; index += 1)
    shrubPositions.push([
      -27.4,
      -11 + index * 2.15 + Math.sin(index * 1.35) * 0.16,
    ])
  const foliage = new THREE.InstancedMesh(
    source.geometry,
    foliageMaterial,
    assetTreePositions.length * 9 + shrubPositions.length,
  )
  foliage.name = 'landscape-foliage-pbr'
  foliage.castShadow = false
  foliage.receiveShadow = true
  const transform = new THREE.Object3D()
  let instance = 0

  for (const [treeIndex, [x, z, scale]] of assetTreePositions.entries()) {
    for (let branch = 0; branch < 9; branch += 1) {
      const angle =
        (branch / 9) * Math.PI * 2 + Math.sin(treeIndex * 2.31) * 0.34
      const layer = Math.floor(branch / 3)
      const radius = branch < 2 ? 0.2 : 0.72 + (branch % 3) * 0.34
      transform.position.set(
        x + Math.cos(angle) * radius * scale,
        (3.2 + layer * 0.48 + (branch % 2) * 0.18) * scale,
        z + Math.sin(angle) * radius * scale,
      )
      transform.rotation.set(
        Math.sin(treeIndex + branch) * 0.18,
        angle,
        -0.24 + (branch % 3) * 0.2,
      )
      transform.scale.set(
        (4.35 + (branch % 2) * 0.58) * scale,
        (3.05 + ((treeIndex + branch) % 3) * 0.34) * scale,
        (3.35 + (branch % 3) * 0.3) * scale,
      )
      transform.updateMatrix()
      foliage.setMatrixAt(instance, transform.matrix)
      instance += 1
    }
  }

  for (const [shrubIndex, [x, z]] of shrubPositions.entries()) {
    transform.position.set(x, 0.04, z)
    transform.rotation.set(0, shrubIndex * 2.17, -0.08)
    const scale = 2.45 + (shrubIndex % 4) * 0.18
    transform.scale.set(scale * 1.18, scale, scale)
    transform.updateMatrix()
    foliage.setMatrixAt(instance, transform.matrix)
    instance += 1
  }
  foliage.instanceMatrix.needsUpdate = true
  root.add(foliage)

  const trunks = new THREE.InstancedMesh(
    createOrganicTrunkGeometry(),
    mat('#654838', 0.96),
    assetTreePositions.length,
  )
  trunks.name = 'landscape-trunks-organic'
  trunks.castShadow = true
  trunks.receiveShadow = true
  for (const [index, [x, z, scale]] of assetTreePositions.entries()) {
    transform.position.set(x, 2 * scale, z)
    transform.rotation.set(0, Math.sin(index * 1.7) * 0.35, 0)
    transform.scale.set(scale, scale, scale)
    transform.updateMatrix()
    trunks.setMatrixAt(index, transform.matrix)
  }
  trunks.instanceMatrix.needsUpdate = true
  root.add(trunks)
}

function pump(
  root: THREE.Group,
  x: number,
  z: number,
  index: number,
  q8Texture: THREE.Texture,
) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.name = `fuel-dispenser-${index}`
  root.add(g)

  const stainless = mat('#aeb7be', 0.22, 0.76)
  const darkSteel = mat('#343d45', 0.3, 0.58)
  const navy = mat('#102c78', 0.28, 0.3)
  const black = mat('#10151a', 0.76, 0.04)
  const glass = new THREE.MeshStandardMaterial({
    color: '#0d171d',
    emissive: '#294c54',
    emissiveIntensity: 0.28,
    metalness: 0.28,
    roughness: 0.13,
  })

  box(
    g,
    [3.55, 0.22, 1.82],
    mat('#b5bcc1', 0.45, 0.48),
    [0, 0.18, 0],
    'pump-island',
  )
  roundedBox(
    g,
    [2.88, 2.12, 0.78],
    0.07,
    stainless,
    [0, 1.31, 0],
    'q8-easy-main-body',
  )
  roundedBox(
    g,
    [1.28, 0.69, 0.86],
    0.06,
    navy,
    [0.67, 0.69, 0],
    'q8-easy-lower-cabinet',
  )
  box(
    g,
    [1.28, 1.04, 0.74],
    darkSteel,
    [0.67, 1.57, 0],
    'q8-easy-transaction-column',
  )
  box(
    g,
    [1.07, 0.52, 0.055],
    glass,
    [0.67, 1.78, 0.425],
    'q8-easy-transaction-display',
  )
  box(
    g,
    [1.06, 0.35, 0.06],
    mat('#161d24', 0.52),
    [0.67, 1.28, 0.426],
    'q8-easy-receipt-bay',
  )
  for (const y of [1.89, 1.75, 1.6]) {
    box(
      g,
      [0.5, 0.025, 0.022],
      mat('#7f949a', 0.2),
      [0.67, y, 0.458],
      'q8-easy-display-line',
    )
  }
  for (const xButton of [0.36, 0.57, 0.78, 0.99])
    box(
      g,
      [0.105, 0.07, 0.025],
      mat('#c8d0d4', 0.3),
      [xButton, 1.14, 0.459],
      'q8-easy-display-key',
    )

  const fuelColumns = [
    { x: -1.03, color: '#23864f', label: '#d9f0df' },
    { x: -0.57, color: '#f0f0ec', label: '#e4a11b' },
    { x: -0.11, color: '#242a2f', label: '#f0f0ec' },
  ]
  const rubber = mat('#111316', 0.9, 0.01)
  for (const [gradeIndex, grade] of fuelColumns.entries()) {
    roundedBox(
      g,
      [0.42, 1.86, 0.7],
      0.035,
      stainless,
      [grade.x, 1.39, 0],
      `q8-easy-grade-column-${gradeIndex}`,
    )
    box(
      g,
      [0.31, 0.55, 0.05],
      mat(grade.color, 0.34, 0.12),
      [grade.x, 1.96, 0.405],
      `q8-easy-grade-label-${gradeIndex}`,
    )
    box(
      g,
      [0.12, 0.34, 0.022],
      mat(grade.label, 0.26),
      [grade.x, 2.03, 0.437],
      `q8-easy-grade-stripe-${gradeIndex}`,
    )
    roundedBox(
      g,
      [0.29, 0.66, 0.09],
      0.025,
      black,
      [grade.x, 1.26, 0.405],
      `q8-easy-nozzle-recess-${gradeIndex}`,
    )
    const nozzle = new THREE.Group()
    nozzle.name = `q8-easy-nozzle-${gradeIndex}`
    nozzle.position.set(grade.x, 1.33, 0.49)
    nozzle.rotation.z = gradeIndex === 1 ? -0.08 : 0.08
    g.add(nozzle)
    roundedBox(
      nozzle,
      [0.16, 0.44, 0.13],
      0.025,
      mat(grade.color, 0.38, 0.12),
      [0, 0, 0],
      'q8-easy-nozzle-handle',
    )
    box(nozzle, [0.25, 0.17, 0.17], black, [0, 0.14, 0], 'q8-easy-nozzle-head')
    tube(
      g,
      [
        new THREE.Vector3(grade.x, 1.47, 0.39),
        new THREE.Vector3(grade.x - 0.14, 0.73, 0.62),
        new THREE.Vector3(grade.x - 0.08, 0.23, 0.7),
        new THREE.Vector3(grade.x + 0.05, 1.12, 0.51),
      ],
      0.027,
      rubber,
      `q8-easy-hose-${gradeIndex}`,
    )
  }

  box(
    g,
    [2.98, 0.16, 0.92],
    mat('#cbd1d5', 0.26, 0.68),
    [0, 2.43, 0],
    'q8-easy-top-cap',
  )
  box(g, [2.72, 0.11, 0.76], darkSteel, [0, 0.42, 0], 'q8-easy-base-trim')
  box(g, [2.76, 2.02, 0.055], navy, [0, 1.41, -0.418], 'q8-easy-rear-panel')
  brandPlane(
    g,
    q8Texture,
    [0.76, 0.36],
    [0.67, 0.68, 0.445],
    'q8-easy-cabinet-logo',
  )
}
function brandedMaterial(texture: THREE.Texture, emissiveIntensity = 0.08) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return new THREE.MeshStandardMaterial({
    map: texture,
    emissive: '#ffffff',
    emissiveMap: texture,
    emissiveIntensity,
    transparent: true,
    alphaTest: 0.04,
    roughness: 0.38,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  })
}
function fallbackBrandTexture(color: string) {
  const rgb = new THREE.Color(color)
  const data = new Uint8Array([
    Math.round(rgb.r * 255),
    Math.round(rgb.g * 255),
    Math.round(rgb.b * 255),
    255,
  ])
  const texture = new THREE.DataTexture(data, 1, 1)
  texture.needsUpdate = true
  return texture
}
function brandPlane(
  root: THREE.Object3D,
  texture: THREE.Texture,
  size: [number, number],
  pos: [number, number, number],
  name: string,
  emissiveIntensity = 0.08,
) {
  const image = texture.image as { width?: number; height?: number } | undefined
  const sourceWidth = image?.width ?? size[0]
  const sourceHeight = image?.height ?? size[1]
  const sourceAspect = sourceWidth / Math.max(sourceHeight, 0.001)
  const boundsAspect = size[0] / size[1]
  const containedSize: [number, number] =
    sourceAspect > boundsAspect
      ? [size[0], size[0] / sourceAspect]
      : [size[1] * sourceAspect, size[1]]
  return mesh(
    root,
    new THREE.PlaneGeometry(...containedSize),
    brandedMaterial(texture, emissiveIntensity),
    pos,
    name,
  )
}
function silhouettePlane(
  root: THREE.Object3D,
  texture: THREE.Texture,
  size: [number, number],
  pos: [number, number, number],
  name: string,
) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return mesh(
    root,
    new THREE.PlaneGeometry(...size),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      alphaMap: texture,
      transparent: true,
      alphaTest: 0.04,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
    pos,
    name,
  )
}
function buildStation(
  q8WhiteTexture: THREE.Texture,
  svoltaTexture: THREE.Texture,
  visualAssets: Partial<ProceduralVisualAssets>,
) {
  const root = new THREE.Group()
  root.name = 'q8-station'
  const asphalt = pbrSurfaceMaterial(visualAssets.asphalt, {
      color: '#c7c9ca',
      roughness: 0.96,
      repeat: [18, 13],
      seed: 8217,
      bumpScale: 0.035,
    }),
    concrete = pbrSurfaceMaterial(visualAssets.concrete, {
      color: '#e3e0d9',
      roughness: 0.9,
      repeat: [15, 9],
      seed: 3209,
      bumpScale: 0.018,
    }),
    blue = mat('#123a88', 0.26, 0.35),
    white = mat('#f4f4f1', 0.4, 0.15),
    steel = mat('#77818a', 0.3, 0.65),
    grass = pbrSurfaceMaterial(visualAssets.grass, {
      color: '#a4d28d',
      roughness: 1,
      repeat: [28, 20],
      seed: 9471,
      bumpScale: 0.055,
    })
  const surroundings = mesh(
    root,
    new THREE.PlaneGeometry(360, 280),
    grass,
    [0, -0.045, -22],
    'surrounding-landscape',
    [-Math.PI / 2, 0, 0],
  )
  surroundings.userData.stationHelper = true
  const approachRoad = mesh(
    root,
    new THREE.PlaneGeometry(220, L.road.depth),
    asphalt,
    [0, -0.018, L.road.centerZ],
    'access-road',
    [-Math.PI / 2, 0, 0],
  )
  approachRoad.userData.stationHelper = true
  // Two independent curb cuts create a one-way flow: entrance on the right,
  // exit on the left. No ambiguous T-shaped road markings are used.
  box(
    root,
    [91, 0.08, 1.1],
    concrete,
    [-64.5, 0.015, 12.55],
    'roadside-footpath',
  ).userData.stationHelper = true
  box(
    root,
    [22.5, 0.08, 1.1],
    concrete,
    [-0.25, 0.015, 12.55],
    'roadside-footpath',
  ).userData.stationHelper = true
  box(
    root,
    [91, 0.08, 1.1],
    concrete,
    [64.5, 0.015, 12.55],
    'roadside-footpath',
  ).userData.stationHelper = true
  box(
    root,
    [220, 0.08, 1.35],
    concrete,
    [0, 0.015, 25.55],
    'roadside-footpath',
  ).userData.stationHelper = true
  mesh(
    root,
    new THREE.PlaneGeometry(L.forecourt.width, L.forecourt.depth),
    asphalt,
    [0, 0, 0],
    'forecourt',
    [-Math.PI / 2, 0, 0],
  )
  mesh(
    root,
    new THREE.PlaneGeometry(44, 3.2),
    grass,
    [0, 0.025, -14.35],
    'rear-landscape-lawn',
    [-Math.PI / 2, 0, 0],
  )
  mesh(
    root,
    new THREE.PlaneGeometry(3.2, 24),
    grass,
    [-21.4, 0.025, -1.5],
    'entry-landscape-lawn',
    [-Math.PI / 2, 0, 0],
  )
  box(
    root,
    [L.forecourt.width, 0.1, 1.2],
    concrete,
    [0, 0.04, -15.35],
    'road-curb',
  )
  for (let x = -90; x <= 90; x += 9)
    box(
      root,
      [4.5, 0.025, 0.16],
      mat('#ece7cf', 0.8),
      [x, 0.025, L.road.centerZ],
      'road-marking',
    )
  box(
    root,
    [L.canopy.width, 0.42, L.canopy.depth],
    white,
    [0, L.canopy.height + 0.08, 0],
    'canopy-weather-deck',
  )
  box(
    root,
    [L.canopy.width - 0.7, 0.12, L.canopy.depth - 0.7],
    mat('#d9dcda', 0.58),
    [0, L.canopy.height - 0.35, 0],
    'canopy-undertray',
  )
  for (let x = -10; x <= 10; x += 2.5)
    box(
      root,
      [0.045, 0.08, L.canopy.depth - 0.85],
      steel,
      [x, L.canopy.height - 0.43, 0],
      'undertray-panel-joint',
    )
  for (const x of [-7.8, -2.6, 2.6, 7.8])
    for (const z of [-3.8, 3.8])
      box(
        root,
        [1.2, 0.035, 0.55],
        new THREE.MeshStandardMaterial({
          color: '#fff8dc',
          roughness: 0.12,
          emissive: '#fff1ba',
          emissiveIntensity: 1.6,
        }),
        [x, L.canopy.height - 0.44, z],
        'canopy-light',
      )
  box(
    root,
    [L.canopy.width + 0.15, L.canopy.fasciaHeight, 0.38],
    blue,
    [0, L.canopy.height - 0.1, L.canopy.depth / 2],
    'canopy-fascia-front',
  )
  box(
    root,
    [L.canopy.width + 0.15, L.canopy.fasciaHeight, 0.38],
    blue,
    [0, L.canopy.height - 0.1, -L.canopy.depth / 2],
    'canopy-fascia-back',
  )
  box(
    root,
    [0.38, L.canopy.fasciaHeight, L.canopy.depth],
    blue,
    [-L.canopy.width / 2, L.canopy.height - 0.1, 0],
    'canopy-fascia-side',
  )
  box(
    root,
    [0.38, L.canopy.fasciaHeight, L.canopy.depth],
    blue,
    [L.canopy.width / 2, L.canopy.height - 0.1, 0],
    'canopy-fascia-side',
  )
  for (const x of [-L.canopy.columnX, L.canopy.columnX]) {
    roundedBox(
      root,
      [0.88, 5.35, 0.7],
      0.06,
      steel,
      [x, 2.7, L.canopy.columnZ],
      'canopy-column',
    )
    box(
      root,
      [1.32, 0.24, 1.08],
      concrete,
      [x, 0.14, L.canopy.columnZ],
      'column-foot',
    )
    box(
      root,
      [1.08, 0.12, 0.88],
      blue,
      [x, L.canopy.height - 0.72, L.canopy.columnZ],
      'column-cap',
    )
    box(
      root,
      [1.8, 0.18, 1.2],
      steel,
      [x, L.canopy.height - 0.53, L.canopy.columnZ],
      'column-bearing-head',
    )
  }
  // Slim silver edge trims give the canopy a constructed, layered profile.
  for (const z of [-L.canopy.depth / 2 - 0.205, L.canopy.depth / 2 + 0.205])
    box(
      root,
      [L.canopy.width + 0.35, 0.1, 0.08],
      steel,
      [0, L.canopy.height + 0.23, z],
      'canopy-edge-trim',
    )
  brandPlane(
    root,
    q8WhiteTexture,
    [3.2, 1.55],
    [0, L.canopy.height - 0.05, L.canopy.depth / 2 + 0.205],
    'q8-canopy-logo',
    1.15,
  )
  for (const x of [-L.islands.pumpX, L.islands.pumpX])
    pump(
      root,
      x,
      L.islands.frontZ,
      Math.round(x + L.islands.frontZ * 10),
      q8WhiteTexture,
    )
  const islandRail = mat('#aeb6bc', 0.2, 0.82)
  for (const x of [-L.islands.pumpX, L.islands.pumpX])
    for (const z of [L.islands.frontZ])
      for (const side of [-1, 1]) {
        const railX = x + side * 2.03
        for (const railZ of [z - 0.54, z + 0.54])
          mesh(
            root,
            new THREE.CylinderGeometry(0.045, 0.052, 0.72, 16),
            islandRail,
            [railX, 0.55, railZ],
            'pump-protection-post',
          )
        mesh(
          root,
          new THREE.CylinderGeometry(0.047, 0.047, 1.08, 16),
          islandRail,
          [railX, 0.88, z],
          'pump-protection-rail',
          [Math.PI / 2, 0, 0],
        )
      }
  const shopTeal = mat('#078b83', 0.4, 0.08)
  const shopTealDark = mat('#05736e', 0.46, 0.08)
  const shopWhite = mat('#f4f4f0', 0.42, 0.08)
  const shopWood = mat('#c8a67e', 0.78)
  const shopWoodLight = mat('#dec39c', 0.74)
  const shopCharcoal = mat('#2a292b', 0.62)
  const shopWall = mat('#e7e1d5', 0.74)
  box(
    root,
    [L.shop.width, L.shop.height, 0.34],
    shopWall,
    [L.shop.x, L.shop.height / 2, L.shop.z - L.shop.depth / 2 + 0.17],
    'shop-back-wall',
  )
  for (const side of [-1, 1])
    box(
      root,
      [0.34, L.shop.height, L.shop.depth],
      shopWall,
      [
        L.shop.x + side * (L.shop.width / 2 - 0.17),
        L.shop.height / 2,
        L.shop.z,
      ],
      'shop-side-wall',
    )
  box(
    root,
    [L.shop.width - 0.4, 0.12, L.shop.depth - 0.35],
    mat('#ddd6ca', 0.82),
    [L.shop.x, 0.06, L.shop.z],
    'shop-interior-floor',
  )
  box(
    root,
    [L.shop.width + 0.3, 0.5, L.shop.depth + 0.3],
    shopWhite,
    [L.shop.x, L.shop.height + 0.15, L.shop.z],
    'shop-roof',
  )
  box(
    root,
    [L.shop.width, 0.9, 0.3],
    shopTeal,
    [L.shop.x, 4.35, L.shop.z + L.shop.depth / 2 + 0.16],
    'shop-fascia',
  )
  box(
    root,
    [L.shop.width + 0.3, 0.12, 0.58],
    shopWhite,
    [L.shop.x, 3.84, L.shop.z + L.shop.depth / 2 + 0.12],
    'shop-fascia-lower-profile',
  )
  silhouettePlane(
    root,
    svoltaTexture,
    [3.55, 0.7],
    [L.shop.x + 2.15, 4.38, L.shop.z + L.shop.depth / 2 + 0.34],
    'svolta-brand-white',
  )
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#a7d2d5',
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.62,
    transparent: true,
    opacity: 0.62,
    thickness: 0.08,
    ior: 1.46,
  })
  box(
    root,
    [L.shop.width - 1, 3.2, 0.08],
    new THREE.MeshStandardMaterial({
      color: '#c5a47d',
      emissive: '#80613c',
      emissiveIntensity: 0.2,
      roughness: 0.75,
    }),
    [L.shop.x, 2.15, L.shop.z - L.shop.depth / 2 + 0.36],
    'shop-interior-backdrop',
  )
  // Warm pegboard walls, layered shelves and compact products reproduce the
  // timber-led Svolta retail language visible through the glazing.
  for (const offset of [-5.2, -2.8, -0.4, 2.2, 4.8]) {
    const x = L.shop.x + offset
    for (const [shelfIndex, shelfY] of [0.82, 1.42, 2.02, 2.62].entries()) {
      box(
        root,
        [1.82, 0.08, 0.48],
        mat('#765d42', 0.68),
        [x, shelfY, L.shop.z - L.shop.depth / 2 + 0.45],
        'shop-display-shelf',
      )
      const productColors = ['#d94a3f', '#efb329', '#4b7d9e', '#7d9c4c']
      for (let productIndex = 0; productIndex < 5; productIndex += 1)
        box(
          root,
          [0.2, 0.34 + (productIndex % 2) * 0.07, 0.18],
          mat(
            productColors[(productIndex + shelfIndex) % productColors.length] ??
              '#d94a3f',
            0.5,
          ),
          [
            x - 0.66 + productIndex * 0.33,
            shelfY + 0.2,
            L.shop.z - L.shop.depth / 2 + 0.52,
          ],
          'shop-product',
        )
    }
  }
  const windowOffsets = [-5.65, -3.25, -1.85, 1.85, 3.25, 5.65]
  for (const offset of windowOffsets) {
    const x = L.shop.x + offset
    box(
      root,
      [Math.abs(offset) > 5 ? 1.9 : 1.35, 3, 0.12],
      glass,
      [x, 2.25, L.shop.z + L.shop.depth / 2 + 0.07],
      'shop-window',
    )
  }
  for (const offset of [-6.65, -4.55, -2.45, -1.5, 1.5, 2.45, 4.55, 6.65])
    box(
      root,
      [0.1, 3.35, 0.18],
      shopWhite,
      [L.shop.x + offset, 2.2, L.shop.z + L.shop.depth / 2 + 0.15],
      'glazing-mullion',
    )
  for (const offset of [-0.75, 0.75]) {
    box(
      root,
      [1.42, 3.2, 0.15],
      glass,
      [L.shop.x + offset, 1.82, L.shop.z + L.shop.depth / 2 + 0.16],
      'shop-entry-door',
    )
  }
  // The two leaves meet without a fixed centre mullion. Keeping a frame at
  // x=0 made the open entrance look blocked in both walkthrough and auto tour.
  for (const offset of [-1.5, 1.5]) {
    box(
      root,
      [0.08, 3.25, 0.2],
      shopWhite,
      [L.shop.x + offset, 1.8, L.shop.z + L.shop.depth / 2 + 0.18],
      'door-frame',
    )
  }
  for (const offset of [-0.28, 0.28])
    box(
      root,
      [0.055, 0.72, 0.08],
      mat('#cbd2d6', 0.16, 0.85),
      [L.shop.x + offset, 1.55, L.shop.z + L.shop.depth / 2 + 0.27],
      'door-handle',
    )
  // Teal lower panels and white horizontal trims match the photographic
  // storefront while keeping the glazed interior readable.
  for (const offset of [-4.55, 4.55])
    box(
      root,
      [5.25, 0.88, 0.15],
      shopTeal,
      [L.shop.x + offset, 0.92, L.shop.z + L.shop.depth / 2 + 0.17],
      'shop-lower-teal-panel',
    )
  for (const y of [3.72, 4.03])
    box(
      root,
      [L.shop.width + 0.08, 0.055, 0.12],
      shopWhite,
      [L.shop.x, y, L.shop.z + L.shop.depth / 2 + 0.34],
      'shop-facade-white-stripe',
    )
  const facadeAccent = new THREE.Shape()
  facadeAccent.moveTo(-1.05, -0.42)
  facadeAccent.lineTo(0.74, -0.42)
  facadeAccent.lineTo(1.05, 0.42)
  facadeAccent.lineTo(-0.72, 0.42)
  facadeAccent.closePath()
  mesh(
    root,
    new THREE.ShapeGeometry(facadeAccent),
    shopCharcoal,
    [L.shop.x + 4.75, 1.08, L.shop.z + L.shop.depth / 2 + 0.265],
    'shop-facade-charcoal-accent',
  )
  // The side elevation continues the turquoise cladding and white banding.
  for (let offset = -2.05; offset <= 2.05; offset += 2.05)
    box(
      root,
      [0.12, 3.65, 1.85],
      offset === 0 ? shopTealDark : shopTeal,
      [L.shop.x + L.shop.width / 2 + 0.07, 2.25, L.shop.z + offset],
      'shop-side-cladding',
    )
  box(
    root,
    [L.shop.width + 0.25, 0.42, 0.26],
    shopTealDark,
    [L.shop.x, 0.48, L.shop.z + L.shop.depth / 2 + 0.02],
    'shop-metal-plinth',
  )
  box(
    root,
    [L.shop.width + 1.2, 0.18, 2.1],
    concrete,
    [L.shop.x, 0.1, L.shop.z + L.shop.depth / 2 + 0.9],
    'shop-pavement',
  )
  for (const offset of [-5.2, -1.8, 1.8, 5.2])
    box(
      root,
      [0.12, 0.025, 3.4],
      mat('#f5f1df', 0.74),
      [L.shop.x + offset, 0.02, L.shop.z + L.shop.depth / 2 + 2.05],
      'parking-bay-line',
    )
  for (const offset of [-2.1, 2.1])
    mesh(
      root,
      new THREE.CylinderGeometry(0.09, 0.12, 0.92, 16),
      mat('#7f8990', 0.28, 0.7),
      [L.shop.x + offset, 0.56, L.shop.z + L.shop.depth / 2 + 0.12],
      'shop-entrance-bollard',
    )
  // A low central merchandising island sits left of the walking line, leaving
  // the entrance-to-checkout route unobstructed.
  roundedBox(
    root,
    [3.8, 0.52, 1.5],
    0.06,
    shopWoodLight,
    [L.shop.x - 3.55, 0.34, L.shop.z - 0.25],
    'shop-central-display-island',
  )
  roundedBox(
    root,
    [3.15, 0.34, 1.08],
    0.05,
    shopWood,
    [L.shop.x - 3.55, 0.75, L.shop.z - 0.25],
    'shop-central-display-tier',
  )
  for (let row = 0; row < 2; row += 1)
    for (let productIndex = 0; productIndex < 7; productIndex += 1)
      roundedBox(
        root,
        [0.24, 0.28, 0.22],
        0.03,
        mat(
          ['#c85242', '#efb93e', '#62866d'][productIndex % 3] ?? '#c85242',
          0.52,
        ),
        [
          L.shop.x - 4.82 + productIndex * 0.42,
          1.04,
          L.shop.z - 0.53 + row * 0.56,
        ],
        'shop-island-product',
      )
  // The Svolta identity uses an asymmetric teal field with diagonal edges,
  // rather than a generic rectangular panel.
  const featureWallShape = new THREE.Shape()
  featureWallShape.moveTo(-1.85, -1.18)
  featureWallShape.lineTo(1.24, -1.18)
  featureWallShape.lineTo(1.84, 1.18)
  featureWallShape.lineTo(-1.85, 1.18)
  featureWallShape.closePath()
  mesh(
    root,
    new THREE.ShapeGeometry(featureWallShape),
    shopTeal,
    [L.shop.x + 2.35, 2.05, L.shop.z - L.shop.depth / 2 + 0.5],
    'shop-checkout-oblique-feature-wall',
  )
  const featureWedgeShape = new THREE.Shape()
  featureWedgeShape.moveTo(-0.42, -1.18)
  featureWedgeShape.lineTo(0.14, -1.18)
  featureWedgeShape.lineTo(0.74, 1.18)
  featureWedgeShape.lineTo(0.18, 1.18)
  featureWedgeShape.closePath()
  mesh(
    root,
    new THREE.ShapeGeometry(featureWedgeShape),
    mat('#22a89e', 0.38, 0.06),
    [L.shop.x + 3.45, 2.05, L.shop.z - L.shop.depth / 2 + 0.515],
    'shop-checkout-oblique-highlight',
  )
  silhouettePlane(
    root,
    svoltaTexture,
    [1.35, 0.32],
    [L.shop.x + 1.45, 3.02, L.shop.z - L.shop.depth / 2 + 0.53],
    'shop-interior-svolta-brand-white',
  )
  box(
    root,
    [1.55, 0.82, 0.08],
    mat('#dce9e8', 0.18),
    [L.shop.x + 3.15, 2.25, L.shop.z - L.shop.depth / 2 + 0.5],
    'shop-feature-screen',
  )
  // Angled light-wood checkout with the teal front panel from the references.
  box(
    root,
    [3.2, 1.05, 0.85],
    shopWoodLight,
    [L.shop.x + 2.8, 0.56, L.shop.z - 1.35],
    'shop-checkout-counter',
    [0, -0.17, 0],
  )
  const counterFrontShape = new THREE.Shape()
  counterFrontShape.moveTo(-0.9, -0.42)
  counterFrontShape.lineTo(0.65, -0.42)
  counterFrontShape.lineTo(0.9, 0.42)
  counterFrontShape.lineTo(-0.65, 0.42)
  counterFrontShape.closePath()
  mesh(
    root,
    new THREE.ShapeGeometry(counterFrontShape),
    shopTeal,
    [L.shop.x + 2.42, 0.56, L.shop.z - 0.87],
    'shop-checkout-oblique-front',
  )
  box(
    root,
    [0.42, 0.48, 0.1],
    mat('#15242b', 0.2, 0.18),
    [L.shop.x + 1.65, 1.2, L.shop.z - 0.9],
    'shop-checkout-screen',
  )
  // Bright white ceiling and slim track lights make the interior feel occupied
  // instead of reading as an empty box behind glass.
  box(
    root,
    [L.shop.width - 0.5, 0.12, L.shop.depth - 0.45],
    shopWhite,
    [L.shop.x, L.shop.height - 0.2, L.shop.z],
    'shop-interior-ceiling',
  )
  for (const x of [L.shop.x - 4.6, L.shop.x, L.shop.x + 4.6]) {
    box(
      root,
      [2.6, 0.055, 0.06],
      shopCharcoal,
      [x, L.shop.height - 0.31, L.shop.z - 0.25],
      'shop-track-light-rail',
    )
    for (const offset of [-0.78, 0, 0.78])
      box(
        root,
        [0.26, 0.045, 0.18],
        new THREE.MeshStandardMaterial({
          color: '#fff7da',
          emissive: '#fff0b5',
          emissiveIntensity: 1.4,
          roughness: 0.18,
        }),
        [x + offset, L.shop.height - 0.36, L.shop.z - 0.25],
        'shop-track-light',
      )
  }
  const totem = new THREE.Group()
  totem.position.set(L.totem.x, 0, L.totem.z)
  totem.rotation.y = THREE.MathUtils.degToRad(90)
  totem.name = 'price-pylon'
  root.add(totem)
  // Roadside Q8 sign: a narrow galvanized pole carrying the logo and price
  // panels. The advertising stendardo is mounted beside this pole by the
  // media-point layer, as in the supplied station photographs.
  roundedBox(
    totem,
    [0.24, L.totem.height - 0.25, 0.24],
    0.06,
    steel,
    [0, L.totem.height / 2, 0],
    'price-pylon-structural-frame',
  )
  box(totem, [0.82, 0.18, 0.82], concrete, [0, 0.12, 0], 'price-pylon-base')
  box(
    totem,
    [1.72, 1.42, 0.16],
    blue,
    [0, 6.45, 0.18],
    'price-pylon-brand-panel',
  )
  brandPlane(
    totem,
    q8WhiteTexture,
    [1.46, 0.8],
    [0, 6.7, 0.275],
    'price-pylon-logo',
    0.42,
  )
  roundedBox(
    totem,
    [1.72, 1.62, 0.16],
    0.05,
    mat('#24303c', 0.34, 0.48),
    [0, 4.88, 0.18],
    'price-pylon-deep-inset',
  )
  for (const y of [4.45, 5.02, 5.59]) {
    box(
      totem,
      [1.5, 0.42, 0.06],
      mat('#111b2a', 0.2),
      [0, y, 0.28],
      'price-display-row',
    )
    box(
      totem,
      [0.5, 0.24, 0.035],
      new THREE.MeshStandardMaterial({
        color: '#f2c94c',
        emissive: '#f0a800',
        emissiveIntensity: 1.15,
        roughness: 0.22,
      }),
      [0.43, y, 0.32],
      'price-led-digits',
    )
    box(
      totem,
      [0.68, 0.09, 0.035],
      mat('#dbe3e7', 0.38),
      [-0.42, y, 0.32],
      'fuel-label',
    )
  }
  // Compact entrance island: the supports form one readable sequence instead
  // of floating across an oversized empty forecourt.
  box(root, [21, 0.2, 1.05], concrete, [0, 0.12, 12.65], 'pedestrian-curb')
  box(
    root,
    [18, 0.34, 2.1],
    mat('#86b96f', 0.95),
    [0, 0.22, 11.95],
    'landscape-bed',
  )
  if (visualAssets.foliageMesh)
    addAssetVegetation(root, visualAssets.foliageMesh)
  else {
    shrubRow(root, -20.5, -15.15, 29, 1.42)
    shrubRow(root, -8.45, 12, 12, 1.52)
    const treePositions: Array<[number, number, number]> = [
      [-21, -14.5, 0.92],
      [-16, -14.2, 1.08],
      [-10.5, -14.6, 0.88],
      [-4.5, -14.2, 1.16],
      [2, -14.5, 0.96],
      [8.5, -14.3, 1.12],
      [15, -14.5, 0.9],
      [21, -14.1, 1.08],
      [-22, -8, 0.9],
      [-22, 4, 1.02],
    ]
    for (const [index, [x, z, scale]] of treePositions.entries())
      tree(root, x, z, scale, index + 1)
    let perimeterTreeId = treePositions.length + 1
    for (let x = -34; x <= 34; x += 5.2) {
      tree(
        root,
        x,
        -27.5 + Math.sin(x * 0.37) * 0.9,
        0.92 + ((perimeterTreeId * 17) % 7) * 0.045,
        perimeterTreeId,
      )
      perimeterTreeId += 1
    }
    for (let z = -22; z <= 11; z += 6.3) {
      tree(root, -36, z, 0.82 + (perimeterTreeId % 4) * 0.06, perimeterTreeId)
      perimeterTreeId += 1
      tree(
        root,
        36,
        z + 1.8,
        0.88 + (perimeterTreeId % 3) * 0.06,
        perimeterTreeId,
      )
      perimeterTreeId += 1
    }
  }
  for (const x of [-22, 22])
    for (const z of [-13, 14])
      mesh(
        root,
        new THREE.CylinderGeometry(0.09, 0.13, 7, 10),
        steel,
        [x, 3.5, z],
        'light-pole',
      )
  return root
}
function collect(root: THREE.Object3D) {
  const out: THREE.Mesh[] = []
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) out.push(o)
  })
  return out
}
export const proceduralAdapter: StationModelAdapter = {
  async load() {
    const [q8WhiteTexture, svoltaTexture, visualAssets] =
      import.meta.env.MODE === 'test'
        ? [fallbackBrandTexture('#ffffff'), fallbackBrandTexture('#13877d'), {}]
        : await Promise.all([
            new THREE.TextureLoader().loadAsync(BRAND_ASSETS.q8LogoWhite),
            new THREE.TextureLoader().loadAsync(BRAND_ASSETS.svoltaLogo),
            loadProceduralVisualAssets(),
          ])
    const root = buildStation(q8WhiteTexture, svoltaTexture, visualAssets)
    const meshes = collect(root)
    const boundingBox = new THREE.Box3().setFromObject(root)
    const size = boundingBox.getSize(new THREE.Vector3()).toArray()
    const center = boundingBox.getCenter(new THREE.Vector3()).toArray()
    const materials = new Set<THREE.Material>()
    for (const current of meshes) {
      const currentMaterials = Array.isArray(current.material)
        ? current.material
        : [current.material]
      for (const material of currentMaterials) materials.add(material)
    }
    return {
      root,
      occlusionMeshes: meshes,
      boundingBox,
      diagnostics: {
        source: 'procedural',
        rawSize: size,
        normalizedSize: size,
        center,
        meshCount: meshes.length,
        materialCount: materials.size,
        textureNames: [
          'Q8 logo',
          'Svolta logo',
          visualAssets.asphalt ? 'Poly Haven asphalt 07' : 'aggregate asphalt',
          visualAssets.concrete
            ? 'Poly Haven rough concrete'
            : 'aggregate concrete',
          visualAssets.grass ? 'Poly Haven leafy grass' : 'aggregate grass',
          visualAssets.foliageMesh
            ? 'Poly Haven shrub 04'
            : 'procedural vegetation',
        ],
        missingTextures: [],
        scaleApplied: 1,
        hierarchy: [],
      },
    }
  },
  dispose(handle) {
    for (const m of collect(handle.root)) {
      m.geometry.dispose()
      const materials = Array.isArray(m.material) ? m.material : [m.material]
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose()
        }
        material.dispose()
      }
    }
  },
}

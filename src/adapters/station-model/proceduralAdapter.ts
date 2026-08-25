import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { STATION_LAYOUT as L } from '@/domain/stationLayout'
import type { StationModelAdapter } from './types'
import { BRAND_ASSETS } from '@/config/brandAssets'
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
function pump(root: THREE.Group, x: number, z: number, index: number) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.name = `fuel-dispenser-${index}`
  root.add(g)
  box(
    g,
    [3.2, 0.22, 1.7],
    mat('#b7bec5', 0.35, 0.55),
    [0, 0.18, 0],
    'pump-island',
  )
  const paintedMetal = mat('#102b67', 0.24, 0.42)
  const stainless = mat('#aeb8c0', 0.22, 0.78)
  const rubber = mat('#111418', 0.86, 0.02)
  const plastic = mat('#171c22', 0.3, 0.08)
  roundedBox(
    g,
    [1.42, 1.72, 0.84],
    0.09,
    paintedMetal,
    [0, 1.38, 0],
    'pump-sculpted-body',
  )
  box(g, [1.54, 1.36, 0.06], paintedMetal, [0, 1.34, -0.44], 'pump-rear-panel')
  for (const side of [-1, 1]) {
    box(
      g,
      [0.08, 1.46, 0.72],
      stainless,
      [side * 0.75, 1.38, 0],
      'pump-side-rail',
    )
    box(
      g,
      [0.05, 0.54, 0.48],
      plastic,
      [side * 0.79, 1.42, 0.05],
      'nozzle-holder-recess',
    )
  }
  box(
    g,
    [1.66, 0.12, 0.96],
    mat('#dce2e6', 0.24, 0.5),
    [0, 0.55, 0],
    'pump-lower-trim',
  )
  box(
    g,
    [1.25, 0.7, 0.08],
    new THREE.MeshStandardMaterial({
      color: '#07131a',
      roughness: 0.1,
      metalness: 0.35,
      emissive: '#123d47',
      emissiveIntensity: 0.45,
    }),
    [0, 1.62, 0.45],
    'pump-display',
  )
  roundedBox(g, [2.5, 0.2, 0.94], 0.07, stainless, [0, 2.42, 0], 'pump-header')
  box(g, [1.38, 0.05, 0.78], stainless, [0, 2.18, 0], 'pump-header-seam')
  box(
    g,
    [1.08, 0.08, 0.09],
    mat('#78c7d0', 0.12, 0.15),
    [0, 1.76, 0.5],
    'display-glow',
  )
  for (const bx of [-0.38, 0, 0.38])
    box(
      g,
      [0.24, 0.16, 0.08],
      mat('#e8edf0', 0.35),
      [bx, 1.35, 0.5],
      'pump-keypad',
    )
  for (let i = 0; i < 4; i += 1)
    mesh(
      g,
      new THREE.CylinderGeometry(0.055, 0.055, 0.025, 18),
      mat(i === 0 ? '#2da06f' : '#d8dde1', 0.26),
      [-0.42 + i * 0.28, 1.12, 0.49],
      'grade-selector',
      [Math.PI / 2, 0, 0],
    )
  for (const side of [-1, 1]) {
    tube(
      g,
      [
        new THREE.Vector3(side * 0.69, 1.9, -0.2),
        new THREE.Vector3(side * 1.05, 1.35, -0.1),
        new THREE.Vector3(side * 1.03, 0.62, 0.25),
        new THREE.Vector3(side * 0.78, 1.2, 0.47),
      ],
      0.038,
      rubber,
      `hose-${side}`,
    )
    const nozzle = new THREE.Group()
    nozzle.position.set(side * 0.78, 1.36, 0.48)
    nozzle.rotation.z = side * -0.12
    nozzle.name = `nozzle-${side}`
    g.add(nozzle)
    roundedBox(
      nozzle,
      [0.2, 0.48, 0.15],
      0.035,
      mat(side < 0 ? '#159765' : '#25282d', 0.34, 0.18),
      [0, 0, 0],
      'nozzle-grip',
    )
    box(nozzle, [0.3, 0.18, 0.2], plastic, [0, 0.15, 0], 'nozzle-head')
    mesh(
      nozzle,
      new THREE.CylinderGeometry(0.035, 0.05, 0.34, 12),
      mat('#b9c0c5', 0.18, 0.78),
      [side * 0.09, 0.3, 0],
      'nozzle-spout',
      [0, 0, (side * Math.PI) / 3],
    )
    mesh(
      nozzle,
      new THREE.TorusGeometry(0.1, 0.025, 8, 14, Math.PI * 1.55),
      mat('#17191c', 0.72),
      [0, -0.03, 0],
      'nozzle-trigger-guard',
      [0, Math.PI / 2, 0],
    )
  }
  box(g, [1.2, 0.22, 0.08], stainless, [0, 0.78, 0.47], 'pump-access-trim')
  box(
    g,
    [0.9, 0.15, 0.5],
    mat('#d9dde1', 0.3, 0.5),
    [1.1, 0.43, 0],
    'service-module',
  )

  // Q8 Easy front inspired by the supplied Kuwait reference: three tall fuel
  // grade columns on the left, transaction display on the right and a deep
  // blue lower cabinet. These parts sit on the customer-facing side.
  roundedBox(
    g,
    [2.48, 2.06, 0.16],
    0.06,
    stainless,
    [0, 1.42, 0.47],
    'kuwait-pump-front-frame',
  )
  box(
    g,
    [2.25, 1.86, 0.08],
    mat('#27313a', 0.34, 0.32),
    [0, 1.45, 0.57],
    'kuwait-pump-front-backing',
  )
  const gradeColors = ['#1d8757', '#f2f4ef', '#17191c']
  for (const [gradeIndex, x] of [-0.88, -0.5, -0.12].entries()) {
    box(
      g,
      [0.3, 1.62, 0.12],
      mat('#aeb5ba', 0.32, 0.62),
      [x, 1.55, 0.65],
      `kuwait-grade-column-${gradeIndex}`,
    )
    box(
      g,
      [0.22, 0.54, 0.06],
      mat(gradeColors[gradeIndex]!, 0.44, 0.12),
      [x, 1.91, 0.73],
      `kuwait-grade-label-${gradeIndex}`,
    )
    box(
      g,
      [0.23, 0.58, 0.07],
      mat('#11161c', 0.72),
      [x, 1.22, 0.73],
      `kuwait-nozzle-recess-${gradeIndex}`,
    )
    tube(
      g,
      [
        new THREE.Vector3(x, 1.35, 0.76),
        new THREE.Vector3(x - 0.08, 0.65, 0.92),
        new THREE.Vector3(x + 0.03, 0.18, 0.84),
        new THREE.Vector3(x + 0.05, 1.08, 0.76),
      ],
      0.028,
      rubber,
      `kuwait-hose-${gradeIndex}`,
    )
  }
  box(
    g,
    [0.98, 0.58, 0.1],
    new THREE.MeshStandardMaterial({
      color: '#10171c',
      emissive: '#263d45',
      emissiveIntensity: 0.22,
      roughness: 0.18,
    }),
    [0.62, 1.74, 0.69],
    'kuwait-transaction-display',
  )
  box(
    g,
    [1.02, 0.55, 0.1],
    mat('#111820', 0.5),
    [0.62, 1.12, 0.69],
    'kuwait-receipt-bay',
  )
  roundedBox(
    g,
    [1.16, 0.58, 0.18],
    0.05,
    mat('#102c78', 0.28, 0.28),
    [0.58, 0.58, 0.66],
    'kuwait-blue-cabinet',
  )
}
function brandedMaterial(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return new THREE.MeshStandardMaterial({
    map: texture,
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
) {
  return mesh(
    root,
    new THREE.PlaneGeometry(...size),
    brandedMaterial(texture),
    pos,
    name,
  )
}
function buildStation(q8Texture: THREE.Texture, svoltaTexture: THREE.Texture) {
  const root = new THREE.Group()
  root.name = 'q8-station'
  const asphalt = aggregateMaterial('#4b5055', 0.94, [18, 13], 8217, 0.035),
    concrete = aggregateMaterial('#dad7cf', 0.86, [15, 9], 3209, 0.018),
    blue = mat('#123a88', 0.26, 0.35),
    white = mat('#f4f4f1', 0.4, 0.15),
    steel = mat('#77818a', 0.3, 0.65),
    teal = mat('#16877d', 0.35, 0.2),
    gold = mat('#e4a11b', 0.35, 0.15),
    grass = aggregateMaterial('#678452', 0.98, [28, 20], 9471, 0.055)
  mesh(
    root,
    new THREE.PlaneGeometry(180, 140),
    grass,
    [0, -0.045, -8],
    'surrounding-landscape',
    [-Math.PI / 2, 0, 0],
  )
  mesh(
    root,
    new THREE.PlaneGeometry(120, 13),
    asphalt,
    [0, -0.018, 19.5],
    'access-road',
    [-Math.PI / 2, 0, 0],
  )
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
    new THREE.PlaneGeometry(62, 6),
    grass,
    [0, 0.025, -19.8],
    'rear-landscape-lawn',
    [-Math.PI / 2, 0, 0],
  )
  mesh(
    root,
    new THREE.PlaneGeometry(5.5, 36),
    grass,
    [-29.1, 0.025, -1.5],
    'entry-landscape-lawn',
    [-Math.PI / 2, 0, 0],
  )
  box(
    root,
    [L.forecourt.width, 0.1, 1.2],
    concrete,
    [0, 0.04, -21.5],
    'road-curb',
  )
  for (let x = -27; x <= 27; x += 9)
    box(
      root,
      [4.5, 0.025, 0.16],
      mat('#ece7cf', 0.8),
      [x, 0.025, 18],
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
  for (let x = -12; x <= 12; x += 3)
    box(
      root,
      [0.045, 0.08, L.canopy.depth - 0.85],
      steel,
      [x, L.canopy.height - 0.43, 0],
      'undertray-panel-joint',
    )
  for (const x of [-9, -3, 3, 9])
    for (const z of [-4.8, 4.8])
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
  for (const x of [-7, 7]) {
    roundedBox(
      root,
      [0.88, 5.35, 0.7],
      0.06,
      steel,
      [x, 2.9, 0],
      'canopy-column',
    )
    box(root, [1.32, 0.24, 1.08], concrete, [x, 0.14, 0], 'column-foot')
    box(root, [1.08, 0.12, 0.88], blue, [x, 5.48, 0], 'column-cap')
    box(root, [1.8, 0.18, 1.2], steel, [x, 5.67, 0], 'column-bearing-head')
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
    q8Texture,
    [3.2, 1.55],
    [0, L.canopy.height - 0.05, L.canopy.depth / 2 + 0.205],
    'q8-canopy-logo',
  )
  for (const x of [-5, 5])
    for (const z of [L.islands.frontZ, L.islands.backZ])
      pump(root, x, z, Math.round(x + z * 10))
  box(
    root,
    [L.shop.width, L.shop.height, L.shop.depth - 0.55],
    mat('#dedfda', 0.72),
    [L.shop.x, L.shop.height / 2, L.shop.z - 0.28],
    'shop-structural-shell',
  )
  box(
    root,
    [L.shop.width + 0.3, 0.5, L.shop.depth + 0.3],
    mat('#727c85', 0.35, 0.4),
    [L.shop.x, L.shop.height + 0.15, L.shop.z],
    'shop-roof',
  )
  box(
    root,
    [L.shop.width, 0.9, 0.3],
    teal,
    [L.shop.x, 4.35, L.shop.z + L.shop.depth / 2 + 0.16],
    'shop-fascia',
  )
  box(
    root,
    [L.shop.width + 0.3, 0.12, 0.58],
    steel,
    [L.shop.x, 3.84, L.shop.z + L.shop.depth / 2 + 0.12],
    'shop-fascia-lower-profile',
  )
  brandPlane(
    root,
    svoltaTexture,
    [5.8, 1.05],
    [13, 4.38, L.shop.z + L.shop.depth / 2 + 0.18],
    'svolta-brand',
  )
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#8ab4c3',
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.62,
    transparent: true,
    opacity: 0.72,
    thickness: 0.08,
    ior: 1.46,
  })
  box(
    root,
    [L.shop.width - 1, 3.2, 0.08],
    new THREE.MeshStandardMaterial({
      color: '#ead7ac',
      emissive: '#bc8745',
      emissiveIntensity: 0.32,
      roughness: 0.75,
    }),
    [L.shop.x, 2.15, L.shop.z + L.shop.depth / 2 - 0.42],
    'shop-interior-backdrop',
  )
  for (const x of [6.2, 9.2, 16.8, 19.8]) {
    box(
      root,
      [1.8, 0.08, 0.48],
      mat('#8b7253', 0.65),
      [x, 1.15, L.shop.z + L.shop.depth / 2 - 0.18],
      'shop-display-shelf',
    )
    for (let p = -0.65; p <= 0.65; p += 0.32)
      box(
        root,
        [0.18, 0.4, 0.18],
        mat(p > 0 ? '#e5a72a' : '#9d3340', 0.48),
        [x + p, 1.38, L.shop.z + L.shop.depth / 2 - 0.12],
        'shop-product',
      )
  }
  const windowCenters = [5.65, 8.25, 10.5, 15.5, 17.75, 20.35]
  for (const x of windowCenters)
    box(
      root,
      [x === 5.65 || x === 20.35 ? 2.35 : 1.95, 3, 0.12],
      glass,
      [x, 2.25, L.shop.z + L.shop.depth / 2 + 0.07],
      'shop-window',
    )
  for (const x of [4.35, 6.95, 9.45, 11.5, 14.5, 16.55, 19.05, 21.65])
    box(
      root,
      [0.1, 3.35, 0.18],
      steel,
      [x, 2.2, L.shop.z + L.shop.depth / 2 + 0.15],
      'glazing-mullion',
    )
  for (const x of [12.25, 13.75]) {
    box(
      root,
      [1.42, 3.2, 0.15],
      glass,
      [x, 1.82, L.shop.z + L.shop.depth / 2 + 0.16],
      'shop-entry-door',
    )
  }
  for (const x of [11.5, 13, 14.5]) {
    box(
      root,
      [0.08, 3.25, 0.2],
      steel,
      [x, 1.8, L.shop.z + L.shop.depth / 2 + 0.18],
      'door-frame',
    )
  }
  for (const x of [12.72, 13.28])
    box(
      root,
      [0.055, 0.72, 0.08],
      mat('#cbd2d6', 0.16, 0.85),
      [x, 1.55, L.shop.z + L.shop.depth / 2 + 0.27],
      'door-handle',
    )
  // The reference has a restrained silver-panelled side elevation rather than
  // another repeated glass entrance.
  for (let z = -13.2; z <= -7.1; z += 2.05)
    box(
      root,
      [0.12, 3.65, 1.85],
      mat('#c8cdd0', 0.48, 0.32),
      [L.shop.x + L.shop.width / 2 + 0.07, 2.25, z],
      'shop-side-cladding',
    )
  box(
    root,
    [L.shop.width + 0.25, 0.42, 0.26],
    mat('#b9bdba', 0.42, 0.35),
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
  const totem = new THREE.Group()
  totem.position.set(L.totem.x, 0, L.totem.z)
  totem.name = 'price-pylon'
  root.add(totem)
  roundedBox(
    totem,
    [L.totem.width + 0.34, L.totem.height - 0.55, 0.92],
    0.12,
    steel,
    [0, L.totem.height / 2 + 0.05, 0],
    'price-pylon-structural-frame',
  )
  box(
    totem,
    [L.totem.width - 0.18, L.totem.height - 0.9, 0.97],
    mat('#202b35', 0.34, 0.48),
    [0, L.totem.height / 2, 0],
    'price-pylon-deep-inset',
  )
  box(
    totem,
    [L.totem.width + 0.72, 0.22, 1.34],
    concrete,
    [0, 0.12, 0],
    'price-pylon-base',
  )
  box(
    totem,
    [L.totem.width + 0.38, 0.16, 1.12],
    steel,
    [0, 0.31, 0],
    'price-pylon-base-trim',
  )
  box(
    totem,
    [L.totem.width - 0.3, 2.1, 0.08],
    blue,
    [0, 6.65, 0.5],
    'price-pylon-brand-panel',
  )
  brandPlane(totem, q8Texture, [2.55, 1.3], [0, 7.05, 0.55], 'price-pylon-logo')
  for (const y of [3.2, 4.2, 5.2]) {
    box(
      totem,
      [L.totem.width - 0.35, 0.7, 0.08],
      mat('#111b2a', 0.2),
      [0, y, 0.5],
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
      [0.72, y, 0.55],
      'price-led-digits',
    )
    box(
      totem,
      [0.68, 0.09, 0.035],
      mat('#dbe3e7', 0.38),
      [-0.65, y, 0.55],
      'fuel-label',
    )
  }
  box(
    totem,
    [L.totem.width - 0.35, 1.4, 0.08],
    gold,
    [0, 1.8, 0.5],
    'price-pylon-stendardo-panel',
  )
  for (const x of [L.totem.x - 1.7, L.totem.x + 1.7])
    mesh(
      root,
      new THREE.CylinderGeometry(0.11, 0.14, 1.05, 16),
      steel,
      [x, 0.53, L.totem.z + 0.7],
      'price-pylon-bollard',
    )
  // Human-scale payment kiosk inspired by the Q8 self-service terminal reference.
  const kiosk = new THREE.Group()
  kiosk.position.set(-11.5, 0, -1.2)
  kiosk.name = 'payment-kiosk'
  root.add(kiosk)
  box(kiosk, [0.95, 2.05, 0.62], white, [0, 1.08, 0], 'kiosk-body')
  box(
    kiosk,
    [0.72, 0.82, 0.04],
    mat('#10151b', 0.12, 0.18),
    [0, 1.48, 0.33],
    'kiosk-screen',
  )
  box(
    kiosk,
    [0.3, 0.12, 0.05],
    mat('#282d33', 0.26, 0.35),
    [0.18, 0.9, 0.34],
    'kiosk-reader',
  )
  box(kiosk, [1.08, 0.1, 0.75], steel, [0, 0.08, 0], 'kiosk-foot')
  // Raised pedestrian edge and two restrained planting beds add scale without clutter.
  box(root, [30, 0.2, 1.1], concrete, [-10, 0.12, 14.5], 'pedestrian-curb')
  box(
    root,
    [8.5, 0.34, 1.8],
    mat('#5e6e48', 0.95),
    [-21, 0.22, 13.7],
    'landscape-bed',
  )
  shrubRow(root, -27.5, -16.9, 39, 1.42)
  shrubRow(root, -27.2, 13.75, 10, 0.78)
  const treePositions: Array<[number, number, number]> = [
    [-27, -20.4, 0.92],
    [-22, -20.1, 1.08],
    [-16.5, -20.6, 0.88],
    [-10.5, -20.2, 1.16],
    [-4, -20.5, 0.96],
    [3, -20.3, 1.12],
    [10, -20.5, 0.9],
    [17, -20.1, 1.08],
    [24, -20.6, 0.94],
    [29, -17, 0.86],
    [-29, -12, 0.9],
    [-29, 5, 1.02],
  ]
  for (const [index, [x, z, scale]] of treePositions.entries())
    tree(root, x, z, scale, index + 1)
  for (const x of [-28, 27])
    for (const z of [-16, 15])
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
    const [q8Texture, svoltaTexture] =
      import.meta.env.MODE === 'test'
        ? [fallbackBrandTexture('#153b8c'), fallbackBrandTexture('#13877d')]
        : await Promise.all([
            new THREE.TextureLoader().loadAsync(BRAND_ASSETS.q8Logo),
            new THREE.TextureLoader().loadAsync(BRAND_ASSETS.svoltaLogo),
          ])
    const root = buildStation(q8Texture, svoltaTexture)
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
        textureNames: ['Q8 logo', 'Svolta logo', 'aggregate surfaces'],
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

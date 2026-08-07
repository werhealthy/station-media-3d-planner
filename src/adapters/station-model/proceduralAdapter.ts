import * as THREE from 'three'
import { STATION_LAYOUT as L } from '@/domain/stationLayout'
import type { StationModelAdapter } from './types'
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
) {
  return mesh(parent, new THREE.BoxGeometry(...size), material, pos, name)
}
function labelTexture(text: string, bg = '#133a88', accent = '#f2aa1b') {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 160
  const x = c.getContext('2d')
  if (!x) return null
  x.fillStyle = bg
  x.fillRect(0, 0, c.width, c.height)
  x.fillStyle = 'white'
  x.font = 'bold 82px Arial'
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.fillText(text, 220, 80)
  x.fillStyle = accent
  x.beginPath()
  x.arc(410, 80, 50, 0, Math.PI * 2)
  x.fill()
  x.fillStyle = '#b51d2b'
  x.fillRect(375, 63, 70, 14)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
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
  box(g, [1.5, 2.1, 0.8], mat('#102b67', 0.28, 0.35), [0, 1.32, 0], 'pump-body')
  box(
    g,
    [1.25, 0.7, 0.08],
    mat('#101820', 0.15, 0.2),
    [0, 1.62, 0.45],
    'pump-display',
  )
  box(
    g,
    [1.55, 0.22, 0.92],
    mat('#e6a51c', 0.3, 0.15),
    [0, 2.4, 0],
    'pump-header',
  )
  for (const side of [-1, 1]) {
    mesh(
      g,
      new THREE.TorusGeometry(0.38, 0.045, 8, 18, Math.PI * 1.45),
      mat('#20242a', 0.8),
      [side * 0.75, 1.12, 0],
      `hose-${side}`,
      [0, Math.PI / 2, 0],
    )
    box(
      g,
      [0.15, 0.55, 0.16],
      mat('#19a374', 0.35, 0.3),
      [side * 0.78, 1.35, 0.48],
      `nozzle-${side}`,
    )
  }
  box(
    g,
    [0.9, 0.15, 0.5],
    mat('#d9dde1', 0.3, 0.5),
    [1.1, 0.43, 0],
    'service-module',
  )
}
function buildStation() {
  const root = new THREE.Group()
  root.name = 'q8-station'
  const asphalt = mat('#34383d', 0.92, 0.02),
    concrete = mat('#c9c9c3', 0.82),
    blue = mat('#123a88', 0.26, 0.35),
    white = mat('#f4f4f1', 0.4, 0.15),
    steel = mat('#77818a', 0.3, 0.65),
    teal = mat('#16877d', 0.35, 0.2),
    gold = mat('#e4a11b', 0.35, 0.15)
  mesh(
    root,
    new THREE.PlaneGeometry(L.forecourt.width, L.forecourt.depth),
    asphalt,
    [0, 0, 0],
    'forecourt',
    [-Math.PI / 2, 0, 0],
  )
  box(
    root,
    [L.canopy.width, 0.55, L.canopy.depth],
    white,
    [0, L.canopy.height, 0],
    'canopy-roof',
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
    box(root, [1, 5.75, 0.75], steel, [x, 3, 0], 'canopy-column')
    box(root, [1.18, 0.18, 0.95], concrete, [x, 0.12, 0], 'column-foot')
  }
  const logo = labelTexture('Q8')
  if (logo) {
    const logoMat = new THREE.MeshStandardMaterial({
      map: logo,
      roughness: 0.35,
    })
    mesh(
      root,
      new THREE.PlaneGeometry(4, 1.25),
      logoMat,
      [0, L.canopy.height - 0.05, L.canopy.depth / 2 + 0.2],
      'q8-canopy-logo',
    )
  }
  for (let x = -8; x <= 8; x += 4)
    for (const z of [L.islands.frontZ, L.islands.backZ])
      pump(root, x, z, Math.round(x + z * 10))
  box(
    root,
    [L.shop.width, L.shop.height, L.shop.depth],
    mat('#d9dcda', 0.55),
    [L.shop.x, L.shop.height / 2, L.shop.z],
    'shop-building',
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
    [L.shop.x, 4.35, -L.shop.depth / 2 + L.shop.z - 0.16],
    'shop-fascia',
  )
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#14313d',
    roughness: 0.12,
    metalness: 0.25,
    transmission: 0.18,
    transparent: true,
    opacity: 0.88,
  })
  for (let x = 5; x <= 20; x += 3)
    box(
      root,
      [2.5, 3, 0.12],
      glass,
      [x, 2.25, L.shop.z + L.shop.depth / 2 + 0.07],
      'shop-glazing',
    )
  box(
    root,
    [1.7, 3.25, 0.15],
    glass,
    [13, 1.8, L.shop.z + L.shop.depth / 2 + 0.15],
    'shop-entry',
  )
  box(
    root,
    [L.totem.width, L.totem.height, 0.7],
    steel,
    [L.totem.x, L.totem.height / 2, L.totem.z],
    'price-totem',
  )
  box(
    root,
    [L.totem.width - 0.3, 2.1, 0.08],
    blue,
    [L.totem.x, 6.65, L.totem.z + 0.4],
    'totem-brand',
  )
  for (let y = 3.2; y <= 5.2; y += 1)
    box(
      root,
      [L.totem.width - 0.35, 0.7, 0.08],
      mat('#18233b', 0.3),
      [L.totem.x, y, L.totem.z + 0.4],
      'price-row',
    )
  box(
    root,
    [L.totem.width - 0.35, 1.4, 0.08],
    gold,
    [L.totem.x, 1.8, L.totem.z + 0.4],
    'totem-poster',
  )
  box(root, [22, 0.3, 3.4], concrete, [2, 0.16, 0], 'pump-platform')
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
    const root = buildStation()
    return {
      root,
      occlusionMeshes: collect(root),
      boundingBox: new THREE.Box3().setFromObject(root),
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

import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import type {
  StationHierarchyNode,
  StationModelAdapter,
  StationModelDiagnostics,
  StationModelHandle,
} from './types'

export interface FbxSource {
  url: string
  resourcePath?: string
}

const semanticPatterns = {
  pump: /pump|dispenser|fuel|erogator/i,
  shop: /shop|store|building|market|negozio/i,
  canopy: /canopy|roof|pensilina/i,
  totem: /totem|sign|pylon|insegna/i,
  ground: /ground|floor|terrain|asphalt|forecourt|pavement|suolo/i,
} as const

function semanticHint(name: string): StationHierarchyNode['semanticHint'] {
  return (Object.entries(semanticPatterns) as Array<
    [NonNullable<StationHierarchyNode['semanticHint']>, RegExp]
  >).find(([, pattern]) => pattern.test(name))?.[0]
}

function collectHierarchy(root: THREE.Object3D): StationHierarchyNode[] {
  const nodes: StationHierarchyNode[] = []
  const visit = (node: THREE.Object3D, depth: number) => {
    const isMesh = node instanceof THREE.Mesh
    const hint = semanticHint(node.name)
    nodes.push({
      name: node.name || '(unnamed)',
      type: node.type,
      depth,
      mesh: isMesh,
      ...(hint ? { semanticHint: hint } : {}),
    })
    for (const child of node.children) visit(child, depth + 1)
  }
  visit(root, 0)
  return nodes
}

function collectMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object)
  })
  return meshes
}

function materialList(mesh: THREE.Mesh): THREE.Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material]
}

function textureNames(material: THREE.Material): string[] {
  return Object.values(material)
    .filter((value): value is THREE.Texture => value instanceof THREE.Texture)
    .map((texture) => {
      const data: unknown = texture.source.data
      const sourceUrl =
        typeof data === 'object' && data !== null && 'src' in data && typeof data.src === 'string'
          ? data.src
          : null
      return texture.name || sourceUrl || '(embedded texture)'
    })
}

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose()
  }
  material.dispose()
}

/** Keep metre-sized files unchanged; correct the common centimetre/millimetre exports. */
export function inferMeterScale(size: THREE.Vector3): number {
  const largest = Math.max(size.x, size.y, size.z)
  if (largest > 10_000) return 0.001
  if (largest > 500) return 0.01
  return 1
}

function normalize(root: THREE.Object3D) {
  const rawBox = new THREE.Box3().setFromObject(root)
  if (rawBox.isEmpty()) throw new Error('Il file FBX non contiene geometrie visibili.')
  const rawSize = rawBox.getSize(new THREE.Vector3())
  const scale = inferMeterScale(rawSize)
  root.scale.multiplyScalar(scale)
  root.updateMatrixWorld(true)

  const scaledBox = new THREE.Box3().setFromObject(root)
  const center = scaledBox.getCenter(new THREE.Vector3())
  // Place the lowest point on Y=0 and center the footprint on X/Z.
  root.position.add(new THREE.Vector3(-center.x, -scaledBox.min.y, -center.z))
  root.updateMatrixWorld(true)
  const boundingBox = new THREE.Box3().setFromObject(root)
  return { rawSize, scale, boundingBox }
}

export function createFbxAdapter(source: FbxSource): StationModelAdapter {
  return {
    load(): Promise<StationModelHandle> {
      const missingTextures = new Set<string>()
      const manager = new THREE.LoadingManager()
      manager.onError = (url) => {
        missingTextures.add(url)
        console.warn(`[ExternalStationAdapter] Texture non trovata: ${url}`)
      }
      const loader = new FBXLoader(manager)
      if (source.resourcePath) loader.setResourcePath(source.resourcePath)

      return new Promise((resolve, reject) => {
        loader.load(
          source.url,
          (root) => {
            try {
              root.name ||= 'external-fbx-station'
              const { rawSize, scale, boundingBox } = normalize(root)
              const meshes = collectMeshes(root)
              const materials = new Set<THREE.Material>()
              for (const mesh of meshes) {
                mesh.castShadow = true
                mesh.receiveShadow = true
                for (const material of materialList(mesh)) materials.add(material)
              }
              const textures = new Set(
                [...materials].flatMap((material) => textureNames(material)),
              )
              const size = boundingBox.getSize(new THREE.Vector3())
              const center = boundingBox.getCenter(new THREE.Vector3())
              const diagnostics: StationModelDiagnostics = {
                source: 'external-fbx',
                rawSize: rawSize.toArray(),
                normalizedSize: size.toArray(),
                center: center.toArray(),
                meshCount: meshes.length,
                materialCount: materials.size,
                textureNames: [...textures],
                missingTextures: [...missingTextures],
                scaleApplied: scale,
                hierarchy: collectHierarchy(root),
              }
              console.info('[ExternalStationAdapter] FBX diagnostics', diagnostics)
              if (diagnostics.missingTextures.length) {
                console.warn(
                  '[ExternalStationAdapter] Texture non trovate; la geometria resta disponibile:',
                  diagnostics.missingTextures,
                )
              }
              resolve({ root, occlusionMeshes: meshes, boundingBox, diagnostics })
            } catch (error) {
              reject(error)
            }
          },
          undefined,
          (error) =>
            reject(
              new Error(
                `Impossibile caricare il modello FBX da "${source.url}": ${error instanceof Error ? error.message : String(error)}`,
              ),
            ),
        )
      })
    },
    dispose(handle): void {
      for (const mesh of collectMeshes(handle.root)) {
        mesh.geometry.dispose()
        for (const material of materialList(mesh)) disposeMaterial(material)
      }
    },
  }
}

export const externalStationAdapter = createFbxAdapter({
  url: '/models/q8-station/4002336.FBX',
  resourcePath: '/models/q8-station/Maps/',
})

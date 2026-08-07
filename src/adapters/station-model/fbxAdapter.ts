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

export function resolveTextureUrl(requested: string, basePath: string): string {
  const normalized = decodeURIComponent(requested)
    .replaceAll('\\', '/')
    .split(/[?#]/)[0]!
  const filename = normalized.split('/').pop() || normalized
  const canonical =
    /(?:^|\/)(1[0-3]|[1-9])_map\(4002336\)\.jpg$/i
      .exec(normalized)?.[0]
      ?.split('/')
      .pop()
      ?.toLowerCase() ?? filename
  return `${basePath.endsWith('/') ? basePath : `${basePath}/`}${encodeURIComponent(canonical).replaceAll('%28', '(').replaceAll('%29', ')')}`
}

export const EXPECTED_TEXTURE_FILES = Array.from(
  { length: 13 },
  (_, index) => `${index + 1}_map(4002336).jpg`,
)

const semanticPatterns = {
  pump: /pump|dispenser|fuel|erogator/i,
  shop: /shop|store|building|market|negozio/i,
  canopy: /canopy|roof|pensilina/i,
  totem: /totem|sign|pylon|insegna/i,
  ground: /ground|floor|terrain|asphalt|forecourt|pavement|suolo/i,
} as const

function semanticHint(name: string): StationHierarchyNode['semanticHint'] {
  return (
    Object.entries(semanticPatterns) as Array<
      [NonNullable<StationHierarchyNode['semanticHint']>, RegExp]
    >
  ).find(([, pattern]) => pattern.test(name))?.[0]
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
        typeof data === 'object' &&
        data !== null &&
        'src' in data &&
        typeof data.src === 'string'
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

function sourceOf(texture: THREE.Texture | null | undefined): string | null {
  if (!texture) return null
  const data: unknown = texture.source.data
  return (
    texture.name ||
    (typeof data === 'object' &&
    data !== null &&
    'src' in data &&
    typeof data.src === 'string'
      ? data.src
      : null)
  )
}

function standardizeMappedMaterial(material: THREE.Material): {
  material: THREE.Material
  converted: boolean
} {
  const source = material as THREE.Material & {
    map?: THREE.Texture | null
    alphaMap?: THREE.Texture | null
    color?: THREE.Color
    opacity?: number
    transparent?: boolean
    roughness?: number
    shininess?: number
  }
  if (!source.map || material instanceof THREE.MeshStandardMaterial) {
    if (source.map) source.map.colorSpace = THREE.SRGBColorSpace
    return { material, converted: false }
  }
  source.map.colorSpace = THREE.SRGBColorSpace
  const converted = new THREE.MeshStandardMaterial({
    name: material.name,
    map: source.map,
    alphaMap: source.alphaMap ?? null,
    color: source.color?.clone() ?? new THREE.Color(0xffffff),
    opacity: source.opacity ?? 1,
    transparent: source.transparent ?? (source.opacity ?? 1) < 1,
    side: material.side,
    roughness:
      source.roughness ??
      (source.shininess == null
        ? 0.7
        : THREE.MathUtils.clamp(1 - source.shininess / 100, 0.05, 1)),
  })
  return { material: converted, converted: true }
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
  if (rawBox.isEmpty())
    throw new Error('Il file FBX non contiene geometrie visibili.')
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
    async load(): Promise<StationModelHandle> {
      const missingTextures = new Set<string>()
      const requestedUrls = new Map<string, string>()
      const manager = new THREE.LoadingManager()
      if (source.resourcePath) {
        manager.setURLModifier((requested) => {
          if (requested === source.url || /\.fbx(?:\?|$)/i.test(requested))
            return requested
          const resolved = resolveTextureUrl(requested, source.resourcePath!)
          requestedUrls.set(requested, resolved)
          if (import.meta.env.DEV) {
            void fetch(resolved, { method: 'HEAD' })
              .then((response) =>
                console.info(
                  `[ExternalStationAdapter] Texture richiesta: ${requested} → ${resolved} — ${response.ok ? 'FOUND' : 'MISSING'}`,
                ),
              )
              .catch(() =>
                console.info(
                  `[ExternalStationAdapter] Texture richiesta: ${requested} → ${resolved} — MISSING`,
                ),
              )
          }
          return resolved
        })
      }
      manager.onError = (url) => {
        missingTextures.add(url)
        if (import.meta.env.DEV)
          console.warn(`[ExternalStationAdapter] Texture non trovata: ${url}`)
      }
      const loader = new FBXLoader(manager)
      if (source.resourcePath) loader.setResourcePath(source.resourcePath)

      const textureFiles = await Promise.all(
        EXPECTED_TEXTURE_FILES.map(async (filename) => {
          const url = resolveTextureUrl(filename, source.resourcePath ?? '')
          try {
            const response = await fetch(url, { method: 'HEAD' })
            return { filename, url, found: response.ok }
          } catch {
            return { filename, url, found: false }
          }
        }),
      )
      return new Promise((resolve, reject) => {
        loader.load(
          source.url,
          (root) => {
            try {
              root.name ||= 'external-fbx-station'
              const { rawSize, scale, boundingBox } = normalize(root)
              const meshes = collectMeshes(root)
              const materials = new Set<THREE.Material>()
              let materialsConverted = 0
              for (const mesh of meshes) {
                mesh.castShadow = true
                mesh.receiveShadow = true
                const originals = materialList(mesh)
                const replacements = originals.map((material) => {
                  const result = standardizeMappedMaterial(material)
                  if (result.converted) materialsConverted += 1
                  return result.material
                })
                mesh.material = Array.isArray(mesh.material)
                  ? replacements
                  : replacements[0]!
                replacements.forEach((material) => materials.add(material))
              }
              const textures = new Set(
                [...materials].flatMap((material) => textureNames(material)),
              )
              const size = boundingBox.getSize(new THREE.Vector3())
              const center = boundingBox.getCenter(new THREE.Vector3())
              const fileFound = new Map(
                textureFiles.map((file) => [
                  file.url.toLowerCase(),
                  file.found,
                ]),
              )
              const textureLinks = meshes.flatMap((mesh) =>
                materialList(mesh).map((material) => {
                  const candidate = material as THREE.Material & {
                    map?: THREE.Texture | null
                    color?: THREE.Color
                    roughness?: number
                    shininess?: number
                    opacity?: number
                  }
                  const mapSource = sourceOf(candidate.map)
                  const requested = [...requestedUrls.entries()].find(
                    ([request, resolved]) =>
                      mapSource?.includes(resolved) ||
                      mapSource?.includes(request),
                  )
                  const resolvedUrl =
                    requested?.[1] ??
                    (mapSource
                      ? resolveTextureUrl(mapSource, source.resourcePath ?? '')
                      : '')
                  return {
                    requested: requested?.[0] ?? mapSource ?? '(none)',
                    resolvedUrl,
                    status: (!resolvedUrl
                      ? 'unknown'
                      : fileFound.get(resolvedUrl.toLowerCase()) === false
                        ? 'missing'
                        : 'found') as 'found' | 'missing' | 'unknown',
                    mesh: mesh.name || '(unnamed)',
                    material: material.name || '(unnamed)',
                    materialType: material.type,
                    mapPresent: Boolean(candidate.map),
                    mapSource,
                    color: candidate.color
                      ? `#${candidate.color.getHexString()}`
                      : null,
                    roughness: candidate.roughness ?? null,
                    shininess: candidate.shininess ?? null,
                    opacity: candidate.opacity ?? 1,
                    side: material.side,
                    uvAttributes: Object.keys(mesh.geometry.attributes).filter(
                      (name) => name.startsWith('uv'),
                    ),
                  }
                }),
              )
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
                textureFiles,
                textureLinks,
                materialsConverted,
              }
              if (import.meta.env.DEV)
                console.info(
                  '[ExternalStationAdapter] FBX diagnostics',
                  diagnostics,
                )
              if (import.meta.env.DEV && diagnostics.missingTextures.length) {
                console.warn(
                  '[ExternalStationAdapter] Texture non trovate; la geometria resta disponibile:',
                  diagnostics.missingTextures,
                )
              }
              resolve({
                root,
                occlusionMeshes: meshes,
                boundingBox,
                diagnostics,
              })
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

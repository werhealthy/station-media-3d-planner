import type * as THREE from 'three'

/**
 * Risultato del caricamento di una stazione tramite un adapter: l'oggetto
 * radice da montare nella scena, le mesh da usare per il test di occlusione
 * (mai selezionate per nome hardcoded, vedi docs/ARCHITECTURE.md) e il
 * bounding box per inquadrare la camera iniziale.
 */
export interface StationModelHandle {
  root: THREE.Object3D
  occlusionMeshes: THREE.Object3D[]
  boundingBox: THREE.Box3
  /** Runtime-only facts used by cameras and the technical setup workflow. */
  diagnostics?: StationModelDiagnostics
}

export interface StationHierarchyNode {
  name: string
  type: string
  depth: number
  mesh: boolean
  semanticHint?: 'pump' | 'shop' | 'canopy' | 'totem' | 'ground'
}

export interface StationModelDiagnostics {
  source: 'procedural' | 'external-fbx' | 'external-glb'
  rawSize: [number, number, number]
  normalizedSize: [number, number, number]
  center: [number, number, number]
  meshCount: number
  materialCount: number
  textureNames: string[]
  missingTextures: string[]
  scaleApplied: number
  hierarchy: StationHierarchyNode[]
}

/**
 * Unico punto di accesso ai modelli 3D di una stazione. Nessun componente
 * deve caricare un GLB o generare la stazione procedurale direttamente:
 * deve sempre passare da un'implementazione di questa interfaccia.
 */
export interface StationModelAdapter {
  load(): Promise<StationModelHandle>
  dispose(handle: StationModelHandle): void
}

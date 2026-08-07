import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { StationModelAdapter, StationModelHandle } from './types'

export interface GlbSource {
  url: string
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

function disposeMaterial(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) {
      value.dispose()
    }
  }
  material.dispose()
}

function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose()
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(disposeMaterial)
  } else {
    disposeMaterial(mesh.material)
  }
}

/**
 * Adapter GLB/glTF: nessuna mesh e' mai selezionata per nome hardcoded
 * (le mesh occludenti sono tutte le mesh del modello, genericamente),
 * cosi' i banner restano indipendenti da un particolare file sorgente
 * (vedi docs/ARCHITECTURE.md).
 */
export function createGlbAdapter(source: GlbSource): StationModelAdapter {
  const loader = new GLTFLoader()

  return {
    load(): Promise<StationModelHandle> {
      return new Promise((resolve, reject) => {
        loader.load(
          source.url,
          (gltf) => {
            const root = gltf.scene
            const occlusionMeshes = collectMeshes(root)
            const boundingBox = new THREE.Box3().setFromObject(root)
            resolve({ root, occlusionMeshes, boundingBox })
          },
          undefined,
          (error) => {
            reject(
              new Error(
                `Impossibile caricare il modello GLB da "${source.url}": ${
                  error instanceof Error ? error.message : String(error)
                }`
              )
            )
          }
        )
      })
    },

    dispose(handle: StationModelHandle): void {
      for (const mesh of collectMeshes(handle.root)) {
        disposeMesh(mesh)
      }
    },
  }
}

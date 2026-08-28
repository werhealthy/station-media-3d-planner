import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const POLY_HAVEN_TEXTURE_ROOT =
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k'
const POLY_HAVEN_MODEL_ROOT = 'https://dl.polyhaven.org/file/ph-assets/Models'

export interface SurfaceTextureSet {
  map: THREE.Texture
  normalMap: THREE.Texture
  roughnessMap: THREE.Texture
}

export interface ProceduralVisualAssets {
  asphalt: SurfaceTextureSet
  concrete: SurfaceTextureSet
  grass: SurfaceTextureSet
  foliageMesh: THREE.Mesh | null
}

function configureTexture(
  texture: THREE.Texture,
  repeat: [number, number],
  colorTexture = false,
) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(...repeat)
  texture.anisotropy = 8
  if (colorTexture) texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

async function loadSurfaceTextureSet(
  loader: THREE.TextureLoader,
  assetId: string,
  repeat: [number, number],
) {
  const base = `${POLY_HAVEN_TEXTURE_ROOT}/${assetId}`
  const [map, normalMap, roughnessMap] = await Promise.all([
    loader.loadAsync(`${base}/${assetId}_diff_1k.jpg`),
    loader.loadAsync(`${base}/${assetId}_nor_gl_1k.jpg`),
    loader.loadAsync(`${base}/${assetId}_rough_1k.jpg`),
  ])
  return {
    map: configureTexture(map, repeat, true),
    normalMap: configureTexture(normalMap, repeat),
    roughnessMap: configureTexture(roughnessMap, repeat),
  }
}

async function loadFoliageMesh() {
  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) =>
    url.replace(
      '/Models/gltf/1k/shrub_04/textures/',
      '/Models/jpg/1k/shrub_04/',
    ),
  )
  const gltf = await new GLTFLoader(manager).loadAsync(
    `${POLY_HAVEN_MODEL_ROOT}/gltf/1k/shrub_04/shrub_04_1k.gltf`,
  )
  let foliageMesh: THREE.Mesh | null = null
  gltf.scene.traverse((object) => {
    if (!foliageMesh && object instanceof THREE.Mesh) foliageMesh = object
  })
  return foliageMesh
}

/**
 * Loads the small CC0 asset set used by the procedural station's visual slice.
 * Each promise is independent so a CDN failure degrades only that layer.
 */
export async function loadProceduralVisualAssets(): Promise<
  Partial<ProceduralVisualAssets>
> {
  const textureLoader = new THREE.TextureLoader()
  const [asphalt, concrete, grass, foliageMesh] = await Promise.allSettled([
    loadSurfaceTextureSet(textureLoader, 'asphalt_07', [18, 13]),
    loadSurfaceTextureSet(textureLoader, 'rough_concrete', [15, 9]),
    loadSurfaceTextureSet(textureLoader, 'leafy_grass', [24, 18]),
    loadFoliageMesh(),
  ])
  return {
    asphalt: asphalt.status === 'fulfilled' ? asphalt.value : undefined,
    concrete: concrete.status === 'fulfilled' ? concrete.value : undefined,
    grass: grass.status === 'fulfilled' ? grass.value : undefined,
    foliageMesh:
      foliageMesh.status === 'fulfilled' ? foliageMesh.value : undefined,
  }
}

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CanvasElement,
  Image,
  ImageData,
  createCanvas,
  loadImage,
} from '@napi-rs/canvas'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(scriptDirectory, '..')
const sourceDirectory = path.resolve(
  process.argv[2] ?? path.join(projectDirectory, '..', 'upload'),
)
const outputDirectory = path.resolve(
  process.argv[3] ??
    path.join(
      projectDirectory,
      'public/models/characters/q8-journey-character',
    ),
)
const chunkSize = 700_000

const embeddedImages = new Map()
const imageListeners = new WeakMap()
let embeddedImageIndex = 0
let captureEmbeddedImages = true

class NodeFileReader {
  result = null
  onloadend = null

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result
      this.onloadend?.()
    })
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      const mimeType = blob.type || 'application/octet-stream'
      this.result = `data:${mimeType};base64,${Buffer.from(result).toString('base64')}`
      this.onloadend?.()
    })
  }
}

function createImagePlaceholder() {
  return {
    width: 1,
    height: 1,
    addEventListener(type, listener) {
      const listeners = imageListeners.get(this) ?? {}
      listeners[type] = listener
      imageListeners.set(this, listeners)
    },
    removeEventListener() {},
    set src(value) {
      this.source = value
      queueMicrotask(() => imageListeners.get(this)?.load?.call(this))
    },
    get src() {
      return this.source
    },
  }
}

function createExportCanvas() {
  const canvas = createCanvas(1, 1)
  canvas.toBlob = (callback, mimeType = 'image/png') => {
    const format = mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png'
    callback(new Blob([canvas.toBuffer(format)], { type: format }))
  }
  return canvas
}

globalThis.FileReader = NodeFileReader
globalThis.HTMLImageElement = Image
globalThis.HTMLCanvasElement = CanvasElement
globalThis.ImageData = ImageData
globalThis.window = {
  URL: {
    createObjectURL(blob) {
      if (!captureEmbeddedImages) return 'blob:ignored-animation-texture'
      const url = `blob:journey-character-${++embeddedImageIndex}`
      embeddedImages.set(url, blob)
      return url
    },
  },
}
globalThis.document = {
  createElement(type) {
    if (type === 'canvas') return createExportCanvas()
    return createImagePlaceholder()
  },
  createElementNS() {
    return createImagePlaceholder()
  },
}

function parseFbx(filename) {
  const buffer = fs.readFileSync(path.join(sourceDirectory, filename))
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  )
  return new FBXLoader().parse(arrayBuffer, '')
}

function animationClip(root, name) {
  const clip = root.animations.find(
    (candidate) => candidate.duration > 0 && candidate.tracks.length > 0,
  )
  if (!clip) throw new Error(`Nessuna animazione valida trovata per ${name}`)
  clip.name = name
  clip.optimize()
  return clip
}

function makeWalkingClipInPlace(clip) {
  const hips = clip.tracks.find((track) =>
    track.name.endsWith('Hips.position'),
  )
  if (!hips || hips.values.length < 3) return clip
  const originX = hips.values[0]
  const originZ = hips.values[2]
  for (let index = 0; index < hips.values.length; index += 3) {
    hips.values[index] = originX
    hips.values[index + 2] = originZ
  }
  return clip
}

async function hydrateBaseTextures(root) {
  const hydrated = new Map()
  const pending = []
  root.traverse((object) => {
    if (!object.isMesh) return
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]
    for (const material of materials) {
      if (!material) continue
      for (const value of Object.values(material)) {
        if (!value?.isTexture || !value.image?.src) continue
        const blob = embeddedImages.get(value.image.src)
        if (!blob) continue
        let imagePromise = hydrated.get(value.image.src)
        if (!imagePromise) {
          imagePromise = blob
            .arrayBuffer()
            .then((arrayBuffer) => loadImage(Buffer.from(arrayBuffer)))
          hydrated.set(value.image.src, imagePromise)
        }
        pending.push(
          imagePromise.then((image) => {
            value.image = image
            value.userData.mimeType = blob.type || 'image/png'
            value.needsUpdate = true
          }),
        )
      }
    }
  })
  await Promise.all(pending)
}

const base = parseFbx('Idle.fbx')
base.name = 'Q8JourneyCharacter'
base.scale.setScalar(0.01)
base.traverse((object) => {
  if (!object.isMesh) return
  object.castShadow = true
  object.receiveShadow = true
  object.frustumCulled = false
})
// ImageLoader completa l'assegnazione delle texture nella microtask successiva.
await Promise.resolve()
await hydrateBaseTextures(base)

const clips = [animationClip(base, 'Idle')]
captureEmbeddedImages = false
for (const [filename, name] of [
  ['Walking.fbx', 'Walking'],
  ['Driving.fbx', 'Driving'],
  ['Entering Car.fbx', 'EnteringCar'],
  ['Exiting Car.fbx', 'ExitingCar'],
  ['Standing Using Touchscreen Tablet.fbx', 'Touchscreen'],
]) {
  const source = parseFbx(filename)
  const clip = animationClip(source, name)
  clips.push(name === 'Walking' ? makeWalkingClipInPlace(clip) : clip)
}

const result = await new GLTFExporter().parseAsync(base, {
  animations: clips,
  binary: true,
  maxTextureSize: 2048,
  onlyVisible: false,
  trs: true,
})

const glb = Buffer.from(result)
fs.rmSync(outputDirectory, { recursive: true, force: true })
fs.mkdirSync(outputDirectory, { recursive: true })
const parts = []
for (let offset = 0, index = 0; offset < glb.length; offset += chunkSize) {
  const filename = `part-${String(index).padStart(2, '0')}.glbpart`
  const chunk = glb.subarray(offset, Math.min(offset + chunkSize, glb.length))
  fs.writeFileSync(path.join(outputDirectory, filename), chunk)
  parts.push({ filename, bytes: chunk.length })
  index += 1
}
fs.writeFileSync(
  path.join(outputDirectory, 'manifest.json'),
  `${JSON.stringify(
    {
      version: 1,
      totalBytes: glb.length,
      animations: clips.map((clip) => clip.name),
      parts,
    },
    null,
    2,
  )}\n`,
)

const megabytes = glb.length / 1024 / 1024
console.log(
  `Creato ${path.relative(projectDirectory, outputDirectory)} (${megabytes.toFixed(1)} MB in ${parts.length} parti) con ${clips.length} animazioni.`,
)

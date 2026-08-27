import { createPortal, useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { FuelNozzleModel } from './FuelNozzleModel'

const CHARACTER_MANIFEST_URL =
  '/models/characters/q8-journey-character/manifest.json'

interface CharacterManifest {
  totalBytes: number
  parts: Array<{ filename: string; bytes: number }>
}

class ChunkedCharacterLoader extends THREE.Loader<GLTF> {
  load(
    url: string,
    onLoad: (data: GLTF) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    const absoluteManifestUrl = new URL(url, window.location.href)
    const baseUrl = new URL('.', absoluteManifestUrl)
    fetch(absoluteManifestUrl)
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Character manifest HTTP ${response.status}`)
        return (await response.json()) as CharacterManifest
      })
      .then(async (manifest) => {
        const chunks = await Promise.all(
          manifest.parts.map(async (part) => {
            const response = await fetch(new URL(part.filename, baseUrl))
            if (!response.ok)
              throw new Error(
                `Character part ${part.filename} HTTP ${response.status}`,
              )
            return new Uint8Array(await response.arrayBuffer())
          }),
        )
        const combined = new Uint8Array(manifest.totalBytes)
        let offset = 0
        for (const chunk of chunks) {
          combined.set(chunk, offset)
          offset += chunk.byteLength
        }
        new GLTFLoader(this.manager).parse(
          combined.buffer,
          baseUrl.toString(),
          onLoad,
          onError,
        )
      })
      .catch((error: unknown) => onError?.(error))
  }
}

export type JourneyCharacterAnimation =
  | 'Idle'
  | 'Walking'
  | 'Driving'
  | 'EnteringCar'
  | 'ExitingCar'
  | 'Touchscreen'

const ONE_SHOT_ANIMATIONS = new Set<JourneyCharacterAnimation>([
  'EnteringCar',
  'ExitingCar',
])

interface AnimatedJourneyCharacterProps {
  animation: JourneyCharacterAnimation
  paused?: boolean
  playbackSpeed?: number
  holdingNozzle?: boolean
}

/**
 * One lightweight, reusable clone of the user-provided Mixamo character.
 * All FBX files are consolidated into a single GLB so every instance shares
 * textures and animation data instead of downloading the same 50 MB model
 * once per clip.
 */
export function AnimatedJourneyCharacter({
  animation,
  paused = false,
  playbackSpeed = 1,
  holdingNozzle = false,
}: AnimatedJourneyCharacterProps) {
  const group = useRef<THREE.Group>(null)
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  const { scene, animations } = useLoader(
    ChunkedCharacterLoader,
    CHARACTER_MANIFEST_URL,
  )
  const character = useMemo(() => clone(scene), [scene])
  const rightHand = useMemo(
    () => character.getObjectByName('mixamorig12RightHand'),
    [character],
  )

  useEffect(() => {
    character.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      object.frustumCulled = false
    })
  }, [character])

  useEffect(() => {
    const clip = animations.find((candidate) => candidate.name === animation)
    if (!clip) return
    const nextMixer = new THREE.AnimationMixer(character)
    const action = nextMixer.clipAction(clip)
    const oneShot = ONE_SHOT_ANIMATIONS.has(animation)
    action.clampWhenFinished = oneShot
    action.setLoop(
      oneShot ? THREE.LoopOnce : THREE.LoopRepeat,
      oneShot ? 1 : Infinity,
    )
    action.play()
    mixer.current = nextMixer

    return () => {
      action.stop()
      nextMixer.stopAllAction()
      nextMixer.uncacheRoot(character)
      if (mixer.current === nextMixer) mixer.current = null
    }
  }, [animation, animations, character])

  useFrame((_, delta) => {
    if (!paused) mixer.current?.update(delta * playbackSpeed)
  })

  return (
    <group ref={group} name="animated-journey-character">
      <primitive object={character} />
      {holdingNozzle &&
        rightHand &&
        createPortal(
          <group
            position={[1.5, -2.5, 4]}
            rotation={[0.25, 0.55, -1.25]}
            scale={58}
          >
            <FuelNozzleModel />
          </group>,
          rightHand,
        )}
    </group>
  )
}

useLoader.preload(ChunkedCharacterLoader, CHARACTER_MANIFEST_URL)

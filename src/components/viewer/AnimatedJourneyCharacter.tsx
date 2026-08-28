import { createPortal, useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { FuelNozzleModel } from './FuelNozzleModel'

const CHARACTER_MANIFEST_URL =
  '/models/characters/q8-journey-character/manifest.json'
const CROSS_FADE_SECONDS = 0.28
const MAX_HEAD_YAW = THREE.MathUtils.degToRad(52)
const MAX_HEAD_PITCH = THREE.MathUtils.degToRad(24)

interface CharacterManifest {
  version: number
  totalBytes: number
  parts: Array<{ filename: string; bytes: number }>
}

interface BoneTransform {
  object: THREE.Object3D
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: THREE.Vector3
}

function isCharacterManifest(value: unknown): value is CharacterManifest {
  if (!value || typeof value !== 'object') return false
  const manifest = value as Partial<CharacterManifest>
  return (
    manifest.version === 1 &&
    typeof manifest.totalBytes === 'number' &&
    manifest.totalBytes > 0 &&
    Array.isArray(manifest.parts) &&
    manifest.parts.length > 0 &&
    manifest.parts.every(
      (part) =>
        Boolean(part) &&
        typeof part.filename === 'string' &&
        typeof part.bytes === 'number' &&
        part.bytes > 0,
    )
  )
}

class ChunkedCharacterLoader extends THREE.Loader<GLTF> {
  load(
    url: string,
    onLoad: (data: GLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    const absoluteManifestUrl = new URL(url, window.location.href)
    const baseUrl = new URL('.', absoluteManifestUrl)
    fetch(absoluteManifestUrl)
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Character manifest HTTP ${response.status}`)
        const manifest: unknown = await response.json()
        if (!isCharacterManifest(manifest))
          throw new Error('Character manifest non valido')
        return manifest
      })
      .then(async (manifest) => {
        let loadedBytes = 0
        const chunks = await Promise.all(
          manifest.parts.map(async (part) => {
            const response = await fetch(new URL(part.filename, baseUrl))
            if (!response.ok)
              throw new Error(
                `Character part ${part.filename} HTTP ${response.status}`,
              )
            const chunk = new Uint8Array(await response.arrayBuffer())
            if (chunk.byteLength !== part.bytes)
              throw new Error(`Character part ${part.filename} incompleta`)
            loadedBytes += chunk.byteLength
            onProgress?.(
              new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: loadedBytes,
                total: manifest.totalBytes,
              }),
            )
            return chunk
          }),
        )
        if (loadedBytes !== manifest.totalBytes)
          throw new Error('Character asset incompleto')
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
  'Idle' | 'Walking' | 'Driving' | 'EnteringCar' | 'ExitingCar' | 'Touchscreen'

const ONE_SHOT_ANIMATIONS = new Set<JourneyCharacterAnimation>([
  'EnteringCar',
  'ExitingCar',
])

interface AnimatedJourneyCharacterProps {
  animation: JourneyCharacterAnimation
  paused?: boolean
  playbackSpeed?: number
  holdingNozzle?: boolean
  /** World-space point observed by the character without turning the torso. */
  headLookAt?: readonly [number, number, number]
  /** Keeps both arms in the fueling pose while the head remains free. */
  lockArms?: boolean
  headScan?: boolean
}

function snapshotTransforms(objects: THREE.Object3D[]): BoneTransform[] {
  return objects.map((object) => ({
    object,
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
  }))
}

function applyTransforms(transforms: BoneTransform[]) {
  for (const transform of transforms) {
    transform.object.position.copy(transform.position)
    transform.object.quaternion.copy(transform.quaternion)
    transform.object.scale.copy(transform.scale)
  }
}

/**
 * Reusable clone of the supplied Mixamo rig. A single persistent mixer blends
 * actions instead of recreating the skeleton state at every journey step.
 * Head motion is applied after the base animation, while arm transforms can be
 * frozen independently during fueling so the nozzle never follows a glance.
 */
export function AnimatedJourneyCharacter({
  animation,
  paused = false,
  playbackSpeed = 1,
  holdingNozzle = false,
  headLookAt,
  lockArms = false,
  headScan = false,
}: AnimatedJourneyCharacterProps) {
  const group = useRef<THREE.Group>(null)
  const activeAction = useRef<THREE.AnimationAction | null>(null)
  const lockedArmPose = useRef<BoneTransform[] | null>(null)
  const neckAnimationPose = useRef<THREE.Quaternion | null>(null)
  const headAnimationPose = useRef<THREE.Quaternion | null>(null)
  const lookWeight = useRef(0)
  const headWorldPosition = useMemo(() => new THREE.Vector3(), [])
  const targetWorldPosition = useMemo(() => new THREE.Vector3(), [])
  const localLookDirection = useMemo(() => new THREE.Vector3(), [])
  const rootWorldQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const inverseRootQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const neckOffset = useMemo(() => new THREE.Quaternion(), [])
  const headOffset = useMemo(() => new THREE.Quaternion(), [])
  const { scene, animations } = useLoader(
    ChunkedCharacterLoader,
    CHARACTER_MANIFEST_URL,
  )
  const character = useMemo(() => clone(scene), [scene])
  const mixer = useMemo(() => new THREE.AnimationMixer(character), [character])
  const actions = useMemo(() => {
    const next = new Map<JourneyCharacterAnimation, THREE.AnimationAction>()
    for (const clip of animations) {
      if (
        ![
          'Idle',
          'Walking',
          'Driving',
          'EnteringCar',
          'ExitingCar',
          'Touchscreen',
        ].includes(clip.name)
      )
        continue
      const name = clip.name as JourneyCharacterAnimation
      const action = mixer.clipAction(clip)
      const oneShot = ONE_SHOT_ANIMATIONS.has(name)
      action.clampWhenFinished = oneShot
      action.setLoop(
        oneShot ? THREE.LoopOnce : THREE.LoopRepeat,
        oneShot ? 1 : Infinity,
      )
      next.set(name, action)
    }
    return next
  }, [animations, mixer])
  const rightHand = useMemo(
    () => character.getObjectByName('mixamorig12RightHand'),
    [character],
  )
  const neck = useMemo(
    () => character.getObjectByName('mixamorig12Neck'),
    [character],
  )
  const head = useMemo(
    () => character.getObjectByName('mixamorig12Head'),
    [character],
  )
  const armBones = useMemo(() => {
    const bones: THREE.Object3D[] = []
    character.traverse((object) => {
      if (
        /^mixamorig12(?:Left|Right)(?:Shoulder|Arm|ForeArm|Hand)/.test(
          object.name,
        )
      )
        bones.push(object)
    })
    return bones
  }, [character])

  useEffect(() => {
    character.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      object.frustumCulled = false
    })
  }, [character])

  useEffect(() => {
    const nextAction = actions.get(animation)
    if (!nextAction) return
    const previousAction = activeAction.current
    if (previousAction === nextAction) return
    nextAction.reset().setEffectiveWeight(1).fadeIn(CROSS_FADE_SECONDS).play()
    previousAction?.fadeOut(CROSS_FADE_SECONDS)
    activeAction.current = nextAction
  }, [actions, animation])

  useEffect(() => {
    if (!lockArms) lockedArmPose.current = null
  }, [lockArms])

  useEffect(
    () => () => {
      mixer.stopAllAction()
      mixer.uncacheRoot(character)
    },
    [character, mixer],
  )

  useFrame((state, delta) => {
    if (neck && neckAnimationPose.current)
      neck.quaternion.copy(neckAnimationPose.current)
    if (head && headAnimationPose.current)
      head.quaternion.copy(headAnimationPose.current)

    if (!paused) mixer.update(delta * playbackSpeed)

    if (lockArms) {
      if (!lockedArmPose.current)
        lockedArmPose.current = snapshotTransforms(armBones)
      else applyTransforms(lockedArmPose.current)
    }

    const hasHeadTarget = Boolean(headLookAt && group.current && neck && head)
    lookWeight.current = THREE.MathUtils.damp(
      lookWeight.current,
      hasHeadTarget ? 1 : 0,
      7,
      delta,
    )
    if (!neck || !head) return
    neckAnimationPose.current = neck.quaternion.clone()
    headAnimationPose.current = head.quaternion.clone()
    if (!headLookAt || !group.current || lookWeight.current < 0.001) return

    head.getWorldPosition(headWorldPosition)
    targetWorldPosition.set(...headLookAt)
    group.current.getWorldQuaternion(rootWorldQuaternion)
    inverseRootQuaternion.copy(rootWorldQuaternion).invert()
    localLookDirection
      .subVectors(targetWorldPosition, headWorldPosition)
      .applyQuaternion(inverseRootQuaternion)
      .normalize()
    if (localLookDirection.lengthSq() < 0.001) return

    const horizontalDistance = Math.hypot(
      localLookDirection.x,
      localLookDirection.z,
    )
    const scan = headScan ? Math.sin(state.clock.elapsedTime * 0.72) * 0.075 : 0
    const yaw = THREE.MathUtils.clamp(
      Math.atan2(localLookDirection.x, localLookDirection.z) + scan,
      -MAX_HEAD_YAW,
      MAX_HEAD_YAW,
    )
    const pitch = THREE.MathUtils.clamp(
      Math.atan2(localLookDirection.y, Math.max(horizontalDistance, 0.001)),
      -MAX_HEAD_PITCH,
      MAX_HEAD_PITCH,
    )
    const weight = lookWeight.current
    neckOffset.setFromEuler(
      new THREE.Euler(-pitch * 0.55 * weight, yaw * 0.62 * weight, 0, 'YXZ'),
    )
    headOffset.setFromEuler(
      new THREE.Euler(-pitch * 0.45 * weight, yaw * 0.38 * weight, 0, 'YXZ'),
    )
    neck.quaternion.multiply(neckOffset)
    head.quaternion.multiply(headOffset)
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

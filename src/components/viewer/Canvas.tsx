/* eslint-disable react-hooks/immutability -- R3F renderer exposure is mutable scene state. */
import { Canvas as R3FCanvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Stars } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { StationModel } from './StationModel'
import { MediaPointsLayer } from './MediaPointsLayer'
import { NavigationRig } from './NavigationRig'
import type { StationModelHandle } from '@/adapters/station-model/types'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { useStationStore } from '@/stores/stationStore'
import { getStation } from '@/domain/stations'
import { selectStationAdapter } from '@/adapters/station-model/stationAdapter'
import { useStationSetupStore } from '@/stores/stationSetupStore'
import {
  applyHiddenMeshes,
  boxToRuntimeBounds,
  calculateUsefulBox,
} from '@/three/stationBounds'
import {
  inspectIntersection,
  rotationFromSurfaceNormal,
} from '@/three/stationPicking'
import { StationDebugHelpers } from './StationDebugHelpers'
import { JourneyVehicle } from './JourneyVehicle'
import { JourneyActors } from './JourneyActors'
import { SvoltaDoorController } from './SvoltaDoorController'
import {
  type WeatherCondition,
  useViewerStore,
} from '@/stores/viewerStore'

interface LightingProfile {
  background: string
  fogColor: string
  fogNear: number
  fogFar: number
  horizon: string
  zenith: string
  exposure: number
  ambientIntensity: number
  hemisphereSky: string
  hemisphereGround: string
  hemisphereIntensity: number
  directionalPosition: [number, number, number]
  directionalColor: string
  directionalIntensity: number
  environmentIntensity: number
}

function getLightingProfile(
  isNight: boolean,
  weatherCondition: WeatherCondition,
): LightingProfile {
  if (isNight) {
    if (weatherCondition === 'rain') {
      return {
        background: '#0e1822',
        fogColor: '#18242d',
        fogNear: 35,
        fogFar: 140,
        horizon: '#26343f',
        zenith: '#080e15',
        exposure: 0.86,
        ambientIntensity: 0.19,
        hemisphereSky: '#70829b',
        hemisphereGround: '#121820',
        hemisphereIntensity: 0.52,
        directionalPosition: [18, 24, -12],
        directionalColor: '#9fb7df',
        directionalIntensity: 0.28,
        environmentIntensity: 0.2,
      }
    }
    if (weatherCondition === 'cloudy') {
      return {
        background: '#18212d',
        fogColor: '#202b38',
        fogNear: 55,
        fogFar: 185,
        horizon: '#334052',
        zenith: '#101722',
        exposure: 0.96,
        ambientIntensity: 0.22,
        hemisphereSky: '#788cae',
        hemisphereGround: '#1a2029',
        hemisphereIntensity: 0.62,
        directionalPosition: [18, 24, -12],
        directionalColor: '#a9bde3',
        directionalIntensity: 0.48,
        environmentIntensity: 0.28,
      }
    }
    return {
      background: '#111e38',
      fogColor: '#192844',
      fogNear: 88,
      fogFar: 245,
      horizon: '#253b64',
      zenith: '#071020',
      exposure: 1.08,
      ambientIntensity: 0.25,
      hemisphereSky: '#8299c8',
      hemisphereGround: '#202733',
      hemisphereIntensity: 0.78,
      directionalPosition: [18, 24, -12],
      directionalColor: '#a9c2ff',
      directionalIntensity: 0.92,
      environmentIntensity: 0.38,
    }
  }

  if (weatherCondition === 'rain') {
    return {
      background: '#59656d',
      fogColor: '#69757c',
      fogNear: 32,
      fogFar: 150,
      horizon: '#7f898e',
      zenith: '#3f4b54',
      exposure: 0.8,
      ambientIntensity: 0.28,
      hemisphereSky: '#d5dde1',
      hemisphereGround: '#4c5555',
      hemisphereIntensity: 0.66,
      directionalPosition: [-18, 30, 22],
      directionalColor: '#d6e0e8',
      directionalIntensity: 0.42,
      environmentIntensity: 0.26,
    }
  }
  if (weatherCondition === 'cloudy') {
    return {
      background: '#8b979e',
      fogColor: '#a9b3b7',
      fogNear: 60,
      fogFar: 205,
      horizon: '#b8c1c4',
      zenith: '#69777f',
      exposure: 0.9,
      ambientIntensity: 0.34,
      hemisphereSky: '#eef2f3',
      hemisphereGround: '#626c68',
      hemisphereIntensity: 0.86,
      directionalPosition: [-18, 30, 22],
      directionalColor: '#e6edf2',
      directionalIntensity: 0.78,
      environmentIntensity: 0.36,
    }
  }
  return {
    background: '#83bad5',
    fogColor: '#a2c9d8',
    fogNear: 130,
    fogFar: 245,
    horizon: '#a9d2e4',
    zenith: '#478fbe',
    exposure: 1.04,
    ambientIntensity: 0.27,
    hemisphereSky: '#f4fbff',
    hemisphereGround: '#70786b',
    hemisphereIntensity: 1.08,
    directionalPosition: [-18, 30, 22],
    directionalColor: '#ffffff',
    directionalIntensity: 2.3,
    environmentIntensity: 0.5,
  }
}

function seededRandom(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function GradientSky({ horizon, zenith }: { horizon: string; zenith: string }) {
  const geometry = useMemo(() => {
    const sky = new THREE.SphereGeometry(1, 48, 24)
    const positions = sky.getAttribute('position')
    const colors = new Float32Array(positions.count * 3)
    const horizonColor = new THREE.Color(horizon)
    const zenithColor = new THREE.Color(zenith)
    const color = new THREE.Color()
    for (let index = 0; index < positions.count; index += 1) {
      const blend = THREE.MathUtils.smoothstep(
        positions.getY(index),
        -0.05,
        0.72,
      )
      color.copy(horizonColor).lerp(zenithColor, blend)
      color.toArray(colors, index * 3)
    }
    sky.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return sky
  }, [horizon, zenith])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} scale={240} frustumCulled={false}>
      <meshBasicMaterial
        vertexColors
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function RainField({ groundY, isNight }: { groundY: number; isNight: boolean }) {
  const geometry = useMemo(() => {
    const dropCount = 760
    const positions = new Float32Array(dropCount * 6)
    for (let index = 0; index < dropCount; index += 1) {
      const offset = index * 6
      const x = (seededRandom(index, 1) - 0.5) * 80
      const y = groundY + 1 + seededRandom(index, 2) * 32
      const z = (seededRandom(index, 3) - 0.5) * 70
      const length = 0.45 + seededRandom(index, 4) * 0.7
      positions[offset] = x
      positions[offset + 1] = y
      positions[offset + 2] = z
      positions[offset + 3] = x + 0.08
      positions[offset + 4] = y - length
      positions[offset + 5] = z + 0.03
    }
    const rainGeometry = new THREE.BufferGeometry()
    rainGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    )
    return rainGeometry
  }, [groundY])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    const attribute = geometry.getAttribute('position') as THREE.BufferAttribute
    const positions = attribute.array as Float32Array
    const fall = delta * 20
    const wind = delta * 1.3
    for (let offset = 0; offset < positions.length; offset += 6) {
      const index = offset / 6
      let startX = (positions[offset] ?? 0) + wind
      const startY = (positions[offset + 1] ?? groundY + 25) - fall
      const startZ = positions[offset + 2] ?? 0
      let endX = (positions[offset + 3] ?? startX + 0.08) + wind
      const endY = (positions[offset + 4] ?? startY - 0.7) - fall
      const endZ = positions[offset + 5] ?? startZ + 0.03

      if (startX > 40) {
        startX -= 80
        endX -= 80
      }

      if (startY < groundY + 0.15) {
        const x = (seededRandom(index, 5) - 0.5) * 80
        const y = groundY + 25 + seededRandom(index, 6) * 10
        const z = (seededRandom(index, 7) - 0.5) * 70
        const length = 0.45 + seededRandom(index, 8) * 0.7
        positions[offset] = x
        positions[offset + 1] = y
        positions[offset + 2] = z
        positions[offset + 3] = x + 0.08
        positions[offset + 4] = y - length
        positions[offset + 5] = z + 0.03
      } else {
        positions[offset] = startX
        positions[offset + 1] = startY
        positions[offset + 2] = startZ
        positions[offset + 3] = endX
        positions[offset + 4] = endY
        positions[offset + 5] = endZ
      }
    }
    attribute.needsUpdate = true
  })

  return (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={10}>
      <lineBasicMaterial
        color="#d8ecff"
        transparent
        opacity={isNight ? 0.5 : 0.38}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  )
}

function WetGround({ groundY, isNight }: { groundY: number; isNight: boolean }) {
  return (
    <mesh
      position={[0, groundY + 0.018, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      renderOrder={2}
    >
      <planeGeometry args={[78, 72]} />
      <meshPhysicalMaterial
        color={isNight ? '#111b27' : '#34444d'}
        transparent
        opacity={isNight ? 0.24 : 0.16}
        roughness={0.17}
        metalness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.06}
        envMapIntensity={1.45}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}

function SceneLighting({
  isNight,
  weatherCondition,
}: {
  isNight: boolean
  weatherCondition: WeatherCondition
}) {
  const { gl } = useThree()
  const profile = getLightingProfile(isNight, weatherCondition)
  const artificialLightBoost =
    weatherCondition === 'rain' ? 1.22 : weatherCondition === 'cloudy' ? 1.08 : 1

  useEffect(() => {
    gl.toneMappingExposure = profile.exposure
  }, [gl, profile.exposure])

  return (
    <>
      <color attach="background" args={[profile.background]} />
      <fog
        attach="fog"
        args={[profile.fogColor, profile.fogNear, profile.fogFar]}
      />
      {isNight && weatherCondition === 'clear' ? (
        <Stars
          radius={180}
          depth={70}
          count={1800}
          factor={3}
          fade
          speed={0.25}
        />
      ) : (
        <GradientSky horizon={profile.horizon} zenith={profile.zenith} />
      )}
      <ambientLight intensity={profile.ambientIntensity} />
      <hemisphereLight
        args={[
          profile.hemisphereSky,
          profile.hemisphereGround,
          profile.hemisphereIntensity,
        ]}
      />
      <directionalLight
        position={profile.directionalPosition}
        color={profile.directionalColor}
        intensity={profile.directionalIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={32}
        shadow-camera-bottom={-30}
        shadow-bias={-0.00015}
        shadow-normalBias={0.025}
        shadow-radius={weatherCondition === 'clear' ? 3 : 5}
      />
      {isNight && (
        <>
          {([-7.8, -2.6, 2.6, 7.8] as const).map((x) => (
            <pointLight
              key={x}
              position={[x, 5.15, 1.5]}
              color="#fff3c4"
              intensity={22 * artificialLightBoost}
              distance={15}
              decay={2}
            />
          ))}
          <pointLight
            position={[9.5, 3.9, -5.1]}
            color="#fff0c7"
            intensity={38 * artificialLightBoost}
            distance={19}
            decay={2}
          />
          {[5.8, 9.5, 13.2].map((x) => (
            <pointLight
              key={`svolta-interior-${x}`}
              position={[x, 2.7, -4.85]}
              color="#ffe7b5"
              intensity={24 * artificialLightBoost}
              distance={13}
              decay={2}
            />
          ))}
          <pointLight
            position={[9.5, 2.8, -3.55]}
            color="#ffe3ad"
            intensity={26 * artificialLightBoost}
            distance={12}
            decay={2}
          />
          <pointLight
            position={[0, 5.75, 5.8]}
            color="#dfe9ff"
            intensity={20 * artificialLightBoost}
            distance={16}
            decay={2}
          />
          <pointLight
            position={[23.7, 6.45, 10.1]}
            color="#dce8ff"
            intensity={6 * artificialLightBoost}
            distance={10}
            decay={2}
          />
        </>
      )}
      <Environment
        preset={isNight ? 'night' : 'city'}
        environmentIntensity={profile.environmentIntensity}
      />
    </>
  )
}

export function Canvas() {
  const stationId = useStationStore((state) => state.selectedStationId)
  const station = getStation(stationId)
  const selection = useMemo(() => selectStationAdapter(station), [station])
  const setLoadedModel = useStationRuntimeStore((state) => state.setLoadedModel)
  const setLoadWarning = useStationRuntimeStore((state) => state.setLoadWarning)
  const loadWarning = useStationRuntimeStore((state) => state.loadWarning)
  const diagnostics = useStationRuntimeStore((state) => state.diagnostics)
  const root = useStationRuntimeStore((state) => state.root)
  const setupEnabled = useStationSetupStore((state) => state.enabled)
  const tool = useStationSetupStore((state) => state.tool)
  const config = useStationSetupStore((state) => state.config)
  const configStatus = useStationSetupStore((state) => state.configStatus)
  const timeOfDay = useViewerStore((state) => state.timeOfDay)
  const weatherCondition = useViewerStore((state) => state.weatherCondition)
  const isNight = timeOfDay === 'night'
  const groundY = config.ground?.y ?? 0
  const setSelectedMesh = useStationSetupStore((state) => state.setSelectedMesh)
  const setSelectedMediaPoint = useStationSetupStore(
    (state) => state.setSelectedMediaPoint,
  )
  const setTool = useStationSetupStore((state) => state.setTool)
  const updateConfig = useStationSetupStore((state) => state.updateConfig)
  const setWarning = useStationSetupStore((state) => state.setWarning)
  const handleLoaded = useCallback(
    (handle: StationModelHandle) => {
      const size = handle.boundingBox.getSize(new THREE.Vector3())
      const center = handle.boundingBox.getCenter(new THREE.Vector3())
      setLoadedModel(
        handle.root,
        {
          min: handle.boundingBox.min.toArray(),
          max: handle.boundingBox.max.toArray(),
          center: center.toArray(),
          size: size.toArray(),
        },
        handle.diagnostics ?? null,
      )
    },
    [setLoadedModel],
  )
  useEffect(() => {
    if (!root) return
    applyHiddenMeshes(root, config.hiddenMeshes)
    const useful = boxToRuntimeBounds(
      calculateUsefulBox(root, config.hiddenMeshes),
    )
    if (useful) setLoadedModel(root, useful, diagnostics)
  }, [config.hiddenMeshes, diagnostics, root, setLoadedModel])

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!setupEnabled || !tool) return
      event.stopPropagation()
      const hit = event.intersections.find(
        (item) => item.object instanceof THREE.Mesh && item.object.visible,
      )
      if (!hit) return
      const inspection = inspectIntersection(hit)
      if (!inspection) return
      setSelectedMesh(inspection)
      if (tool === 'ground') {
        updateConfig((current) => ({
          ...current,
          ground: {
            y: inspection.hitPoint[1],
            meshName: inspection.name,
            meshPath: inspection.path,
            normal: inspection.normal,
          },
        }))
        setWarning(null)
        setTool('inspect')
      } else if (tool === 'media') {
        const index = config.mediaPoints.length + 1
        const offset = new THREE.Vector3(...inspection.normal).multiplyScalar(
          0.012,
        )
        const position = new THREE.Vector3(...inspection.hitPoint)
          .add(offset)
          .toArray()
        updateConfig((current) => ({
          ...current,
          mediaPoints: [
            ...current.mediaPoints,
            {
              id: `media-${String(index).padStart(2, '0')}`,
              number: index,
              name: `Media point ${index}`,
              supportShape: 'freestanding',
              type: 'print',
              assignable: true,
              width: 1,
              height: 0.7,
              position,
              normal: inspection.normal,
              rotation: rotationFromSurfaceNormal(inspection.normal),
              attachedMeshName: inspection.name,
              attachedMeshPath: inspection.path,
              location: inspection.name,
              surface: 'Superficie configurata',
            },
          ],
        }))
        setSelectedMediaPoint(`media-${String(index).padStart(2, '0')}`)
        setTool(null)
      } else if (tool === 'walk') {
        const index = config.walkPath.length + 1
        const y = config.ground?.y ?? inspection.hitPoint[1]
        updateConfig((current) => ({
          ...current,
          walkPath: [
            ...current.walkPath,
            {
              id: `WALK_${String(index).padStart(2, '0')}`,
              position: [inspection.hitPoint[0], y, inspection.hitPoint[2]],
            },
          ],
        }))
      }
    },
    [
      config.ground?.y,
      config.mediaPoints.length,
      config.walkPath.length,
      setSelectedMediaPoint,
      setSelectedMesh,
      setTool,
      setWarning,
      setupEnabled,
      tool,
      updateConfig,
    ],
  )
  return (
    <R3FCanvas
      style={{ cursor: setupEnabled && tool ? 'crosshair' : 'grab' }}
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [30, 16, 31], fov: 43, near: 0.1, far: 320 }}
      gl={{
        antialias: true,
        toneMapping: 4,
        toneMappingExposure: 1,
      }}
    >
      <Suspense fallback={null}>
        <SceneLighting
          isNight={isNight}
          weatherCondition={weatherCondition}
        />
        <StationModel
          key={station.id}
          adapter={selection.adapter}
          fallbackAdapter={selection.fallbackAdapter}
          onLoaded={handleLoaded}
          onError={setLoadWarning}
          onPointerDown={handlePointerDown}
        />
        {(station.mediaPointsConfigured || config.mediaPoints.length > 0) && (
          <MediaPointsLayer points={config.mediaPoints} />
        )}
        {weatherCondition === 'rain' && (
          <>
            <WetGround groundY={groundY} isNight={isNight} />
            <RainField groundY={groundY} isNight={isNight} />
          </>
        )}
        <ContactShadows
          position={[0, groundY + 0.05, 0]}
          opacity={
            isNight
              ? weatherCondition === 'rain'
                ? 0.28
                : weatherCondition === 'cloudy'
                  ? 0.34
                  : 0.42
              : weatherCondition === 'rain'
                ? 0.16
                : weatherCondition === 'cloudy'
                  ? 0.21
                  : 0.28
          }
          scale={65}
          blur={weatherCondition === 'clear' ? 2.4 : 3.2}
          far={24}
        />
        <NavigationRig />
        <JourneyVehicle />
        <JourneyActors />
        <SvoltaDoorController />
        {setupEnabled && <StationDebugHelpers />}
        {loadWarning && (
          <Html fullscreen className="pointer-events-none p-4">
            <div className="ml-auto max-w-md rounded-lg bg-amber-950/90 px-4 py-3 text-sm text-white shadow-xl">
              <strong className="block">Modello FBX non disponibile</strong>
              {loadWarning}
            </div>
          </Html>
        )}
        {import.meta.env.DEV && setupEnabled && (
          <Html fullscreen className="pointer-events-none p-3">
            <div className="w-fit rounded bg-slate-950/65 px-2 py-1 text-[11px] font-semibold text-white">
              <div>
                Model:{' '}
                {diagnostics?.source === 'external-fbx'
                  ? 'External FBX ✓'
                  : diagnostics?.source === 'procedural'
                    ? 'Procedural ✓'
                    : 'Loading…'}
              </div>
              <div>
                Config:{' '}
                {configStatus === 'valid'
                  ? 'Loaded ✓'
                  : configStatus === 'not-configured'
                    ? 'Not configured'
                    : configStatus === 'invalid'
                      ? 'Invalid'
                      : 'Loading…'}
              </div>
              {setupEnabled && (
                <span className="ml-2 text-amber-300">Setup: ON</span>
              )}
            </div>
          </Html>
        )}
      </Suspense>
    </R3FCanvas>
  )
}

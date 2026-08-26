/* eslint-disable react-hooks/immutability -- R3F renderer exposure is mutable scene state. */
import { Canvas as R3FCanvas, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  Html,
  Sky,
  Stars,
} from '@react-three/drei'
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
import { FirstPersonAvatar } from './FirstPersonAvatar'
import { JourneyVehicle } from './JourneyVehicle'
import { JourneyActors } from './JourneyActors'
import { JourneyFuelNozzle } from './JourneyFuelNozzle'
import { SvoltaDoors } from './SvoltaDoors'
import { useViewerStore } from '@/stores/viewerStore'

function SceneLighting({ isNight }: { isNight: boolean }) {
  const { gl } = useThree()

  useEffect(() => {
    gl.toneMappingExposure = isNight ? 0.78 : 1.12
  }, [gl, isNight])

  return (
    <>
      <color attach="background" args={[isNight ? '#07122d' : '#a9cfea']} />
      <fog
        attach="fog"
        args={[isNight ? '#0b1731' : '#afcee2', isNight ? 82 : 118, 255]}
      />
      {isNight ? (
        <Stars
          radius={180}
          depth={70}
          count={1800}
          factor={3}
          fade
          speed={0.25}
        />
      ) : (
        <Sky
          distance={450000}
          sunPosition={[-18, 30, 22]}
          turbidity={6.5}
          rayleigh={1.65}
          mieCoefficient={0.005}
          mieDirectionalG={0.82}
        />
      )}
      <ambientLight intensity={isNight ? 0.055 : 0.18} />
      <hemisphereLight
        args={
          isNight ? ['#40598f', '#10151b', 0.34] : ['#edf8ff', '#555950', 1.15]
        }
      />
      <directionalLight
        position={isNight ? [18, 24, -12] : [-18, 30, 22]}
        color={isNight ? '#a9c2ff' : '#ffffff'}
        intensity={isNight ? 0.48 : 2.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={32}
        shadow-camera-bottom={-30}
        shadow-bias={-0.00015}
        shadow-normalBias={0.025}
        shadow-radius={3}
      />
      {isNight && (
        <>
          {([-7.8, -2.6, 2.6, 7.8] as const).map((x) => (
            <pointLight
              key={x}
              position={[x, 5.15, 1.5]}
              color="#fff3c4"
              intensity={22}
              distance={15}
              decay={2}
            />
          ))}
          <pointLight
            position={[9.5, 3.9, -5.1]}
            color="#fff0c7"
            intensity={20}
            distance={13}
            decay={2}
          />
          <pointLight
            position={[-18, 6.7, 10.4]}
            color="#dce8ff"
            intensity={14}
            distance={13}
            decay={2}
          />
        </>
      )}
      <Environment
        preset={isNight ? 'night' : 'city'}
        environmentIntensity={isNight ? 0.16 : 0.42}
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
  const isNight = timeOfDay === 'night'
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
        toneMappingExposure: isNight ? 0.78 : 1.12,
      }}
    >
      <Suspense fallback={null}>
        <SceneLighting isNight={isNight} />
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
        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={isNight ? 0.42 : 0.28}
          scale={65}
          blur={2.4}
          far={24}
        />
        <NavigationRig />
        <FirstPersonAvatar />
        <JourneyVehicle />
        <JourneyActors />
        <JourneyFuelNozzle />
        <SvoltaDoors />
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

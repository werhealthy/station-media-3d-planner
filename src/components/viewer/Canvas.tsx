import { Canvas as R3FCanvas } from '@react-three/fiber'
import { ContactShadows, Environment, Html } from '@react-three/drei'
import { Suspense, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { StationModel } from './StationModel'
import { MediaPointsLayer } from './MediaPointsLayer'
import { proceduralAdapter } from '@/adapters/station-model/proceduralAdapter'
import { NavigationRig } from './NavigationRig'
import { externalStationAdapter } from '@/adapters/station-model/fbxAdapter'
import type { StationModelHandle } from '@/adapters/station-model/types'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
export function Canvas() {
  const external = useMemo(
    () => new URLSearchParams(window.location.search).get('stationModel') === 'external',
    [],
  )
  const setLoadedModel = useStationRuntimeStore((state) => state.setLoadedModel)
  const setLoadWarning = useStationRuntimeStore((state) => state.setLoadWarning)
  const loadWarning = useStationRuntimeStore((state) => state.loadWarning)
  const handleLoaded = useCallback((handle: StationModelHandle) => {
    const size = handle.boundingBox.getSize(new THREE.Vector3())
    const center = handle.boundingBox.getCenter(new THREE.Vector3())
    setLoadedModel(
      {
        min: handle.boundingBox.min.toArray(),
        max: handle.boundingBox.max.toArray(),
        center: center.toArray(),
        size: size.toArray(),
      },
      handle.diagnostics ?? null,
    )
  }, [setLoadedModel])
  return (
    <R3FCanvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [31, 19, 34], fov: 42, near: 0.1, far: 180 }}
      gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 1.12 }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#b8d6ee']} />
        <fog attach="fog" args={['#b8d6ee', 65, 125]} />
        <ambientLight intensity={0.22} />
        <hemisphereLight args={['#edf8ff', '#555950', 1.35]} />
        <directionalLight
          position={[-18, 30, 22]}
          intensity={2.65}
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
        <Environment preset="city" environmentIntensity={0.42} />
        <StationModel
          adapter={external ? externalStationAdapter : proceduralAdapter}
          fallbackAdapter={external ? proceduralAdapter : undefined}
          onLoaded={handleLoaded}
          onError={setLoadWarning}
        />
        {!external && <MediaPointsLayer />}
        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.28}
          scale={65}
          blur={2.4}
          far={24}
        />
        <NavigationRig />
        {loadWarning && (
          <Html fullscreen className="pointer-events-none p-4">
            <div className="ml-auto max-w-md rounded-lg bg-amber-950/90 px-4 py-3 text-sm text-white shadow-xl">
              <strong className="block">Modello FBX non disponibile</strong>
              {loadWarning}
            </div>
          </Html>
        )}
      </Suspense>
    </R3FCanvas>
  )
}

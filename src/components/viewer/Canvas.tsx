import { Canvas as R3FCanvas } from '@react-three/fiber'
import { ContactShadows, Environment } from '@react-three/drei'
import { Suspense } from 'react'
import { StationModel } from './StationModel'
import { MediaPointsLayer } from './MediaPointsLayer'
import { proceduralAdapter } from '@/adapters/station-model/proceduralAdapter'
import { NavigationRig } from './NavigationRig'
export function Canvas() {
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
        <StationModel adapter={proceduralAdapter} />
        <MediaPointsLayer />
        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.28}
          scale={65}
          blur={2.4}
          far={24}
        />
        <NavigationRig />
      </Suspense>
    </R3FCanvas>
  )
}

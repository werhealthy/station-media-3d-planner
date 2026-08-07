import { Canvas as R3FCanvas } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { StationModel } from './StationModel'
import { MediaPointsLayer } from './MediaPointsLayer'
import { proceduralAdapter } from '@/adapters/station-model/proceduralAdapter'
export function Canvas() {
  return (
    <R3FCanvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [31, 19, 34], fov: 42, near: 0.1, far: 180 }}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#b8d6ee']} />
        <fog attach="fog" args={['#b8d6ee', 65, 125]} />
        <ambientLight intensity={0.65} />
        <hemisphereLight args={['#d9efff', '#494b42', 1.25]} />
        <directionalLight
          position={[-18, 30, 22]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-38}
          shadow-camera-right={38}
          shadow-camera-top={32}
          shadow-camera-bottom={-30}
        />
        <Environment preset="city" environmentIntensity={0.5} />
        <StationModel adapter={proceduralAdapter} />
        <MediaPointsLayer />
        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.28}
          scale={65}
          blur={2.4}
          far={24}
        />
        <OrbitControls
          makeDefault
          target={[1, 2, -2]}
          enablePan={false}
          minDistance={36}
          maxDistance={58}
          minPolarAngle={Math.PI * 0.23}
          maxPolarAngle={Math.PI * 0.42}
          minAzimuthAngle={-0.15}
          maxAzimuthAngle={1.25}
        />
      </Suspense>
    </R3FCanvas>
  )
}

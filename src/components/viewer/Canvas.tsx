import { Canvas as R3FCanvas } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { StationModel } from './StationModel'
import { proceduralAdapter } from '@/adapters/station-model/proceduralAdapter'

export function Canvas() {
  return (
    <R3FCanvas shadows="basic">
      <Suspense fallback={null}>
        {/* Illuminazione */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[20, 30, 15]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />

        {/* Camera principale - vista overview leggermente angolata */}
        <PerspectiveCamera
          makeDefault
          position={[28, 14, 42]}
          fov={60}
          near={0.1}
          far={200}
        />

        {/* Controlli camera */}
        <OrbitControls
          autoRotate={false}
          autoRotateSpeed={4}
          enableDamping
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={150}
        />

        {/* Stazione (via StationModelAdapter, mai generata/caricata direttamente qui) */}
        <StationModel adapter={proceduralAdapter} />

        {/* Background */}
        <color attach="background" args={['#87ceeb']} />
      </Suspense>
    </R3FCanvas>
  )
}

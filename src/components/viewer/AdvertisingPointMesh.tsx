import { useRef } from 'react'
import * as THREE from 'three'
import type { AdvertisingPoint } from '@/domain/schemas/banner'
import { useViewerStore } from '@/stores/viewerStore'

interface AdvertisingPointMeshProps {
  banner: AdvertisingPoint
  onSelect: (id: string) => void
}

export function AdvertisingPointMesh({ banner, onSelect }: AdvertisingPointMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const selectedObjectId = useViewerStore((s) => s.selectedObjectId)
  const isSelected = selectedObjectId === banner.id

  // Colore diverso per digital vs print
  const baseColor = banner.type === 'digital' ? '#00cc00' : '#ff9900'
  const emissiveColor = isSelected ? baseColor : undefined
  const emissiveIntensity = isSelected ? 0.5 : 0

  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity,
    roughness: 0.4,
    metalness: banner.type === 'digital' ? 0.8 : 0.3,
  })

  return (
    <mesh
      ref={meshRef}
      position={[banner.position.x, banner.position.y, banner.position.z]}
      rotation={[
        (banner.rotation.x * Math.PI) / 180,
        (banner.rotation.y * Math.PI) / 180,
        (banner.rotation.z * Math.PI) / 180,
      ]}
      scale={[banner.dimensions.width, banner.dimensions.height, 0.1]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation()
        onSelect(banner.id)
      }}
      onPointerEnter={() => useViewerStore.setState({ hoveredObjectId: banner.id })}
      onPointerLeave={() => useViewerStore.setState({ hoveredObjectId: null })}
    >
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={material} attach="material" />

      {/* Label con nome del banner */}
      <group position={[0, 0, 0.05]}>
        <mesh position={[0, 0.55, 0]}>
          <planeGeometry args={[2, 0.3]} />
          <meshStandardMaterial
            color="#000000"
            transparent
            opacity={0.7}
            emissive="#ffffff"
            emissiveIntensity={0.2}
          />
        </mesh>
      </group>
    </mesh>
  )
}

import { useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import { useViewerStore } from '@/stores/viewerStore'
import { useProjectStore } from '@/stores/projectStore'

export function AdvertisingPointEditor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformRef = useRef<any>(null)
  const selectedObjectId = useViewerStore((s) => s.selectedObjectId)
  const transformMode = useViewerStore((s) => s.transformMode)
  const getAdvertisingPoint = useProjectStore((s) => s.getAdvertisingPoint)
  const updateAdvertisingPoint = useProjectStore((s) => s.updateAdvertisingPoint)

  const selectedBanner = selectedObjectId ? getAdvertisingPoint(selectedObjectId) : null

  const handleObjectChange = () => {
    if (!selectedBanner || !transformRef.current) return

    const pos = transformRef.current.position
    const rot = transformRef.current.rotation
    const scale = transformRef.current.scale

    updateAdvertisingPoint(selectedBanner.id, {
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: {
        x: (rot.x * 180) / Math.PI,
        y: (rot.y * 180) / Math.PI,
        z: (rot.z * 180) / Math.PI,
      },
      dimensions: { width: Math.abs(scale.x), height: Math.abs(scale.y) },
    })
  }

  if (!selectedBanner) return null

  return (
    <TransformControls ref={transformRef} mode={transformMode} onObjectChange={handleObjectChange}>
      <mesh
        position={[selectedBanner.position.x, selectedBanner.position.y, selectedBanner.position.z]}
        rotation={[
          (selectedBanner.rotation.x * Math.PI) / 180,
          (selectedBanner.rotation.y * Math.PI) / 180,
          (selectedBanner.rotation.z * Math.PI) / 180,
        ]}
        scale={[selectedBanner.dimensions.width, selectedBanner.dimensions.height, 0.1]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </TransformControls>
  )
}

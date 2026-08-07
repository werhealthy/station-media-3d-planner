import { Html, RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { MediaPoint } from '@/domain/mediaPoints'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { useImageTexture } from '@/hooks/useImageTexture'

export function MediaPointMarker({ point }: { point: MediaPoint }) {
  const selected = useViewerStore((s) => s.selectedMediaPointId === point.id),
    hovered = useViewerStore((s) => s.hoveredMediaPointId === point.id)
  const select = useViewerStore((s) => s.selectMediaPoint),
    hover = useViewerStore((s) => s.hoverMediaPoint),
    asset = useProjectStore((s) => s.assignments[point.id])
  const texture = useImageTexture(asset?.url)
  const stop = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    select(point.id)
  }
  return (
    <group
      position={point.position}
      rotation={
        point.rotation.map((v) => (v * Math.PI) / 180) as [
          number,
          number,
          number,
        ]
      }
      name={`media-point-${point.number}`}
    >
      <RoundedBox
        args={[point.width + 0.12, point.height + 0.12, 0.12]}
        radius={0.05}
        smoothness={3}
        castShadow
      >
        <meshStandardMaterial
          color={selected ? '#55a5ff' : hovered ? '#75b7ff' : '#132d64'}
          metalness={0.5}
          roughness={0.25}
        />
      </RoundedBox>
      <mesh
        position={[0, 0, 0.071]}
        onClick={stop}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover(point.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hover(null)
          document.body.style.cursor = 'default'
        }}
      >
        <planeGeometry args={[point.width, point.height]} />
        <meshStandardMaterial
          map={texture}
          color={
            texture ? 'white' : point.type === 'digital' ? '#173e91' : '#e6a52c'
          }
          emissive={point.type === 'digital' ? '#092d77' : '#000000'}
          emissiveIntensity={texture ? 0.12 : 0.3}
        />
      </mesh>
      <Html
        position={[point.width / 2 + 0.16, point.height / 2 + 0.16, 0.12]}
        center
        zIndexRange={[20, 0]}
      >
        <button
          aria-label={`Media point ${point.number}: ${point.name}`}
          onClick={() => select(point.id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-extrabold text-white shadow-lg transition-transform ${selected ? 'scale-125 bg-[#ffb31a]' : 'bg-[#1954c6] hover:scale-110'}`}
        >
          {point.number}
        </button>
      </Html>
    </group>
  )
}

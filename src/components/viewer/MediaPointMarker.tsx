import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { useImageTexture } from '@/hooks/useImageTexture'
import { containedSurfaceSize } from '@/core/creative/creativeFit'
import { MediaSupportGeometry } from './MediaSupportGeometry'

export function MediaPointMarker({ point }: { point: ConfigMediaPoint }) {
  const selected = useViewerStore((s) => s.selectedMediaPointId === point.id)
  const hovered = useViewerStore((s) => s.hoveredMediaPointId === point.id)
  const select = useViewerStore((s) => s.selectMediaPoint)
  const hover = useViewerStore((s) => s.hoverMediaPoint)
  const asset = useProjectStore((s) => s.assignments[point.id])
  const availableSurface = useMemo<[number, number]>(() => {
    if (point.supportShape === 'beach-flag')
      return [point.width * 0.68, point.height * 0.78]
    return [point.width, point.height]
  }, [point.height, point.supportShape, point.width])
  const texture = useImageTexture(asset?.url)
  const surfaceSize = useMemo<[number, number]>(() => {
    if (!asset) return availableSurface
    return containedSurfaceSize(
      availableSurface[0],
      availableSurface[1],
      asset.width,
      asset.height,
    )
  }, [asset, availableSurface])
  const frameColor = selected
    ? '#55a5ff'
    : hovered
      ? '#75b7ff'
      : point.type === 'digital'
        ? '#132d64'
        : '#6c737a'

  const stop = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    select(point.id)
  }

  return (
    <group
      position={point.position}
      rotation={
        point.rotation.map((value) => (value * Math.PI) / 180) as [
          number,
          number,
          number,
        ]
      }
      name={`media-point-${point.number}`}
    >
      <MediaSupportGeometry point={point} color={frameColor} />
      <mesh
        position={[0, 0, 0.071]}
        onClick={stop}
        onPointerOver={(event) => {
          event.stopPropagation()
          hover(point.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hover(null)
          document.body.style.cursor = 'default'
        }}
      >
        <planeGeometry args={surfaceSize} />
        <meshStandardMaterial
          map={texture}
          color={
            texture
              ? 'white'
              : point.assignable
                ? point.type === 'digital'
                  ? '#173e91'
                  : '#e6a52c'
                : '#263041'
          }
          emissive={point.type === 'digital' ? '#092d77' : '#000000'}
          emissiveIntensity={
            texture ? 0.12 : point.type === 'digital' ? 0.3 : 0
          }
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

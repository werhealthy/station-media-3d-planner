import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { useProjectStore } from '@/stores/projectStore'
import { DEFAULT_CREATIVE_DISPLAY } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { useImageTexture } from '@/hooks/useImageTexture'
import { containedSurfaceSize } from '@/core/creative/creativeFit'
import { BRAND_ASSETS, SMARTOPT_SCREEN_SIZE } from '@/config/brandAssets'
import { getJourney } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { MediaSupportGeometry } from './MediaSupportGeometry'

export function MediaPointMarker({ point }: { point: ConfigMediaPoint }) {
  const selected = useViewerStore((s) => s.selectedMediaPointId === point.id)
  const hovered = useViewerStore((s) => s.hoveredMediaPointId === point.id)
  const navigationMode = useViewerStore((s) => s.navigationMode)
  const select = useViewerStore((s) => s.selectMediaPoint)
  const hover = useViewerStore((s) => s.hoverMediaPoint)
  const asset = useProjectStore((s) => s.assignments[point.id])
  const display = useProjectStore(
    (s) => s.creativeDisplay[point.id] ?? DEFAULT_CREATIVE_DISPLAY,
  )
  const routeId = usePlaybackStore((s) => s.activeRouteId)
  const stepIndex = usePlaybackStore((s) => s.activeStepIndex)
  const route = getJourney(routeId)
  const smartOptScreen = route.steps[stepIndex]?.terminalScreen ?? 'idle'
  const journeyScreen =
    point.supportTypeId === '11'
      ? {
          url: BRAND_ASSETS.smartOptScreens[smartOptScreen],
          ...SMARTOPT_SCREEN_SIZE,
        }
      : undefined
  const displayedAsset =
    point.supportTypeId === '11' && navigationMode === 'auto'
      ? journeyScreen
      : asset ?? journeyScreen
  const availableSurface = useMemo<[number, number]>(() => {
    if (point.supportShape === 'beach-flag')
      return [point.width * 0.68, point.height * 0.78]
    return [point.width, point.height]
  }, [point.height, point.supportShape, point.width])
  const flagSurface = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-point.width / 2, -point.height / 2)
    shape.lineTo(-point.width / 2, point.height / 2)
    shape.quadraticCurveTo(
      point.width * 0.2,
      point.height * 0.56,
      point.width / 2,
      point.height * 0.34,
    )
    shape.quadraticCurveTo(
      point.width * 0.32,
      -point.height * 0.12,
      point.width * 0.12,
      -point.height / 2,
    )
    shape.closePath()
    return shape
  }, [point.height, point.width])
  const targetSurface = useMemo<[number, number]>(
    () =>
      point.supportShape === 'beach-flag' && display.fitMode === 'cover'
        ? [point.width, point.height]
        : availableSurface,
    [availableSurface, display.fitMode, point.height, point.supportShape, point.width],
  )
  const texture = useImageTexture(
    displayedAsset?.url,
    displayedAsset
      ? {
          sourceAspectRatio: displayedAsset.width / displayedAsset.height,
          targetAspectRatio: targetSurface[0] / targetSurface[1],
          fitMode: display.fitMode,
          rotation: display.rotation,
          offsetX: display.offsetX,
          offsetY: display.offsetY,
        }
      : undefined,
  )
  const surfaceSize = useMemo<[number, number]>(() => {
    if (!displayedAsset) return availableSurface
    if (display.fitMode === 'cover') return targetSurface
    return containedSurfaceSize(
      availableSurface[0],
      availableSurface[1],
      displayedAsset.width,
      displayedAsset.height,
    )
  }, [availableSurface, display.fitMode, displayedAsset, targetSurface])
  const surfaceDepth =
    point.supportShape === 'fondostazione'
      ? 0.101
      : point.supportShape === 'structural-sign'
        ? 0.081
        : 0.071
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

  if (!point.assignable)
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
        name={`structural-point-${point.number}`}
      >
        <MediaSupportGeometry point={point} color="#3f4a58" />
      </group>
    )

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
        position={[0, 0, surfaceDepth]}
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
        {point.supportShape === 'beach-flag' &&
        display.fitMode === 'cover' ? (
          <shapeGeometry args={[flagSurface]} />
        ) : (
          <planeGeometry args={surfaceSize} />
        )}
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
      {displayedAsset && display.fitMode === 'contain' && (
        <mesh position={[0, 0, surfaceDepth - 0.002]}>
          <planeGeometry args={availableSurface} />
          <meshStandardMaterial color={display.backgroundColor} />
        </mesh>
      )}
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

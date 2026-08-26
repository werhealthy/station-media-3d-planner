import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { useImageTexture } from '@/hooks/useImageTexture'
import {
  containedSurfaceSize,
  orientCreativeToPortrait,
} from '@/core/creative/creativeFit'
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
      : (asset ?? journeyScreen)
  const orientedCreative = useMemo(() => {
    if (!displayedAsset) return undefined
    return point.supportShape === 'beach-flag'
      ? orientCreativeToPortrait(displayedAsset.width, displayedAsset.height)
      : {
          width: displayedAsset.width,
          height: displayedAsset.height,
          rotationRadians: 0,
        }
  }, [displayedAsset, point.supportShape])
  const rotateBeachFlagCreative = Boolean(orientedCreative?.rotationRadians)
  const availableSurface = useMemo<[number, number]>(() => {
    if (point.supportShape === 'beach-flag')
      return [point.width * 0.68, point.height * 0.78]
    return [point.width, point.height]
  }, [point.height, point.supportShape, point.width])
  const texture = useImageTexture(displayedAsset?.url)
  const displayTexture = useMemo(() => {
    if (!texture || !rotateBeachFlagCreative) return texture
    const rotated = texture.clone()
    rotated.center.set(0.5, 0.5)
    rotated.rotation = orientedCreative?.rotationRadians ?? 0
    rotated.needsUpdate = true
    return rotated
  }, [orientedCreative?.rotationRadians, rotateBeachFlagCreative, texture])
  useEffect(
    () => () => {
      if (displayTexture && displayTexture !== texture) displayTexture.dispose()
    },
    [displayTexture, texture],
  )
  const surfaceSize = useMemo<[number, number]>(() => {
    if (!displayedAsset) return availableSurface
    return containedSurfaceSize(
      availableSurface[0],
      availableSurface[1],
      orientedCreative?.width ?? displayedAsset.width,
      orientedCreative?.height ?? displayedAsset.height,
    )
  }, [availableSurface, displayedAsset, orientedCreative])
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
          map={displayTexture}
          color={
            displayTexture
              ? 'white'
              : point.assignable
                ? point.type === 'digital'
                  ? '#173e91'
                  : '#e6a52c'
                : '#263041'
          }
          emissive={point.type === 'digital' ? '#092d77' : '#000000'}
          emissiveIntensity={
            displayTexture ? 0.12 : point.type === 'digital' ? 0.3 : 0
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

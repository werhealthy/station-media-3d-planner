import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ConfigMediaPoint } from '@/domain/stationConfig'
import {
  DEFAULT_CREATIVE_DISPLAY,
  useProjectStore,
} from '@/stores/projectStore'
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
  const creativeDisplay = useProjectStore(
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
  const texture = useImageTexture(
    displayedAsset?.url,
    displayedAsset
      ? {
          sourceAspectRatio:
            (orientedCreative?.width ?? displayedAsset.width) /
            (orientedCreative?.height ?? displayedAsset.height),
          targetAspectRatio: availableSurface[0] / availableSurface[1],
          fitMode: creativeDisplay.fitMode,
        }
      : undefined,
  )
  const displayTexture = useMemo(() => {
    if (!texture) return texture
    const hasCustomTransform =
      creativeDisplay.rotation !== 0 ||
      creativeDisplay.zoom !== 1 ||
      creativeDisplay.offsetX !== 0 ||
      creativeDisplay.offsetY !== 0
    if (!rotateBeachFlagCreative && !hasCustomTransform) return texture
    const rotated = texture.clone()
    rotated.center.set(0.5, 0.5)
    rotated.rotation =
      (orientedCreative?.rotationRadians ?? 0) +
      THREE.MathUtils.degToRad(creativeDisplay.rotation)
    const baseRepeatX = texture.repeat.x
    const baseRepeatY = texture.repeat.y
    rotated.repeat.set(
      baseRepeatX / creativeDisplay.zoom,
      baseRepeatY / creativeDisplay.zoom,
    )
    rotated.offset.set(
      texture.offset.x +
        (baseRepeatX - rotated.repeat.x) / 2 +
        creativeDisplay.offsetX * 0.25,
      texture.offset.y +
        (baseRepeatY - rotated.repeat.y) / 2 +
        creativeDisplay.offsetY * 0.25,
    )
    rotated.needsUpdate = true
    return rotated
  }, [
    creativeDisplay.offsetX,
    creativeDisplay.offsetY,
    creativeDisplay.rotation,
    creativeDisplay.zoom,
    orientedCreative?.rotationRadians,
    rotateBeachFlagCreative,
    texture,
  ])
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
  const creativeDepth = point.supportShape === 'fondostazione' ? 0.101 : 0.071

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
        {point.supportShape === 'structural-sign' && (
          <Html position={[0, 0.02, 0.09]} transform distanceFactor={1.45}>
            <div className="w-36 overflow-hidden rounded-sm border-2 border-slate-200 bg-[#153276] text-center font-sans text-white shadow-lg">
              <div className="bg-white px-2 py-1 text-[11px] font-black text-[#153276]">
                DIFFERENZIALE
              </div>
              <div className="bg-[#17845c] px-2 py-1 text-xs font-black">
                SELF −0,20 €/L
              </div>
              <div className="bg-[#c83a32] px-2 py-1 text-xs font-black">
                SERVITO +0,20 €/L
              </div>
            </div>
          </Html>
        )}
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
      <MediaSupportGeometry
        point={point}
        color={frameColor}
        surfaceColor={
          point.supportShape === 'beach-flag'
            ? creativeDisplay.backgroundColor
            : undefined
        }
      />
      <mesh
        position={[0, 0, creativeDepth]}
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

import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { ConfigMediaPoint } from '@/domain/stationConfig'

function Panel({
  width,
  height,
  depth = 0.12,
  color,
}: {
  width: number
  height: number
  depth?: number
  color: string
}) {
  return (
    <RoundedBox
      args={[width + 0.12, height + 0.12, depth]}
      radius={Math.min(0.05, height * 0.08)}
      smoothness={3}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} metalness={0.5} roughness={0.25} />
    </RoundedBox>
  )
}

function GroundPost({
  x,
  panelBottom,
  color,
}: {
  x: number
  panelBottom: number
  color: string
}) {
  if (panelBottom <= 0.04) return null
  return (
    <>
      <mesh position={[x, -panelBottom / 2 - 0.02, -0.03]} castShadow>
        <boxGeometry args={[0.08, panelBottom, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[x, -panelBottom - 0.02, -0.03]} receiveShadow>
        <boxGeometry args={[0.3, 0.08, 0.32]} />
        <meshStandardMaterial color="#9aa2a9" metalness={0.45} roughness={0.42} />
      </mesh>
    </>
  )
}

export function MediaSupportGeometry({
  point,
  color,
}: {
  point: ConfigMediaPoint
  color: string
}) {
  const panelBottom = Math.max(0, point.position[1] - point.height / 2)
  const flagShape = useMemo(() => {
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

  switch (point.supportShape) {
    case 'pump-leader':
      return (
        <>
          <Panel width={point.width} height={point.height} color={color} />
          <mesh position={[0, -point.height / 2 - 0.16, -0.03]} castShadow>
            <boxGeometry args={[point.width * 0.72, 0.28, 0.14]} />
            <meshStandardMaterial color="#848d95" metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[0, -point.height / 2 - 0.33, -0.03]} receiveShadow>
            <boxGeometry args={[point.width + 0.22, 0.08, 0.42]} />
            <meshStandardMaterial color="#a7adb1" metalness={0.3} roughness={0.6} />
          </mesh>
        </>
      )
    case 'column-panel':
      return (
        <>
          <Panel width={point.width} height={point.height} depth={0.09} color={color} />
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (point.width / 2 + 0.08), 0, -0.08]}>
              <boxGeometry args={[0.06, point.height + 0.24, 0.16]} />
              <meshStandardMaterial color="#b3bac0" metalness={0.8} roughness={0.22} />
            </mesh>
          ))}
        </>
      )
    case 'pump-ear':
      return (
        <>
          <Panel width={point.width} height={point.height} depth={0.08} color={color} />
          <mesh position={[-point.width / 2 - 0.12, 0, -0.1]}>
            <boxGeometry args={[0.22, 0.1, 0.28]} />
            <meshStandardMaterial color="#9ca4aa" metalness={0.75} roughness={0.28} />
          </mesh>
        </>
      )
    case 'digital-screen':
      return (
        <>
          <Panel width={point.width} height={point.height} depth={0.08} color="#141d2d" />
          <mesh position={[0, 0, -0.055]}>
            <boxGeometry args={[point.width + 0.2, point.height + 0.34, 0.13]} />
            <meshStandardMaterial color="#e3e7ea" metalness={0.38} roughness={0.38} />
          </mesh>
        </>
      )
    case 'freestanding':
      return (
        <>
          <Panel width={point.width} height={point.height} color={color} />
          <GroundPost x={-point.width * 0.31} panelBottom={panelBottom} color="#7d878f" />
          <GroundPost x={point.width * 0.31} panelBottom={panelBottom} color="#7d878f" />
        </>
      )
    case 'fondostazione':
      return (
        <>
          <Panel width={point.width} height={point.height} depth={0.18} color={color} />
          <GroundPost x={-point.width * 0.38} panelBottom={panelBottom} color="#616d77" />
          <GroundPost x={point.width * 0.38} panelBottom={panelBottom} color="#616d77" />
        </>
      )
    case 'stendardo':
      return (
        <>
          <Panel width={point.width} height={point.height} depth={0.08} color={color} />
          <mesh position={[0, point.height / 2 + 0.1, -0.03]}>
            <boxGeometry args={[point.width + 0.28, 0.08, 0.12]} />
            <meshStandardMaterial color="#8d969d" metalness={0.75} roughness={0.28} />
          </mesh>
        </>
      )
    case 'beach-flag':
      return (
        <>
          <mesh position={[0, 0, -0.02]} castShadow>
            <shapeGeometry args={[flagShape]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.72} />
          </mesh>
          <mesh position={[-point.width / 2 - 0.055, -0.02, -0.06]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, point.height + 0.4, 12]} />
            <meshStandardMaterial color="#424b53" metalness={0.72} roughness={0.3} />
          </mesh>
          <mesh position={[-point.width / 2 - 0.055, -point.height / 2 - 0.2, -0.06]}>
            <cylinderGeometry args={[0.25, 0.3, 0.07, 20]} />
            <meshStandardMaterial color="#343b41" metalness={0.42} roughness={0.54} />
          </mesh>
        </>
      )
    case 'structural-sign':
      return (
        <>
          <Panel width={point.width} height={point.height} depth={0.14} color="#3f4a58" />
          <mesh position={[0, -point.height / 2 - panelBottom / 2, -0.02]} receiveShadow>
            <boxGeometry args={[point.width + 0.24, Math.max(0.18, panelBottom), 0.5]} />
            <meshStandardMaterial color="#aaa9a1" roughness={0.9} />
          </mesh>
        </>
      )
    case 'pump-topper':
    default:
      return <Panel width={point.width} height={point.height} color={color} />
  }
}

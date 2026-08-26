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
        <meshStandardMaterial
          color="#9aa2a9"
          metalness={0.45}
          roughness={0.42}
        />
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
  const stendardoPoleHeight = point.position[1] + point.height / 2 + 0.1
  const stendardoPoleCenterY = -point.position[1] + stendardoPoleHeight / 2
  const flagShape = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-point.width * 0.42, -point.height / 2)
    shape.lineTo(-point.width / 2, point.height * 0.38)
    shape.quadraticCurveTo(
      -point.width * 0.18,
      point.height * 0.56,
      point.width / 2,
      point.height * 0.38,
    )
    shape.quadraticCurveTo(
      point.width * 0.36,
      -point.height * 0.08,
      -point.width * 0.42,
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
          <GroundPost
            x={-point.width * 0.42}
            panelBottom={panelBottom}
            color="#848d95"
          />
          <GroundPost
            x={point.width * 0.42}
            panelBottom={panelBottom}
            color="#848d95"
          />
        </>
      )
    case 'column-panel':
      return (
        <>
          <Panel
            width={point.width}
            height={point.height}
            depth={0.09}
            color={color}
          />
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (point.width / 2 + 0.08), 0, -0.08]}
            >
              <boxGeometry args={[0.06, point.height + 0.24, 0.16]} />
              <meshStandardMaterial
                color="#b3bac0"
                metalness={0.8}
                roughness={0.22}
              />
            </mesh>
          ))}
        </>
      )
    case 'pump-ear':
      return (
        <>
          <Panel
            width={point.width}
            height={point.height}
            depth={0.08}
            color={color}
          />
          <mesh
            name="pump-ear-rear-bracket"
            position={[-point.width / 2 - 0.02, 0, -0.18]}
          >
            <boxGeometry args={[0.1, 0.12, 0.36]} />
            <meshStandardMaterial
              color="#9ca4aa"
              metalness={0.75}
              roughness={0.28}
            />
          </mesh>
        </>
      )
    case 'digital-screen':
      return (
        <>
          <RoundedBox
            args={[0.507, 1.636, 0.606]}
            position={[0, -0.487, -0.303]}
            radius={0.045}
            smoothness={4}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color="#d9dde0"
              metalness={0.72}
              roughness={0.24}
            />
          </RoundedBox>
          <RoundedBox
            args={[point.width + 0.055, point.height + 0.055, 0.055]}
            position={[0, 0, 0.005]}
            radius={0.022}
            smoothness={4}
            castShadow
          >
            <meshStandardMaterial
              color="#0d141d"
              metalness={0.34}
              roughness={0.16}
            />
          </RoundedBox>
          <mesh position={[0, -0.47, 0.012]} castShadow>
            <boxGeometry args={[0.36, 0.12, 0.045]} />
            <meshStandardMaterial
              color="#d1d6da"
              metalness={0.62}
              roughness={0.25}
            />
          </mesh>
          <mesh position={[-0.09, -0.47, 0.042]} castShadow>
            <boxGeometry args={[0.13, 0.035, 0.02]} />
            <meshStandardMaterial color="#171c24" roughness={0.22} />
          </mesh>
          <mesh position={[0.1, -0.46, 0.045]} castShadow>
            <boxGeometry args={[0.085, 0.09, 0.025]} />
            <meshStandardMaterial
              color="#2b3038"
              metalness={0.25}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0, -1.325, -0.303]} receiveShadow>
            <boxGeometry args={[0.62, 0.08, 0.68]} />
            <meshStandardMaterial
              color="#8d969d"
              metalness={0.62}
              roughness={0.32}
            />
          </mesh>
          <mesh position={[-0.19, -0.92, 0.015]} castShadow>
            <boxGeometry args={[0.035, 0.52, 0.035]} />
            <meshStandardMaterial
              color="#727c85"
              metalness={0.8}
              roughness={0.22}
            />
          </mesh>
        </>
      )
    case 'freestanding':
      return (
        <>
          <Panel width={point.width} height={point.height} color={color} />
          <GroundPost
            x={-point.width * 0.31}
            panelBottom={panelBottom}
            color="#7d878f"
          />
          <GroundPost
            x={point.width * 0.31}
            panelBottom={panelBottom}
            color="#7d878f"
          />
        </>
      )
    case 'fondostazione':
      return (
        <>
          <Panel
            width={point.width}
            height={point.height}
            depth={0.18}
            color={color}
          />
          <GroundPost
            x={-point.width * 0.38}
            panelBottom={panelBottom}
            color="#616d77"
          />
          <GroundPost
            x={point.width * 0.38}
            panelBottom={panelBottom}
            color="#616d77"
          />
        </>
      )
    case 'stendardo':
      return (
        <>
          <Panel
            width={point.width}
            height={point.height}
            depth={0.055}
            color={color}
          />
          {/* Il telo e centrato sul palo prezzi: i due distanziali lavorano
              dietro al pannello e non lo fanno sporgere da un solo lato. */}
          {[-0.58, 0.58].map((y) => (
            <mesh
              key={y}
              name="stendardo-central-bracket"
              position={[0, y, -0.12]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.025, 0.025, 0.28, 12]} />
              <meshStandardMaterial
                color="#929aa0"
                metalness={0.82}
                roughness={0.24}
              />
            </mesh>
          ))}
          <mesh
            name="stendardo-central-pole"
            position={[0, stendardoPoleCenterY, -0.24]}
            castShadow
          >
            <cylinderGeometry args={[0.055, 0.065, stendardoPoleHeight, 16]} />
            <meshStandardMaterial
              color="#a7adb1"
              metalness={0.78}
              roughness={0.28}
            />
          </mesh>
        </>
      )
    case 'beach-flag':
      return (
        <>
          <mesh
            name="beach-flag-tensioned-fabric"
            position={[0.025, 0.015, -0.02]}
            rotation={[0, 0, -0.025]}
            castShadow
          >
            <shapeGeometry args={[flagShape]} />
            <meshStandardMaterial
              color={color}
              side={THREE.DoubleSide}
              roughness={0.72}
            />
          </mesh>
          <mesh
            name="beach-flag-pole"
            position={[-point.width / 2 - 0.055, 0.1, -0.06]}
            rotation={[0, 0, -0.018]}
            castShadow
          >
            <cylinderGeometry args={[0.035, 0.045, point.height + 0.2, 12]} />
            <meshStandardMaterial
              color="#424b53"
              metalness={0.72}
              roughness={0.3}
            />
          </mesh>
          <mesh
            position={[
              -point.width / 2 - 0.055,
              -point.height / 2 + 0.035,
              -0.06,
            ]}
          >
            <cylinderGeometry args={[0.25, 0.3, 0.07, 20]} />
            <meshStandardMaterial
              color="#343b41"
              metalness={0.42}
              roughness={0.54}
            />
          </mesh>
        </>
      )
    case 'structural-sign':
      return (
        <>
          <Panel
            width={point.width}
            height={point.height}
            depth={0.14}
            color="#3f4a58"
          />
          <mesh
            position={[0, -point.height / 2 - panelBottom / 2, -0.02]}
            receiveShadow
          >
            <boxGeometry
              args={[point.width + 0.24, Math.max(0.18, panelBottom), 0.5]}
            />
            <meshStandardMaterial color="#aaa9a1" roughness={0.9} />
          </mesh>
        </>
      )
    case 'pump-topper':
      return (
        <>
          <Panel width={point.width} height={point.height} color={color} />
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              name="pump-topper-mount"
              position={[
                side * point.width * 0.34,
                -point.height / 2 - 0.08,
                -0.04,
              ]}
              castShadow
            >
              <boxGeometry args={[0.045, 0.16, 0.08]} />
              <meshStandardMaterial
                color="#8d969d"
                metalness={0.72}
                roughness={0.28}
              />
            </mesh>
          ))}
        </>
      )
    default:
      return <Panel width={point.width} height={point.height} color={color} />
  }
}

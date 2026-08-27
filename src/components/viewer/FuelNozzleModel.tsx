import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

/**
 * Procedural fuel nozzle built from one beveled profile and a curved metal
 * spout. The silhouette is intentionally recognisable at first-person scale,
 * while remaining light enough for the browser prototype.
 */
export function FuelNozzleModel({ scale = 1 }: { scale?: number }) {
  const bodyGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.24, 0.13)
    shape.quadraticCurveTo(-0.28, 0.02, -0.2, -0.06)
    shape.lineTo(-0.13, -0.1)
    shape.lineTo(-0.1, -0.38)
    shape.quadraticCurveTo(-0.07, -0.46, 0.02, -0.44)
    shape.lineTo(0.13, -0.4)
    shape.lineTo(0.05, -0.11)
    shape.lineTo(0.24, -0.04)
    shape.quadraticCurveTo(0.31, 0.02, 0.23, 0.13)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      curveSegments: 16,
    })
    geometry.translate(0, 0, -0.06)
    geometry.computeVertexNormals()
    return geometry
  }, [])
  const spoutGeometry = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          [
            new THREE.Vector3(0.19, 0.08, 0),
            new THREE.Vector3(0.34, 0.12, 0),
            new THREE.Vector3(0.44, 0.23, 0),
            new THREE.Vector3(0.65, 0.24, 0),
          ],
          false,
          'centripetal',
        ),
        28,
        0.022,
        12,
        false,
      ),
    [],
  )

  useEffect(
    () => () => {
      bodyGeometry.dispose()
      spoutGeometry.dispose()
    },
    [bodyGeometry, spoutGeometry],
  )

  return (
    <group scale={scale} name="procedural-fuel-nozzle">
      <mesh geometry={bodyGeometry} castShadow>
        <meshStandardMaterial
          color="#1c2025"
          metalness={0.18}
          roughness={0.46}
        />
      </mesh>
      <mesh geometry={spoutGeometry} castShadow>
        <meshStandardMaterial
          color="#c5cbd0"
          metalness={0.82}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[-0.035, -0.2, 0.071]} rotation={[0, 0, -0.18]}>
        <torusGeometry args={[0.105, 0.013, 8, 22, Math.PI * 1.62]} />
        <meshStandardMaterial
          color="#727b82"
          metalness={0.68}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-0.005, -0.17, 0.075]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.028, 0.19, 0.022]} />
        <meshStandardMaterial
          color="#b7bdc2"
          metalness={0.72}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[-0.16, 0.08, 0.07]}>
        <boxGeometry args={[0.105, 0.075, 0.018]} />
        <meshStandardMaterial color="#173f91" roughness={0.5} />
      </mesh>
      <mesh position={[-0.08, -0.42, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.055, 0.07, 0.16, 18]} />
        <meshStandardMaterial color="#111418" roughness={0.84} />
      </mesh>
    </group>
  )
}

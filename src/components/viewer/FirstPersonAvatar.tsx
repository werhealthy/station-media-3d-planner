import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useViewerStore } from '@/stores/viewerStore'

const navy = new THREE.MeshStandardMaterial({
  color: '#122752',
  roughness: 0.72,
})
const denim = new THREE.MeshStandardMaterial({
  color: '#243b5d',
  roughness: 0.88,
})
const skin = new THREE.MeshStandardMaterial({
  color: '#c88967',
  roughness: 0.82,
})
const sole = new THREE.MeshStandardMaterial({
  color: '#171a20',
  roughness: 0.9,
})

/**
 * A deliberately lightweight first-person body proxy. It is not the final
 * character asset: it establishes correct human scale, visible limbs and gait
 * while keeping the camera free to use PointerLockControls.
 */
export function FirstPersonAvatar() {
  const mode = useViewerStore((state) => state.navigationMode)
  const { camera } = useThree()
  const body = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
  const leftLeg = useRef<THREE.Group>(null)
  const rightLeg = useRef<THREE.Group>(null)
  const lastPosition = useRef(new THREE.Vector3())
  const gait = useRef(0)
  const yaw = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  useFrame((_, delta) => {
    if (!body.current || mode !== 'walkthrough') {
      lastPosition.current.copy(camera.position)
      return
    }

    const dx = camera.position.x - lastPosition.current.x
    const dz = camera.position.z - lastPosition.current.z
    const horizontalSpeed = Math.hypot(dx, dz) / Math.max(delta, 0.001)
    lastPosition.current.copy(camera.position)
    const moving = horizontalSpeed > 0.12
    if (moving) gait.current += delta * Math.min(horizontalSpeed, 3) * 4.8

    yaw.current.setFromQuaternion(camera.quaternion)
    body.current.position.copy(camera.position)
    body.current.rotation.set(0, yaw.current.y, 0)

    const targetSwing = moving ? Math.sin(gait.current) * 0.34 : 0
    const settle = 1 - Math.exp(-delta * 12)
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(
        leftArm.current.rotation.x,
        -0.18 + targetSwing,
        settle,
      )
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        -0.18 - targetSwing,
        settle,
      )
    }
    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = THREE.MathUtils.lerp(
        leftLeg.current.rotation.x,
        -targetSwing * 0.72,
        settle,
      )
      rightLeg.current.rotation.x = THREE.MathUtils.lerp(
        rightLeg.current.rotation.x,
        targetSwing * 0.72,
        settle,
      )
    }
  })

  return (
    <group ref={body} visible={mode === 'walkthrough'}>
      <mesh position={[0, -0.53, 0.04]} castShadow material={navy}>
        <capsuleGeometry args={[0.21, 0.42, 8, 18]} />
      </mesh>
      <mesh position={[0, -0.91, 0.035]} castShadow material={denim}>
        <capsuleGeometry args={[0.18, 0.18, 8, 18]} />
      </mesh>

      <group
        ref={leftArm}
        position={[-0.26, -0.17, -0.02]}
        rotation={[0, 0, 0.13]}
      >
        <mesh
          position={[0, -0.16, -0.1]}
          rotation={[0.42, 0, 0]}
          castShadow
          material={navy}
        >
          <capsuleGeometry args={[0.075, 0.3, 6, 14]} />
        </mesh>
        <mesh
          position={[0, -0.24, -0.43]}
          rotation={[1.08, 0, 0]}
          castShadow
          material={skin}
        >
          <capsuleGeometry args={[0.068, 0.34, 6, 14]} />
        </mesh>
        <mesh
          position={[0, -0.23, -0.78]}
          rotation={[1.2, 0, 0]}
          castShadow
          material={skin}
        >
          <capsuleGeometry args={[0.075, 0.08, 6, 14]} />
        </mesh>
      </group>

      <group
        ref={rightArm}
        position={[0.26, -0.17, -0.02]}
        rotation={[0, 0, -0.13]}
      >
        <mesh
          position={[0, -0.16, -0.1]}
          rotation={[0.42, 0, 0]}
          castShadow
          material={navy}
        >
          <capsuleGeometry args={[0.075, 0.3, 6, 14]} />
        </mesh>
        <mesh
          position={[0, -0.24, -0.43]}
          rotation={[1.08, 0, 0]}
          castShadow
          material={skin}
        >
          <capsuleGeometry args={[0.068, 0.34, 6, 14]} />
        </mesh>
        <mesh
          position={[0, -0.23, -0.78]}
          rotation={[1.2, 0, 0]}
          castShadow
          material={skin}
        >
          <capsuleGeometry args={[0.075, 0.08, 6, 14]} />
        </mesh>
      </group>

      <group ref={leftLeg} position={[-0.12, -0.94, 0.04]}>
        <mesh position={[0, -0.36, 0]} castShadow material={denim}>
          <capsuleGeometry args={[0.105, 0.54, 7, 16]} />
        </mesh>
        <mesh
          position={[0, -0.7, -0.1]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          material={sole}
        >
          <capsuleGeometry args={[0.11, 0.22, 7, 16]} />
        </mesh>
      </group>

      <group ref={rightLeg} position={[0.12, -0.94, 0.04]}>
        <mesh position={[0, -0.36, 0]} castShadow material={denim}>
          <capsuleGeometry args={[0.105, 0.54, 7, 16]} />
        </mesh>
        <mesh
          position={[0, -0.7, -0.1]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          material={sole}
        >
          <capsuleGeometry args={[0.11, 0.22, 7, 16]} />
        </mesh>
      </group>
    </group>
  )
}

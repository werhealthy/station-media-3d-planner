import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { useViewerStore } from '@/stores/viewerStore'

const sleeve = new THREE.MeshStandardMaterial({
  color: '#172b50',
  roughness: 0.78,
})

/**
 * Minimal first-person presence: only two sleeved arms are shown. A complete
 * proxy body looked artificial without a production-quality rigged character.
 */
export function FirstPersonAvatar() {
  const mode = useViewerStore((state) => state.navigationMode)
  const { camera } = useThree()
  const body = useRef<THREE.Group>(null)
  const leftArm = useRef<THREE.Group>(null)
  const rightArm = useRef<THREE.Group>(null)
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

    const targetSwing = moving ? Math.sin(gait.current) * 0.12 : 0
    const settle = 1 - Math.exp(-delta * 12)
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = THREE.MathUtils.lerp(
        leftArm.current.rotation.x,
        targetSwing,
        settle,
      )
      rightArm.current.rotation.x = THREE.MathUtils.lerp(
        rightArm.current.rotation.x,
        -targetSwing,
        settle,
      )
    }
  })

  return (
    <group ref={body} visible={mode === 'walkthrough'}>
      <group ref={leftArm} position={[-0.28, -0.2, -0.08]}>
        <mesh
          position={[0, -0.2, -0.48]}
          rotation={[1.08, 0, -0.04]}
          castShadow
          material={sleeve}
        >
          <cylinderGeometry args={[0.065, 0.09, 0.72, 18]} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.28, -0.2, -0.08]}>
        <mesh
          position={[0, -0.2, -0.48]}
          rotation={[1.08, 0, 0.04]}
          castShadow
          material={sleeve}
        >
          <cylinderGeometry args={[0.065, 0.09, 0.72, 18]} />
        </mesh>
      </group>
    </group>
  )
}

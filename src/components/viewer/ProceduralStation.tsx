import { useRef } from 'react'
import * as THREE from 'three'

export function ProceduralStation() {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} name="proceduralStation">
      {/* Pavimentazione */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#888888" roughness={0.7} />
      </mesh>

      {/* Pensilina (tetto della stazione) */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[40, 0.5, 30]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} />
      </mesh>

      {/* 4 colonne della pensilina */}
      {[
        [-15, 2, -10],
        [15, 2, -10],
        [-15, 2, 10],
        [15, 2, 10],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 4, 16]} />
          <meshStandardMaterial color="#999999" />
        </mesh>
      ))}

      {/* Pompe di carburante (4 isole) */}
      {[
        [-10, 0, -5],
        [0, 0, -5],
        [-10, 0, 5],
        [0, 0, 5],
      ].map((pos, i) => (
        <group key={`pump-${i}`} position={pos as [number, number, number]}>
          {/* Base pompa */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3, 1.5, 3]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          {/* Display pompa */}
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[2, 1, 0.1]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
        </group>
      ))}

      {/* Edificio principale (negozio/uffici) */}
      <mesh position={[20, 3, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 6, 10]} />
        <meshStandardMaterial color="#bb9966" />
      </mesh>

      {/* Finestre edificio */}
      {Array.from({ length: 3 }).map((_, i) =>
        Array.from({ length: 2 }).map((_, j) => (
          <mesh
            key={`window-${i}-${j}`}
            position={[20 + (i - 1) * 3, 4 + j * 2, 5.1]}
          >
            <planeGeometry args={[1.5, 1.5]} />
            <meshStandardMaterial
              color="#4488ff"
              emissive="#2244ff"
              emissiveIntensity={0.3}
            />
          </mesh>
        ))
      )}

      {/* Parcheggio (asfalto scuro) */}
      <mesh position={[-25, 0.01, 0]} receiveShadow>
        <planeGeometry args={[15, 20]} />
        <meshStandardMaterial color="#444444" roughness={0.8} />
      </mesh>

      {/* Segnaletica / bandiera */}
      <group position={[-20, 0, -15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
      </group>

      {/* Illuminazione palo */}
      <group position={[15, 0, -20]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.15, 8, 8]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[0, 4, 0]} castShadow>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="#ffff99" emissive="#ffff00" />
        </mesh>
      </group>
    </group>
  )
}

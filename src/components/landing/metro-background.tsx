'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

const ACCENT = '#e53935'
const ACCENT_WARM = '#ff8a65'

/**
 * Metro tunnel — concentric rings receding into depth behind the sphere,
 * evoking a train travelling through the Line 1 tunnel.
 */
function TunnelRings() {
  const groupRef = useRef<THREE.Group>(null)

  const rings = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        z: -5 - i * 2.4,
        radius: 5 + i * 0.45,
        opacity: 0.3 * (1 - i / 10),
      })),
    [],
  )

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += delta * 0.04
  })

  return (
    <group ref={groupRef}>
      {rings.map((r, i) => (
        <mesh key={i} position={[0, 0, r.z]}>
          <torusGeometry args={[r.radius, 0.025, 8, 72]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={r.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Line 1 route diagram — a curved poly-line with station nodes floating
 * in the background, a recognisable metro-map motif.
 */
function MetroLineDiagram() {
  const groupRef = useRef<THREE.Group>(null)

  const stations = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 11
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const x = (t - 0.5) * 20
      const y = Math.sin(t * Math.PI * 1.1) * 2.6 + 1.5
      pts.push(new THREE.Vector3(x, y, -11))
    }
    return pts
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 1.2
    }
  })

  return (
    <group ref={groupRef}>
      <Line points={stations} color={ACCENT} lineWidth={2} transparent opacity={0.4} />
      {stations.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.11, 14, 14]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? ACCENT_WARM : ACCENT}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Parallel rail tracks running along the floor below the sphere,
 * disappearing toward the horizon.
 */
function RailTracks() {
  const railGeom = useMemo(() => {
    const make = (offset: number) =>
      [new THREE.Vector3(offset, -4, 8), new THREE.Vector3(offset, -4, -22)]
    return { left: make(-1.2), right: make(1.2) }
  }, [])

  const sleepers = useMemo(
    () => Array.from({ length: 16 }, (_, i) => 6 - i * 1.8),
    [],
  )

  return (
    <group>
      <Line points={railGeom.left} color={ACCENT} lineWidth={1.5} transparent opacity={0.22} />
      <Line points={railGeom.right} color={ACCENT} lineWidth={1.5} transparent opacity={0.22} />
      {sleepers.map((z, i) => (
        <mesh key={i} position={[0, -4, z]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.04, 2.8, 0.12]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Composite Tehran Metro backdrop placed behind the orbiting sphere.
 */
export function MetroBackground() {
  return (
    <group>
      <TunnelRings />
      <MetroLineDiagram />
      <RailTracks />
    </group>
  )
}

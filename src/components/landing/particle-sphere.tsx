'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function generateParticles(count: number, radius: number, color: string) {
  const pos = new Float32Array(count * 3)
  const col = new Float32Array(count * 3)
  const sz = new Float32Array(count)

  const baseColor = new THREE.Color(color)
  const warmColors = [
    new THREE.Color('#ff6f61'),
    new THREE.Color('#e53935'),
    new THREE.Color('#ff8a65'),
    new THREE.Color('#ef5350'),
    new THREE.Color('#c62828'),
  ]

  const goldenRatio = (1 + Math.sqrt(5)) / 2

  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count)

    const r = radius * (0.92 + seededRandom(i * 4) * 0.16)
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)

    const c = warmColors[Math.floor(seededRandom(i * 4 + 1) * warmColors.length)] ?? baseColor
    const blend = 0.3 + seededRandom(i * 4 + 2) * 0.7
    col[i * 3] = THREE.MathUtils.lerp(baseColor.r, c.r, blend)
    col[i * 3 + 1] = THREE.MathUtils.lerp(baseColor.g, c.g, blend)
    col[i * 3 + 2] = THREE.MathUtils.lerp(baseColor.b, c.b, blend)

    sz[i] = 1.5 + seededRandom(i * 4 + 3) * 3
  }
  return { positions: pos, colors: col, sizes: sz }
}

interface ParticleSphereProps {
  count?: number
  radius?: number
  color?: string
}

export function ParticleSphere({
  count = 1200,
  radius = 3,
  color = '#e53935',
}: ParticleSphereProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const [data] = useState(() => generateParticles(count, radius, color))
  const { positions, colors, sizes } = data

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.08
      pointsRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

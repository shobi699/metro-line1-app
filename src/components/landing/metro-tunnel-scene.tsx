'use client'

import {
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { Hand, Pause, Play, Route } from 'lucide-react'

// ── Tunable constants (mirror these to real GLB dimensions later) ──
const SEGMENT_LENGTH = 10
const SEGMENT_COUNT = 12
const TUNNEL_RADIUS = 3.6
const TRAVEL_SPEED = 9
const FLOOR_Y = -TUNNEL_RADIUS + 0.2

const ACCENT = '#e53935'
const ACCENT_WARM = '#ff8a65'

/**
 * One tunnel segment — placeholder for `tunnel_segment.glb`.
 * Designed to tile seamlessly: length = SEGMENT_LENGTH along Z, centred on the
 * track centre-line. Swap the meshes here for a <primitive object={gltf.scene} />.
 */
function TunnelSegment({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      {/* Tunnel wall (inside visible) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[TUNNEL_RADIUS, TUNNEL_RADIUS, SEGMENT_LENGTH, 28, 1, true]} />
        <meshStandardMaterial
          color="#181214"
          side={THREE.BackSide}
          roughness={0.95}
          metalness={0.1}
        />
      </mesh>

      {/* Structural ring at the segment seam */}
      <mesh position={[0, 0, SEGMENT_LENGTH / 2]}>
        <torusGeometry args={[TUNNEL_RADIUS - 0.06, 0.14, 10, 40]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* Thinner mid-segment rib for depth density */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[TUNNEL_RADIUS - 0.03, 0.05, 8, 36]} />
        <meshStandardMaterial color="#3a2a2c" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Rails */}
      <mesh position={[-1.1, FLOOR_Y, 0]}>
        <boxGeometry args={[0.16, 0.12, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#8a8f98" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[1.1, FLOOR_Y, 0]}>
        <boxGeometry args={[0.16, 0.12, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#8a8f98" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Wall running lights (speed cue) */}
      <mesh position={[-2.5, 2.4, 0]}>
        <boxGeometry args={[0.08, 0.45, 0.5]} />
        <meshStandardMaterial color={ACCENT_WARM} emissive={ACCENT_WARM} emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[2.5, 2.4, 0]}>
        <boxGeometry args={[0.08, 0.45, 0.5]} />
        <meshStandardMaterial color={ACCENT_WARM} emissive={ACCENT_WARM} emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

/**
 * Endless travel: a group of identical segments is translated toward the camera
 * and wrapped by one segment length — seamless because the segments are tileable.
 */
function TunnelWorld({ moving }: { moving: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const segments = useMemo(() => Array.from({ length: SEGMENT_COUNT }, (_, i) => i), [])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g || !moving) return
    g.position.z += TRAVEL_SPEED * Math.min(delta, 0.05)
    if (g.position.z >= SEGMENT_LENGTH) g.position.z -= SEGMENT_LENGTH
  })

  return (
    <group ref={groupRef}>
      {segments.map((i) => (
        <TunnelSegment key={i} z={SEGMENT_LENGTH - i * SEGMENT_LENGTH} />
      ))}
    </group>
  )
}

/**
 * Driver cabin — placeholder for `train.glb` interior. Parented to the camera
 * rig so it stays in view and reveals its edges as you look around, giving a
 * strong "sitting in the cab" feel. Windshield frame + dashboard + wheel.
 */
function Cabin() {
  const spokeAngles = useMemo(() => [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3], [])

  return (
    <group>
      {/* Dashboard console */}
      <mesh position={[0, -0.78, -0.95]} rotation={[-0.28, 0, 0]}>
        <boxGeometry args={[2.5, 0.55, 0.85]} />
        <meshStandardMaterial color="#0e0b0c" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Dashboard accent glow strip */}
      <mesh position={[0, -0.52, -1.08]} rotation={[-0.28, 0, 0]}>
        <boxGeometry args={[2.3, 0.035, 0.04]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.3} />
      </mesh>
      {/* Instrument glow (left + right gauges) */}
      <mesh position={[-0.7, -0.62, -1.02]} rotation={[-0.28, 0, 0]}>
        <circleGeometry args={[0.11, 24]} />
        <meshStandardMaterial color={ACCENT_WARM} emissive={ACCENT_WARM} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0.7, -0.62, -1.02]} rotation={[-0.28, 0, 0]}>
        <circleGeometry args={[0.11, 24]} />
        <meshStandardMaterial color={ACCENT_WARM} emissive={ACCENT_WARM} emissiveIntensity={0.9} />
      </mesh>

      {/* Steering wheel */}
      <group position={[0, -0.52, -0.72]} rotation={[-0.95, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.34, 0.045, 12, 40]} />
          <meshStandardMaterial color="#1b1416" metalness={0.5} roughness={0.5} />
        </mesh>
        {spokeAngles.map((a, i) => (
          <mesh key={i} rotation={[0, 0, a]}>
            <boxGeometry args={[0.64, 0.035, 0.035]} />
            <meshStandardMaterial color="#1b1416" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 18]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.7} />
        </mesh>
      </group>

      {/* Windshield frame — A-pillars + top bar (dark silhouette around the view) */}
      <mesh position={[-1.25, 0.5, -1.25]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.14, 2.4, 0.14]} />
        <meshStandardMaterial color="#0c0a0b" metalness={0.3} roughness={0.75} />
      </mesh>
      <mesh position={[1.25, 0.5, -1.25]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.14, 2.4, 0.14]} />
        <meshStandardMaterial color="#0c0a0b" metalness={0.3} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.55, -1.25]}>
        <boxGeometry args={[2.7, 0.16, 0.14]} />
        <meshStandardMaterial color="#0c0a0b" metalness={0.3} roughness={0.75} />
      </mesh>
      {/* Windshield tint sheen */}
      <mesh position={[0, 0.55, -1.24]}>
        <planeGeometry args={[2.4, 1.9]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.04} depthWrite={false} />
      </mesh>
    </group>
  )
}

/**
 * Hybrid look rig — the camera lives inside a group so we rotate the group
 * (a ref) instead of mutating the hook-provided camera. Rotating in place from
 * a fixed point reads as looking around from inside the train.
 */
function CameraRig({
  yawRef,
  pitchRef,
}: {
  yawRef: React.RefObject<number>
  pitchRef: React.RefObject<number>
}) {
  const rigRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const r = rigRef.current
    if (!r) return
    r.rotation.order = 'YXZ'
    r.rotation.y += (yawRef.current - r.rotation.y) * 0.08
    r.rotation.x += (pitchRef.current - r.rotation.x) * 0.08
  })

  return (
    <group ref={rigRef} position={[0, 0.35, 0]}>
      <PerspectiveCamera makeDefault fov={74} position={[0, 0, 0]} />
      {/* Dashboard fill light so the cabin reads clearly */}
      <pointLight position={[0, -0.2, -0.6]} intensity={0.9} color={ACCENT_WARM} distance={4} />
      <Cabin />
    </group>
  )
}

interface MetroTunnelSceneProps {
  reducedMotion?: boolean
}

export function MetroTunnelScene({ reducedMotion = false }: MetroTunnelSceneProps) {
  const [manual, setManual] = useState(false)
  const [paused, setPaused] = useState(false)

  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const draggingRef = useRef(false)
  const lastRef = useRef({ x: 0, y: 0 })

  const clampPitch = (p: number) => Math.max(-0.5, Math.min(0.5, p))

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (manual) {
        if (!draggingRef.current) return
        const dx = e.clientX - lastRef.current.x
        const dy = e.clientY - lastRef.current.y
        lastRef.current = { x: e.clientX, y: e.clientY }
        yawRef.current += dx * 0.005
        pitchRef.current = clampPitch(pitchRef.current + dy * 0.005)
      } else {
        const rect = e.currentTarget.getBoundingClientRect()
        const nx = (e.clientX - rect.left) / rect.width - 0.5
        const ny = (e.clientY - rect.top) / rect.height - 0.5
        yawRef.current = -nx * 0.4
        pitchRef.current = clampPitch(-ny * 0.25)
      }
    },
    [manual],
  )

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!manual) return
      draggingRef.current = true
      lastRef.current = { x: e.clientX, y: e.clientY }
    },
    [manual],
  )

  const endDrag = useCallback(() => {
    draggingRef.current = false
  }, [])

  const moving = !paused && !reducedMotion

  return (
    <div
      className={`relative h-[70vh] min-h-[500px] w-full overflow-hidden md:h-[80vh] ${
        manual ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={['#060305']} />
        <fog attach="fog" args={['#0a0507', 6, 55]} />
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[0, 1, 3]} intensity={2.4} color={ACCENT_WARM} distance={34} />
          <pointLight position={[0, 0, -8]} intensity={1.4} color={ACCENT} distance={40} />

          <CameraRig yawRef={yawRef} pitchRef={pitchRef} />
          <TunnelWorld moving={moving} />
        </Suspense>
      </Canvas>

      {/* Cabin frame overlay — placeholder for train.glb interior */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 start-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setManual((m) => !m)}
          aria-pressed={manual}
          aria-label={manual ? 'بازگشت به حرکت خودکار' : 'کنترل دستی نما'}
          className={`flex size-10 items-center justify-center rounded-xl border backdrop-blur-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
            manual
              ? 'border-accent/60 bg-accent/20 text-accent'
              : 'border-white/10 bg-black/40 text-white/70 hover:border-accent/40 hover:text-accent'
          }`}
        >
          {manual ? <Route className="size-5" /> : <Hand className="size-5" />}
        </button>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'ادامهٔ حرکت' : 'توقف حرکت'}
          className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </button>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-5 end-4 z-20 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/60 backdrop-blur-md">
        {manual ? 'برای نگاه، بکشید' : 'حرکت خودکار در تونل خط ۱'}
      </div>
    </div>
  )
}

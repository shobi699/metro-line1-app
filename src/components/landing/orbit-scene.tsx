'use client'

import { Suspense, useCallback, useMemo, useState, useRef, type ComponentRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { ParticleSphere } from './particle-sphere'
import { OrbitImages } from './orbit-images'
import { MetroBackground } from './metro-background'
import { LandingLightbox } from './lightbox'

const ZOOM_MIN = 4.5
const ZOOM_MAX = 16
const ZOOM_DEFAULT = 10

interface OrbitImageData {
  id: string
  title: string
  caption?: string | null
  alt: string
  mediaUrl: string
  linkUrl?: string | null
}

interface SceneSettings {
  particleCount?: number
  sphereRadius?: number
  autoRotateSpeed?: number
}

interface OrbitSceneProps {
  images: OrbitImageData[]
  settings?: SceneSettings
}

/** Soft radial glow texture used behind the logo to make it pop. */
function makeGlowTexture(): THREE.Texture | null {
  if (typeof document === 'undefined') return null
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(229,57,53,0.55)')
  g.addColorStop(0.35, 'rgba(229,57,53,0.28)')
  g.addColorStop(1, 'rgba(229,57,53,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

interface CenterLogoProps {
  radius?: number
}

function CenterLogo({ radius = 1.4 }: CenterLogoProps) {
  const logoRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  // Load logo texture
  const rawTexture = useLoader(THREE.TextureLoader, '/logo.png')
  const texture = useMemo(() => {
    const t = rawTexture.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  }, [rawTexture])

  const glowTexture = useMemo(() => makeGlowTexture(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Gentle 3D wobble — keeps the logo mostly facing the camera so it stays clear,
    // instead of a full spin that hides the flat plane edge-on.
    if (logoRef.current) {
      logoRef.current.rotation.y = Math.sin(t * 0.6) * 0.42
      logoRef.current.rotation.x = Math.sin(t * 0.4) * 0.08
      const pulse = 1 + Math.sin(t * 1.6) * 0.015
      logoRef.current.scale.setScalar(pulse)
    }
    // Glow always faces the camera and breathes softly.
    if (glowRef.current) {
      glowRef.current.quaternion.copy(state.camera.quaternion)
      const gp = 1 + Math.sin(t * 1.2) * 0.06
      glowRef.current.scale.setScalar(gp)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.004
    }
  })

  return (
    <group>
      {/* Soft glow behind the logo */}
      {glowTexture && (
        <mesh ref={glowRef} position={[0, 0, -0.1]}>
          <planeGeometry args={[radius * 5, radius * 5]} />
          <meshBasicMaterial
            map={glowTexture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Logo plane — larger and unlit for full clarity */}
      <mesh ref={logoRef}>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Rotating accent ring framing the logo */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.35, 0.02, 12, 96]} />
        <meshBasicMaterial
          color="#e53935"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export function OrbitScene({ images, settings }: OrbitSceneProps) {
  const [selectedImage, setSelectedImage] = useState<OrbitImageData | null>(null)
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)

  const handleImageClick = useCallback((image: OrbitImageData) => {
    setSelectedImage(image)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const applyZoom = useCallback((length: number) => {
    const controls = controlsRef.current
    if (!controls) return
    const camera = controls.object
    const offset = camera.position.clone().sub(controls.target)
    offset.setLength(Math.min(Math.max(length, ZOOM_MIN), ZOOM_MAX))
    camera.position.copy(controls.target).add(offset)
    controls.update()
  }, [])

  const currentDistance = useCallback(() => {
    const controls = controlsRef.current
    if (!controls) return ZOOM_DEFAULT
    return controls.object.position.clone().sub(controls.target).length()
  }, [])

  const handleZoomIn = useCallback(() => applyZoom(currentDistance() * 0.8), [applyZoom, currentDistance])
  const handleZoomOut = useCallback(() => applyZoom(currentDistance() * 1.25), [applyZoom, currentDistance])
  const handleResetZoom = useCallback(() => applyZoom(ZOOM_DEFAULT), [applyZoom])

  return (
    <>
      <div className="relative h-[70vh] min-h-[500px] w-full md:h-[80vh]">
        <Canvas
          camera={{ position: [0, 2, 10], fov: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.3} />
            <pointLight position={[0, 0, 0]} intensity={2} color="#e53935" distance={15} />
            <pointLight position={[5, 5, 5]} intensity={0.5} color="#ff8a65" />

            <MetroBackground />

            <ParticleSphere
              count={settings?.particleCount ?? 1200}
              radius={settings?.sphereRadius ?? 3}
            />

            <CenterLogo radius={1.4} />

            {images.length > 0 && (
              <OrbitImages
                images={images}
                radius={(settings?.sphereRadius ?? 3) + 1.5}
                onImageClick={handleImageClick}
              />
            )}

            <OrbitControls
              ref={controlsRef}
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={settings?.autoRotateSpeed ?? 0.3}
              minDistance={ZOOM_MIN}
              maxDistance={ZOOM_MAX}
              maxPolarAngle={Math.PI * 0.75}
              minPolarAngle={Math.PI * 0.25}
            />
          </Suspense>
        </Canvas>

        {/* Zoom controls — restore zoom without hijacking page scroll */}
        <div className="absolute bottom-4 start-4 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="بزرگ‌نمایی"
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-black/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ZoomIn className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="کوچک‌نمایی"
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-black/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ZoomOut className="size-5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="بازنشانی نما"
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-white/70 backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-black/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>

      {selectedImage && (
        <LandingLightbox image={selectedImage} onClose={handleClose} />
      )}
    </>
  )
}

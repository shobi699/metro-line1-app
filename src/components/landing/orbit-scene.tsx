'use client'

import { Suspense, useCallback, useMemo, useState, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ParticleSphere } from './particle-sphere'
import { OrbitImages } from './orbit-images'
import { LandingLightbox } from './lightbox'

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

interface CenterLogoProps {
  radius?: number
}

function CenterLogo({ radius = 0.9 }: CenterLogoProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Load logo texture
  const rawTexture = useLoader(THREE.TextureLoader, '/logo.png')
  const texture = useMemo(() => {
    const t = rawTexture.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [rawTexture])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group>
      {/* 3D Plane representing the Logo */}
      <mesh ref={meshRef}>
        <planeGeometry args={[radius * 2, radius * 2]} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Halo / Glowing Ring behind it */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.1, radius * 1.15, 64]} />
        <meshBasicMaterial color="#e53935" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function OrbitScene({ images, settings }: OrbitSceneProps) {
  const [selectedImage, setSelectedImage] = useState<OrbitImageData | null>(null)

  const handleImageClick = useCallback((image: OrbitImageData) => {
    setSelectedImage(image)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedImage(null)
  }, [])

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

            <ParticleSphere
              count={settings?.particleCount ?? 1200}
              radius={settings?.sphereRadius ?? 3}
            />

            <CenterLogo radius={0.9} />

            {images.length > 0 && (
              <OrbitImages
                images={images}
                radius={(settings?.sphereRadius ?? 3) + 1.5}
                onImageClick={handleImageClick}
              />
            )}

            <OrbitControls
              enableZoom
              enablePan={false}
              autoRotate
              autoRotateSpeed={settings?.autoRotateSpeed ?? 0.3}
              minDistance={5}
              maxDistance={20}
              maxPolarAngle={Math.PI * 0.75}
              minPolarAngle={Math.PI * 0.25}
            />
          </Suspense>
        </Canvas>
      </div>

      {selectedImage && (
        <LandingLightbox image={selectedImage} onClose={handleClose} />
      )}
    </>
  )
}

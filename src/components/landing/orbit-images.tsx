'use client'

import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface OrbitImageData {
  id: string
  title: string
  caption?: string | null
  alt: string
  mediaUrl: string
  linkUrl?: string | null
}

interface OrbitImagesProps {
  images: OrbitImageData[]
  radius?: number
  onImageClick?: (image: OrbitImageData) => void
}

function ImageCardMaterial({ mediaUrl, hovered }: { mediaUrl: string; hovered: boolean }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      mediaUrl,
      (tex) => {
        console.log('Successfully loaded texture for mediaUrl:', mediaUrl, tex)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        setTexture(tex)
      },
      undefined,
      (err) => {
        console.warn('Failed to load texture for mediaUrl:', mediaUrl, err)
        setTexture(null)
      },
    )
  }, [mediaUrl])

  return (
    <meshBasicMaterial
      map={texture || null}
      color={texture ? '#ffffff' : (hovered ? '#e53935' : '#2a1015')}
      transparent
      opacity={texture ? (hovered ? 1 : 0.85) : (hovered ? 0.9 : 0.6)}
      side={THREE.DoubleSide}
    />
  )
}

function OrbitImageCard({
  image,
  position,
  onImageClick,
}: {
  image: OrbitImageData
  position: [number, number, number]
  onImageClick?: (image: OrbitImageData) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const borderRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const handlePointerOver = useCallback(() => {
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0)
      const target = hovered ? 1.2 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1)
    }
    if (borderRef.current) {
      borderRef.current.lookAt(0, 0, 0)
      const target = hovered ? 1.2 : 1
      borderRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1)
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={borderRef}
        position={[0, 0, -0.005]}
      >
        <planeGeometry args={[1.05, 0.72]} />
        <meshBasicMaterial
          color={hovered ? '#f44336' : '#3d1518'}
          transparent
          opacity={hovered ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={() => onImageClick?.(image)}
      >
        <planeGeometry args={[0.95, 0.63]} />
        <ImageCardMaterial mediaUrl={image.mediaUrl} hovered={hovered} />
      </mesh>

      <Html
        center
        position={[0, -0.42, 0.01]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          dir="rtl"
          className="whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-semibold text-white/80 transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0.6 }}
        >
          {image.title}
        </div>
      </Html>
    </group>
  )
}

export function OrbitImages({ images, radius = 4.5, onImageClick }: OrbitImagesProps) {
  const groupRef = useRef<THREE.Group>(null)

  const positions = useMemo(() => {
    return images.map((_, i) => {
      const theta = (2 * Math.PI * i) / images.length
      const x = radius * Math.cos(theta)
      const z = radius * Math.sin(theta)
      const y = Math.sin(theta * 2) * 0.6
      return [x, y, z] as [number, number, number]
    })
  }, [images, radius])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      {images.map((image, i) => (
        <OrbitImageCard
          key={image.id}
          image={image}
          position={positions[i]}
          onImageClick={onImageClick}
        />
      ))}
    </group>
  )
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/lib/utils'

interface MermaidGraphProps {
  chart: string
  className?: string
}

export function MermaidGraph({ chart, className }: MermaidGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgCode, setSvgCode] = useState<string>('')
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark', // Using a dark theme for the requested "advanced" look
      themeVariables: {
        primaryColor: '#201b1b',
        primaryTextColor: '#f87171',
        primaryBorderColor: '#ef4444',
        lineColor: '#ef4444',
        secondaryColor: '#1a1010',
        tertiaryColor: '#2a1a1a',
      },
      fontFamily: 'Vazirmatn, sans-serif',
      securityLevel: 'loose',
    })

    const renderChart = async () => {
      try {
        if (!containerRef.current) return
        // Generate a unique ID for the mermaid chart to avoid collisions
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`
        const { svg } = await mermaid.render(id, chart)
        setSvgCode(svg)
        setError(false)
      } catch (err) {
        console.error('Failed to render mermaid chart', err)
        setError(true)
      }
    }

    if (chart) {
      renderChart()
    }
  }, [chart])

  if (error) {
    return (
      <div className={cn("p-4 text-destructive border border-destructive/20 rounded-md bg-destructive/10 text-sm", className)}>
        خطا در نمایش گراف. فرمت نمودار معتبر نیست.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex justify-center items-center w-full min-h-[300px] overflow-auto p-4 [&>svg]:max-w-full", className)}
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  )
}

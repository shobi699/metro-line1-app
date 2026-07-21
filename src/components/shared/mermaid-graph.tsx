'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { cn } from '@/lib/utils'
import { sanitizeSvg } from '@/lib/sanitize'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface MermaidGraphProps {
  chart: string
  className?: string
  title?: string
}

export function MermaidGraph({ chart, className, title = 'کاتالوگ' }: MermaidGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgCode, setSvgCode] = useState<string>('')
  const [error, setError] = useState<boolean>(false)

  const handleDownload = () => {
    if (!containerRef.current) return
    const svgElement = containerRef.current.querySelector('svg')
    if (!svgElement) {
      toast.error('گراف هنوز رندر نشده است یا خطایی رخ داده است')
      return
    }

    try {
      const bbox = svgElement.getBBox ? svgElement.getBBox() : { width: svgElement.clientWidth, height: svgElement.clientHeight }
      const width = svgElement.clientWidth || bbox.width || 800
      const height = svgElement.clientHeight || bbox.height || 600

      const svgClone = svgElement.cloneNode(true) as SVGElement
      svgClone.setAttribute('width', width.toString())
      svgClone.setAttribute('height', height.toString())

      const svgString = new XMLSerializer().serializeToString(svgClone)
      // Create a Data URI instead of a Blob URL to avoid canvas tainting with foreignObject
      const base64Data = window.btoa(unescape(encodeURIComponent(svgString)))
      const dataURI = 'data:image/svg+xml;base64,' + base64Data

      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const padding = 40
        canvas.width = width + padding * 2
        canvas.height = height + padding * 2
        
        const context = canvas.getContext('2d')
        if (context) {
          context.fillStyle = '#0a0a0c'
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, padding, padding)
          
          try {
            const png = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.href = png
            downloadLink.download = `${title}.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            toast.success('تصویر کاتالوگ با موفقیت دانلود شد')
          } catch (pngError) {
            console.error('PNG export failed, falling back to SVG', pngError)
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
            downloadSvgFallback(svgBlob)
          }
        }
      }
      image.onerror = (e) => {
        console.error('Image rendering failed', e)
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        downloadSvgFallback(svgBlob)
      }
      image.src = dataURI
    } catch (err) {
      console.error('Failed to export image', err)
      toast.error('خطا در ذخیره‌سازی تصویر کاتالوگ')
    }
  }

  const downloadSvgFallback = (blob: Blob) => {
    const URL = window.URL || window.webkitURL || window
    const blobURL = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = blobURL
    downloadLink.download = `${title}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(blobURL)
    toast.success('فایل SVG کاتالوگ دانلود شد')
  }

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
      securityLevel: 'strict',
    })

    const renderChart = async () => {
      try {
        if (!containerRef.current) return
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
    <div className="relative group w-full">
      {svgCode && (
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="absolute top-4 end-4 z-20 gap-1.5 bg-black/60 border-white/10 text-white/80 hover:text-white hover:bg-black/80 transition-all duration-200"
          title="دانلود تصویر کاتالوگ"
        >
          <Download className="w-4 h-4" />
          <span className="text-xs">دانلود تصویر</span>
        </Button>
      )}
      <div
        ref={containerRef}
        className={cn("flex justify-center items-center w-full min-h-[300px] overflow-auto p-4 [&>svg]:max-w-full", className)}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgCode) }}
      />
    </div>
  )
}

'use client'

import { useEffect } from 'react'

export function ConfigLoader() {
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config')
        if (res.ok) {
          const { data } = await res.json()
          if (data.appName) {
            document.title = data.appName
          }
          if (data.brandColor) {
            let styleTag = document.getElementById('dynamic-brand-color')
            if (!styleTag) {
              styleTag = document.createElement('style')
              styleTag.id = 'dynamic-brand-color'
              document.head.appendChild(styleTag)
            }
            styleTag.innerHTML = `
              :root, .dark {
                --accent: ${data.brandColor} !important;
                --ring: ${data.brandColor} !important;
              }
            `
          }
        }
      } catch {
        // config load failed silently
      }
    }
    loadConfig()
  }, [])

  return null
}

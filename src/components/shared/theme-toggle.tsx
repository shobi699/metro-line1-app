'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import { useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  return (
    <div ref={(el) => {
      if (el && !mounted) setMounted(true)
    }}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
        disabled={!mounted}
      >
        {mounted && theme === 'dark' ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </Button>
    </div>
  )
}

'use client'

import { useTheme } from './theme-provider'
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
        className="active:scale-90 transition-transform duration-150"
      >
        {mounted && theme === 'dark' ? (
          <Sun className="size-4 transition-transform duration-300" />
        ) : (
          <Moon className="size-4 transition-transform duration-300" />
        )}
      </Button>
    </div>
  )
}

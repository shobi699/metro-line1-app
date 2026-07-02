import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { defaultTheme, darkTheme, Theme } from './theme'

import { useUIBuilderStore } from '../stores/ui-builder'

type ThemeContextType = {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme()
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark')
  
  const uiThemeConfig = useUIBuilderStore((s) => s.theme)
  const bootstrap = useUIBuilderStore((s) => s.bootstrap)

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark')
    bootstrap()
  }, [systemColorScheme])

  const toggleTheme = () => {
    setIsDark((prev) => !prev)
  }

  const baseTheme = isDark ? darkTheme : defaultTheme
  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: uiThemeConfig.primaryColor || baseTheme.colors.primary,
      accent: uiThemeConfig.primaryColor || baseTheme.colors.accent,
      secondary: uiThemeConfig.accentColor || baseTheme.colors.secondary,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      sm: Math.max(2, Math.floor((uiThemeConfig.radius || 12) / 3)),
      md: Math.max(4, Math.floor((uiThemeConfig.radius || 12) / 1.5)),
      lg: uiThemeConfig.radius || 12,
      xl: Math.floor((uiThemeConfig.radius || 12) * 1.3),
      xxl: Math.floor((uiThemeConfig.radius || 12) * 2),
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

import { Platform } from 'react-native'

export interface Theme {
  colors: {
    // Surface
    surface: string
    surfaceDim: string
    surfaceBright: string
    surfaceContainerLowest: string
    surfaceContainerLow: string
    surfaceContainer: string
    surfaceContainerHigh: string
    surfaceContainerHighest: string
    onSurface: string
    onSurfaceVariant: string
    inverseSurface: string
    inverseOnSurface: string
    outline: string
    outlineVariant: string
    surfaceTint: string
    
    // Primary
    primary: string
    onPrimary: string
    primaryContainer: string
    onPrimaryContainer: string
    inversePrimary: string
    primaryFixed: string
    primaryFixedDim: string
    onPrimaryFixed: string
    onPrimaryFixedVariant: string
    
    // Secondary
    secondary: string
    onSecondary: string
    secondaryContainer: string
    onSecondaryContainer: string
    secondaryFixed: string
    secondaryFixedDim: string
    onSecondaryFixed: string
    onSecondaryFixedVariant: string
    
    // Tertiary
    tertiary: string
    onTertiary: string
    tertiaryContainer: string
    onTertiaryContainer: string
    tertiaryFixed: string
    tertiaryFixedDim: string
    onTertiaryFixed: string
    onTertiaryFixedVariant: string
    
    // Error
    error: string
    onError: string
    errorContainer: string
    onErrorContainer: string

    // Background
    background: string
    onBackground: string
    surfaceVariant: string

    // Legacy/Aliased components mapping
    danger: string
    text: string
    textSecondary: string
    border: string
    card: string
    
    // Backwards Compatibility properties
    accent: string
    textMuted: string
    borderSubtle: string
    info: string
    warning: string
    success: string
  }
  
  shadows: {
    level1: object
    level2: object
    card: object
  }

  borderRadius: {
    sm: number
    md: number
    lg: number
    xl: number
    xxl: number
    full: number
  }

  spacing: {
    elementGap: number
    sectionPadding: number
    stackSpace: number
    containerMargin: number
    
    // Backwards Compatibility spacing
    sm: number
    md: number
    lg: number
    xl: number
  }

  fontSize: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }

  typography: {
    numericHero: { fontFamily: string; fontSize: number; lineHeight: number }
    screenTitle: { fontFamily: string; fontSize: number; lineHeight: number }
    sectionTitle: { fontFamily: string; fontSize: number; lineHeight: number }
    cardTitle: { fontFamily: string; fontSize: number; lineHeight: number }
    bodyMd: { fontFamily: string; fontSize: number; lineHeight: number }
    captionSm: { fontFamily: string; fontSize: number; lineHeight: number }
  }
}

export const defaultTheme: Theme = {
  colors: {
    surface: '#f8f9ff',
    surfaceDim: '#cbdbf5',
    surfaceBright: '#f8f9ff',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#eff4ff',
    surfaceContainer: '#e5eeff',
    surfaceContainerHigh: '#dce9ff',
    surfaceContainerHighest: '#d3e4fe',
    onSurface: '#0b1c30',
    onSurfaceVariant: '#5d3f3c',
    inverseSurface: '#213145',
    inverseOnSurface: '#eaf1ff',
    outline: '#926f6b',
    outlineVariant: '#e6bdb8',
    surfaceTint: '#c00014',
    
    primary: '#ae0011',
    onPrimary: '#ffffff',
    primaryContainer: '#d71920',
    onPrimaryContainer: '#ffece9',
    inversePrimary: '#ffb4ab',
    primaryFixed: '#ffdad6',
    primaryFixedDim: '#ffb4ab',
    onPrimaryFixed: '#410002',
    onPrimaryFixedVariant: '#93000d',
    
    secondary: '#575e70',
    onSecondary: '#ffffff',
    secondaryContainer: '#d9dff5',
    onSecondaryContainer: '#5c6274',
    secondaryFixed: '#dce2f7',
    secondaryFixedDim: '#c0c6db',
    onSecondaryFixed: '#141b2b',
    onSecondaryFixedVariant: '#404758',
    
    tertiary: '#5d5254',
    onTertiary: '#ffffff',
    tertiaryContainer: '#766a6c',
    onTertiaryContainer: '#fdecee',
    tertiaryFixed: '#efdfe1',
    tertiaryFixedDim: '#d2c3c5',
    onTertiaryFixed: '#22191b',
    onTertiaryFixedVariant: '#4f4446',
    
    error: '#ba1a1a',
    onError: '#ffffff',
    errorContainer: '#ffdad6',
    onErrorContainer: '#93000a',

    background: '#f8f9ff',
    onBackground: '#0b1c30',
    surfaceVariant: '#d3e4fe',

    // Legacy support
    danger: '#ba1a1a',
    text: '#0b1c30',
    textSecondary: '#575e70',
    border: '#e6bdb8',
    card: '#ffffff',
    
    // Backwards Compatibility properties
    accent: '#ae0011', // red line 1 primary color
    textMuted: '#8e8e93',
    borderSubtle: '#e6bdb8',
    info: '#007aff',
    warning: '#ff9500',
    success: '#34c759'
  },
  
  shadows: {
    level1: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    }) || {},
    level2: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20 },
      android: { elevation: 6 }
    }) || {},
    card: Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    }) || {},
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  spacing: {
    elementGap: 12,
    sectionPadding: 24,
    stackSpace: 16,
    containerMargin: 20,
    
    // Backwards Compatibility spacing
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },

  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  },

  typography: {
    numericHero: { fontFamily: 'Vazirmatn', fontSize: 26, lineHeight: 36 },
    screenTitle: { fontFamily: 'Vazirmatn', fontSize: 22, lineHeight: 32 },
    sectionTitle: { fontFamily: 'Vazirmatn', fontSize: 17, lineHeight: 26 },
    cardTitle: { fontFamily: 'Vazirmatn', fontSize: 15, lineHeight: 24 },
    bodyMd: { fontFamily: 'Vazirmatn', fontSize: 14, lineHeight: 22 },
    captionSm: { fontFamily: 'Vazirmatn', fontSize: 12, lineHeight: 18 },
  }
}

export const darkTheme: Theme = defaultTheme
export const Theme = defaultTheme // export value for unedited screens
export const cycleColors = {
  morning: '#F59E0B', // Amber
  morningBg: '#FEF3C7',
  evening: '#0EA5E9', // Sky Blue
  eveningBg: '#E0F2FE',
  night: '#6366F1', // Indigo
  nightBg: '#E0E7FF',
  office: '#10B981', // Emerald
  officeBg: '#D1FAE5',
  off: '#9CA3AF', // Gray
  offBg: '#F3F4F6'
}

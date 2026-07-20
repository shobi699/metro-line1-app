import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { MaterialIcons } from '@expo/vector-icons'
// Context provider for theme
import { useTheme } from '@/shared/ThemeProvider'
import { BlurView } from 'expo-blur'
import { useUIBuilderStore } from '../stores/ui-builder'

import { useConfigStore } from '../stores/config'

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme, isDark } = useTheme()
  const isModuleEnabled = useConfigStore((s) => s.isModuleEnabled)

  const styles = StyleSheet.create({
    containerWrapper: {
      overflow: 'hidden',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    container: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.containerMargin,
      paddingVertical: 6,
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: theme.borderRadius.xl,
    },
    activeTabButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      transform: [{ scale: 0.95 }],
    },
    icon: {
      marginBottom: 4,
    },
    label: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: theme.typography.captionSm.fontSize,
      lineHeight: theme.typography.captionSm.lineHeight,
    }
  })

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: isDark ? 'rgba(30, 30, 30, 0.75)' : 'rgba(255, 255, 255, 0.85)' }}>
      <View style={styles.containerWrapper}>
        <BlurView tint={isDark ? "dark" : "light"} intensity={80} style={styles.container}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const label =
              options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name

            // Check if module is disabled
            const routeModuleMap: Record<string, string> = {
              'شیفت‌ها': 'calendar_roster',
              'تقویم': 'calendar_roster',
              'تقویم زندگی': 'calendar_roster',
              'گفتگو': 'chat',
              'تیکت‌ها': 'tickets',
              'اعلان‌ها': 'safety',
            }
            const moduleId = routeModuleMap[route.name]
            if (moduleId && !isModuleEnabled(moduleId)) {
              return null
            }

            const isFocused = state.index === index

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            const menuItems = useUIBuilderStore.getState().menuItems
            const menuItem = menuItems.find(item => item.label === route.name)
            let iconName: keyof typeof MaterialIcons.glyphMap = 'help'
            
            if (menuItem) {
              const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
                LayoutDashboard: 'home',
                Calendar: 'schedule',
                Bell: 'notifications',
                MessageSquare: 'chat',
                User: 'person',
                home: 'home',
                calendar: 'schedule',
                chat: 'chat',
                tickets: 'confirmation-number',
                profile: 'person',
                announcements: 'notifications',
                radio: 'radio',
                checklist: 'rule',
                settings: 'settings',
                info: 'info',
              }
              iconName = iconMap[menuItem.icon] || (menuItem.icon as any) || 'help'
            } else {
              if (route.name === 'داشبورد') iconName = 'home'
              if (route.name === 'شیفت‌ها' || route.name === 'تقویم' || route.name === 'تقویم زندگی') iconName = 'schedule'
              if (route.name === 'گفتگو') iconName = 'chat'
              if (route.name === 'اعلان‌ها') iconName = 'notifications'
              if (route.name === 'پروفایل') iconName = 'person'
            }

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={[styles.tabButton, isFocused && styles.activeTabButton]}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={iconName}
                  size={24}
                  color={isFocused ? theme.colors.primary : theme.colors.secondary}
                  style={styles.icon}
                />
                <Text style={[styles.label, { color: isFocused ? theme.colors.primary : theme.colors.secondary }]}>
                  {label as string}
                </Text>
              </TouchableOpacity>
            )
          })}
        </BlurView>
      </View>
    </SafeAreaView>
  )
}

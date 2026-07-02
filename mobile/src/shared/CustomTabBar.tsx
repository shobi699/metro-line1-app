import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { MaterialIcons } from '@expo/vector-icons'
// Context provider for theme
import { useTheme } from '@/shared/ThemeProvider'
import { useUIBuilderStore } from '../stores/ui-builder'

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme()

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.containerMargin,
      paddingVertical: 8,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      ...theme.shadows.level1,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderRadius: theme.borderRadius.xl,
    },
    activeTabButton: {
      backgroundColor: `${theme.colors.primaryContainer}1A`, // 10% opacity hex
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
    <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' }}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name

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
            if (route.name === 'شیفت‌ها') iconName = 'schedule'
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
      </View>
    </SafeAreaView>
  )
}

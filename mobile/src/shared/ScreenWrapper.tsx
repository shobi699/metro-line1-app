import React, { useState, useMemo, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useUIBuilderStore } from '../stores/ui-builder'
import { useTheme } from './ThemeProvider'
import { useConfigStore } from '../stores/config'

interface ScreenWrapperProps {
  title: string
  navigation?: any
  children: React.ReactNode
  scrollable?: boolean
  onBack?: () => void
  showBack?: boolean
}

interface NavItem {
  label: string
  route: string
  icon: string
  roles?: string[]
}

interface NavGroup {
  id: string
  label: string
  icon: string
  items: NavItem[]
  roles?: string[]
}

interface NavSection {
  title: string
  roles?: string[]
  groups: NavGroup[]
}

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'میز کار پرسنلی',
    groups: [
      {
        id: 'desk',
        label: 'امور کاربری',
        icon: 'dashboard',
        items: [
          { label: 'داشبورد اصلی', route: 'HomeScreen', icon: 'home' },
          { label: 'اعلانات سیستم', route: 'NotificationsScreen', icon: 'notifications' },
          { label: 'پروفایل کاربری', route: 'ProfileScreen', icon: 'person' },
          { label: 'رزرو وقت جلسه', route: 'MeetingsScreen', icon: 'calendar-today' },
          { label: 'کارنامه و ارزیابی عملکرد', route: 'عملکرد', icon: 'star' },
          { label: 'ثبت بازخورد و پیام', route: 'بازخورد', icon: 'message' },
        ]
      },
      {
        id: 'shifts-op',
        label: 'عملیات و شیفت‌ها',
        icon: 'calendar-today',
        items: [
          { label: 'شیفت و تقویم من', route: 'CalendarScreen', icon: 'calendar-today' },
          { label: 'لوحه اعزام روزانه خط ۱', route: 'لوحه', icon: 'schedule' },
          { label: 'حضور و غیاب هوشمند', route: 'حضور و غیاب', icon: 'check-circle' },
          { label: 'چک‌لیست حرکت قطار', route: 'چک‌لیست‌ها', icon: 'done-all' },
          { label: 'ثبت خرابی و تیکتینگ', route: 'تیکت‌ها', icon: 'report-problem' },
        ]
      },
      {
        id: 'comms',
        label: 'ارتباطات و همیار',
        icon: 'chat',
        items: [
          { label: 'اتاق‌های گفت‌وگو', route: 'ChatScreen', icon: 'chat' },
          { label: 'کنفرانس صوتی گروهی', route: 'کنفرانس صوتی', icon: 'record-voice-over' },
          { label: 'شبیه‌ساز بی‌سیم تِترا', route: 'بی‌سیم راهبری', icon: 'radio' },
          { label: 'دفتر تلفن پرسنل', route: 'دفتر تلفن', icon: 'contacts' },
          { label: 'جستجوی پلاک خودرو', route: 'PlateSearch', icon: 'directions-car' },
          { label: 'دستیار هوشمند AI', route: 'دستیار AI', icon: 'info' },
        ]
      }
    ]
  },
  {
    title: 'مرکز کنترل و فرماندهی خط ۱',
    roles: ['admin', 'super_admin', 'operator'],
    groups: [
      {
        id: 'occ-menu',
        label: 'فرماندهی OCC',
        icon: 'pulse',
        roles: ['admin', 'super_admin', 'operator'],
        items: [
          { label: 'مدیریت بحران و اضطرار', route: 'SOS', icon: 'warning' },
        ]
      }
    ]
  },
  {
    title: 'سامانه آموزش پرسنل',
    groups: [
      {
        id: 'learning-menu',
        label: 'آموزش و آزمون‌ها',
        icon: 'school',
        items: [
          { label: 'آموزش پرسنل و آزمون‌ها', route: 'آموزش', icon: 'school' },
          { label: 'راهنمای جامع کاربری', route: 'راهنمای کاربری', icon: 'book' },
        ]
      }
    ]
  },
  {
    title: 'پنل مدیریت سامانه',
    roles: ['admin', 'super_admin'],
    groups: [
      {
        id: 'admin-users',
        label: 'کاربران و دسترسی',
        icon: 'people',
        roles: ['admin', 'super_admin'],
        items: [
          { label: 'بارگذاری اکسل لوحه', route: 'لوحه', icon: 'table-chart' },
          { label: 'بخشنامه‌های ایمنی', route: 'بخشنامه‌ها', icon: 'verified-user' },
          { label: 'تنظیمات منو و قالب', route: 'UIBuilder', icon: 'settings' },
        ]
      }
    ]
  }
]

export function ScreenWrapper({ title, navigation, children, scrollable = false, onBack, showBack }: ScreenWrapperProps) {
  const { theme, toggleTheme, isDark } = useTheme()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const menuItems = useUIBuilderStore((s) => s.menuItems)
  const [showHamburger, setShowHamburger] = useState(false)
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>('desk')

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId))
  }

  const config = useConfigStore((s) => s.config)
  const fetchConfig = useConfigStore((s) => s.fetchConfig)

  useEffect(() => {
    if (!config) {
      void fetchConfig()
    }
  }, [config])

  const socialLinks = config?.socialLinks || [
    { platform: 'telegram', url: 'https://t.me/metro', icon: 'send' },
    { platform: 'instagram', url: 'https://instagram.com/metro', icon: 'camera-alt' }
  ]

  // Role labels lookup
  const roleLabel = useMemo(() => {
    switch (user?.roleKey) {
      case 'super_admin': return 'مدیر ارشد'
      case 'admin': return 'مدیر سیستم'
      case 'operator': return 'اپراتور فرماندهی'
      default: return 'راهبر قطار / پرسنل'
    }
  }, [user])

  // Map icon names to material icons
  const mapMenuIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return 'home'
      case 'dashboard': return 'dashboard'
      case 'calendar':
      case 'calendar-today': return 'calendar-today'
      case 'chat': return 'chat'
      case 'tickets': return 'report-problem'
      case 'profile': return 'person'
      case 'announcements': return 'description'
      case 'radio': return 'radio'
      case 'checklist':
      case 'done-all': return 'done-all'
      case 'settings': return 'settings'
      case 'info': return 'info'
      case 'school': return 'school'
      case 'trophy': return 'emoji-events'
      case 'warning': return 'warning'
      case 'contacts': return 'contacts'
      case 'voice': return 'record-voice-over'
      case 'star': return 'star'
      case 'notifications': return 'notifications'
      case 'check-circle': return 'check-circle'
      case 'schedule': return 'schedule'
      case 'people': return 'people'
      case 'verified-user': return 'verified-user'
      case 'table-chart': return 'table-chart'
      case 'pulse': return 'flash-on'
      default: return 'menu-open'
    }
  }

  const handleNav = (route: string) => {
    setShowHamburger(false)
    if (navigation) {
      const normalized = route.toLowerCase().replace(/screen$/, '').trim()
      let target = route

      if (normalized === 'homescreen' || normalized === 'home' || normalized === 'dashboard') {
        target = 'HomeScreen'
      } else if (normalized === 'profilescreen' || normalized === 'profile') {
        target = 'ProfileScreen'
      } else if (normalized === 'chatscreen' || normalized === 'chat') {
        target = 'ChatScreen'
      } else if (normalized === 'notificationsscreen' || normalized === 'notifications') {
        target = 'NotificationsScreen'
      } else if (normalized === 'calendarscreen' || normalized === 'calendar' || normalized === 'shifts') {
        target = 'CalendarScreen'
      } else if (normalized === 'directoryscreen' || normalized === 'directory' || normalized === 'contacts' || route === 'دفتر تلفن') {
        target = 'دفتر تلفن'
      } else if (normalized === 'attendancescreen' || normalized === 'attendance' || route === 'حضور و غیاب') {
        target = 'حضور و غیاب'
      } else if (normalized === 'feedbackscreen' || normalized === 'feedback' || route === 'بازخورد') {
        target = 'بازخورد'
      } else if (normalized === 'sos' || route === 'SOS') {
        target = 'SOS'
      } else if (normalized === 'aiassistant' || normalized === 'ai' || normalized === 'ai-assistant' || route === 'دستیار AI') {
        target = 'دستیار AI'
      } else if (normalized === 'ticketsscreen' || normalized === 'tickets' || route === 'تیکت‌ها') {
        target = 'تیکت‌ها'
      } else if (normalized === 'bulletinsscreen' || normalized === 'bulletins' || normalized === 'announcements' || route === 'بخشنامه‌ها') {
        target = 'بخشنامه‌ها'
      } else if (normalized === 'checklistsscreen' || normalized === 'checklist' || normalized === 'checklists' || route === 'چک‌لیست‌ها') {
        target = 'چک‌لیست‌ها'
      } else if (normalized === 'voiceconferencescreen' || normalized === 'voice' || normalized === 'voiceconference' || route === 'کنفرانس صوتی') {
        target = 'کنفرانس صوتی'
      } else if (normalized === 'radiosimulatorscreen' || normalized === 'radiosimulator' || normalized === 'radio' || route === 'بی‌سیم راهبری') {
        target = 'بی‌سیم راهبری'
      } else if (normalized === 'performancescreen' || normalized === 'performance' || normalized === 'trophy' || route === 'عملکرد') {
        target = 'عملکرد'
      } else if (normalized === 'rosterscreen' || normalized === 'roster' || route === 'لوحه') {
        target = 'لوحه'
      } else if (normalized === 'learningscreen' || normalized === 'learning' || normalized === 'school' || route === '/learning/gallery' || route === '/learning/exams' || route === 'learning-menu' || route === 'آموزش') {
        target = 'آموزش'
      }

      navigation.navigate(target)
    }
  }

  // Handle dynamic customization from Menu Builder
  const isItemVisible = (route: string) => {
    if (menuItems && menuItems.length > 0) {
      const dbItem = menuItems.find(x => {
        const normalizedDb = x.route.toLowerCase().replace(/screen$/, '').trim()
        const normalizedTarget = route.toLowerCase().replace(/screen$/, '').trim()
        return normalizedDb === normalizedTarget || x.label === route
      })
      if (dbItem) {
        return dbItem.isVisible
      }
    }
    return true
  }

  const checkRole = (roles?: string[]) => {
    if (!roles) return true
    if (user?.roleKey === 'super_admin') return true
    return roles.includes(user?.roleKey ?? '')
  }

  const showBackButton = showBack ?? (!!onBack || !!(navigation && navigation.canGoBack && navigation.canGoBack()))

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.containerMargin,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      backgroundColor: theme.colors.background,
    },
    headerRight: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    headerTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'right',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      padding: 8,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    content: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    // Drawer Accordion Styles
    drawerOverlay: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    drawerBackgroundDismiss: {
      flex: 1,
    },
    drawerContent: {
      width: Dimensions.get('window').width * 0.82,
      backgroundColor: theme.colors.background,
      height: '100%',
      paddingTop: 45,
      paddingBottom: 20,
      paddingHorizontal: 16,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.border,
    },
    drawerProfileHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
    },
    drawerAvatarContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    drawerProfileInfo: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    drawerUserName: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 13.5,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    drawerUserRole: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: '600',
      marginTop: 1,
    },
    drawerCloseBtn: {
      padding: 6,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerScroll: {
      flexGrow: 1,
    },
    drawerSectionTitle: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10.5,
      color: theme.colors.secondary,
      textAlign: 'right',
      marginTop: 18,
      marginBottom: 6,
      paddingHorizontal: 4,
      fontWeight: '700',
      opacity: 0.8,
    },
    drawerGroupItem: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      marginVertical: 2,
      borderWidth: 1,
      borderColor: theme.colors.border + '30',
    },
    drawerGroupItemActive: {
      backgroundColor: theme.colors.primary + '0D',
      borderColor: theme.colors.primary + '20',
    },
    drawerGroupRight: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
    },
    drawerGroupText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    drawerSubItemsList: {
      paddingRight: 16,
      marginVertical: 2,
      borderRightWidth: 1.5,
      borderRightColor: theme.colors.border + '50',
      gap: 1,
    },
    drawerSubItem: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.sm,
    },
    drawerSubItemText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12,
      color: theme.colors.secondary,
    },
    // Drawer Footer
    drawerFooter: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '50',
      paddingTop: 12,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logoutBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    logoutText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    themeToggleBtn: {
      padding: 8,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    brandingSection: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 6,
    },
    brandingVersion: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 9.5,
      color: theme.colors.secondary,
      fontWeight: '700',
    },
    brandingDevText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 8,
      color: theme.colors.secondary + '90',
      marginTop: 1,
      textAlign: 'center',
    },
    socialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4,
    },
    socialIconBtn: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    }
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        {/* Right side: Hamburger menu button + Title/logo */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowHamburger(true)}>
            <MaterialIcons name="menu" size={20} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Left side: Back Button */}
        <View style={styles.headerLeft}>
          {showBackButton && (
            <TouchableOpacity style={styles.iconBtn} onPress={onBack || (() => navigation && navigation.goBack())}>
              <MaterialIcons name="arrow-back" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Screen Content Wrapper */}
      <View style={styles.content}>
        {scrollable ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>

      {/* Shared Hamburger Drawer Modal */}
      <Modal
        visible={showHamburger}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHamburger(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackgroundDismiss}
            activeOpacity={1}
            onPress={() => setShowHamburger(false)}
          />
          <View style={styles.drawerContent}>
            
            {/* 1. Drawer Header Profile */}
            <View style={styles.drawerProfileHeader}>
              {/* Right side: Avatar + User Info (aligned to right) */}
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.drawerAvatarContainer}>
                  <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
                </View>
                <View style={styles.drawerProfileInfo}>
                  <Text style={styles.drawerUserName}>{user?.name || 'کاربر سیستم'}</Text>
                  <Text style={styles.drawerUserRole}>{roleLabel}</Text>
                </View>
              </View>

              {/* Left side: Close button */}
              <TouchableOpacity onPress={() => setShowHamburger(false)} style={styles.drawerCloseBtn}>
                <MaterialIcons name="close" size={18} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* 2. Drawer Menu List (Accordion style matching Web!) */}
            <ScrollView style={{ flex: 1, marginVertical: 12 }} contentContainerStyle={styles.drawerScroll} showsVerticalScrollIndicator={false}>
              
              {NAVIGATION_SECTIONS.filter(sec => checkRole(sec.roles)).map((section, sIdx) => (
                <View key={sIdx}>
                  <Text style={styles.drawerSectionTitle}>{section.title}</Text>
                  
                  {section.groups.filter(grp => checkRole(grp.roles)).map((group) => {
                    const isExpanded = expandedGroupId === group.id
                    // Check if any children are visible after applying dynamic settings
                    const visibleChildren = group.items.filter(item => isItemVisible(item.route) && checkRole(item.roles))
                    
                    if (visibleChildren.length === 0) return null

                    return (
                      <View key={group.id}>
                        {/* Group Title Accordion Header */}
                        <TouchableOpacity
                          style={[styles.drawerGroupItem, isExpanded && styles.drawerGroupItemActive]}
                          activeOpacity={0.8}
                          onPress={() => toggleGroup(group.id)}
                        >
                          <View style={styles.drawerGroupRight}>
                            <MaterialIcons name={mapMenuIcon(group.icon) as any} size={20} color={theme.colors.primary} />
                            <Text style={styles.drawerGroupText}>{group.label}</Text>
                          </View>
                          <MaterialIcons
                            name={isExpanded ? 'keyboard-arrow-down' : 'keyboard-arrow-left'}
                            size={20}
                            color={theme.colors.secondary}
                          />
                        </TouchableOpacity>

                        {/* Group Children sub-items */}
                        {isExpanded && (
                          <View style={styles.drawerSubItemsList}>
                            {visibleChildren.map((item, i) => (
                              <TouchableOpacity
                                key={i}
                                style={styles.drawerSubItem}
                                activeOpacity={0.7}
                                onPress={() => handleNav(item.route)}
                              >
                                <Text style={styles.drawerSubItemText}>{item.label}</Text>
                                <MaterialIcons name="chevron-left" size={16} color={theme.colors.secondary} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Unified Drawer Footer */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.themeToggleBtn}
                activeOpacity={0.7}
                onPress={() => toggleTheme()}
              >
                <MaterialIcons
                  name={isDark ? 'wb-sunny' : 'nightlight-round'}
                  size={16}
                  color={theme.colors.onSurface}
                />
              </TouchableOpacity>

              {/* Center: Branding & Social Info */}
              <View style={styles.brandingSection}>
                <Text style={styles.brandingVersion}>{config?.appVersion || 'نسخه ۱.۵.۰'}</Text>
                <Text style={styles.brandingDevText}>{config?.developerText || 'بخش فناوری سیر و حرکت'}</Text>
                
                {/* Social Media Logos */}
                <View style={styles.socialRow}>
                  {socialLinks.map((link: any, idx: number) => {
                    let iconName = 'link'
                    if (link.platform === 'telegram') iconName = 'send'
                    else if (link.platform === 'instagram') iconName = 'camera-alt'
                    else if (link.platform === 'website') iconName = 'language'
                    
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.socialIconBtn}
                        onPress={() => {
                          Alert.alert('ارتباط با سازمان', `انتقال به آدرس: ${link.url}`)
                        }}
                      >
                        <MaterialIcons name={iconName as any} size={11} color={theme.colors.secondary} />
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                activeOpacity={0.7}
                onPress={async () => {
                  setShowHamburger(false)
                  await logout()
                }}
              >
                <MaterialIcons name="logout" size={14} color={theme.colors.onSurface} />
                <Text style={styles.logoutText}>خروج</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface DirectoryUser {
  id: string
  name: string
  nationalId: string
  phone?: string | null
  email?: string | null
  role: {
    name: string
  }
  customFields?: Record<string, any> | null
}

export function DirectoryScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const config = useConfigStore((s) => s.config)
  const isGlobalOffline = useNetworkStore((s) => s.isOffline)
  const setGlobalOffline = useNetworkStore((s) => s.setOffline)

  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Load cache immediately on mount
  useEffect(() => {
    async function loadCache() {
      try {
        const stored = await AsyncStorage.getItem('@directory_users')
        if (stored) {
          setUsers(JSON.parse(stored))
        }
      } catch (err) {
        console.error('Error loading initial directory cache:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCache()
  }, [])

  async function fetchUsers(isRefreshing = false) {
    if (!isRefreshing && !users.length) setLoading(true)
    const isCacheEnabled = config?.mobile?.offlineCacheEnabled !== false

    try {
      const url = search
        ? `${API_URL}/users?q=${encodeURIComponent(search)}`
        : `${API_URL}/users?pageSize=100`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        const fetchedUsers = data.data.users || []
        setUsers(fetchedUsers)
        setIsOffline(false)
        setGlobalOffline(false)

        if (!search && isCacheEnabled) {
          await AsyncStorage.setItem('@directory_users', JSON.stringify(fetchedUsers))
        }
      } else {
        throw new Error('Fetch failed')
      }
    } catch {
      setIsOffline(true)
      setGlobalOffline(true)
      try {
        const stored = await AsyncStorage.getItem('@directory_users')
        if (stored) {
          const allUsers = JSON.parse(stored) as DirectoryUser[]
          const query = search.trim().toLowerCase()
          if (query) {
            const filtered = allUsers.filter((u) => {
              const name = u.name?.toLowerCase() || ''
              const phone = u.phone?.toLowerCase() || ''
              const role = u.role?.name?.toLowerCase() || ''
              const station = String(u.customFields?.station || '').toLowerCase()
              const line = String(u.customFields?.line || '').toLowerCase()
              return name.includes(query) || 
                     phone.includes(query) || 
                     role.includes(query) || 
                     station.includes(query) || 
                     line.includes(query)
            })
            setUsers(filtered)
          } else {
            setUsers(allUsers)
          }
        }
      } catch (err) {
        console.error('Error reading cache:', err)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search, accessToken])

  function handleCall(phone: string) {
    Alert.alert(
      'انتخاب روش تماس',
      `لطفاً روش تماس با شماره ${phone} را انتخاب کنید:`,
      [
        {
          text: '📞 تماس تلفنی معمولی (سیم‌کارت)',
          onPress: () => Linking.openURL(`tel:${phone}`)
        },
        {
          text: '🌐 کنفرانس صوتی خط ۱ (VoIP)',
          onPress: () => navigation.navigate('کنفرانس صوتی')
        },
        {
          text: '📡 شبیه‌ساز بی‌سیم راهبری',
          onPress: () => navigation.navigate('بی‌سیم راهبری')
        },
        {
          text: 'انصراف',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    )
  }

  function handleMessage(userId: string, phone?: string | null) {
    const buttons = [
      {
        text: '💬 چت داخلی اپلیکیشن (بلادرنگ)',
        onPress: () => navigation.navigate('چت', { dm: userId })
      }
    ]

    if (phone) {
      buttons.push({
        text: '✉️ ارسال پیامک معمولی (SMS)',
        onPress: () => Linking.openURL(`sms:${phone}`)
      })
    }

    buttons.push({
      text: 'انصراف',
      style: 'cancel'
    } as any)

    Alert.alert(
      'انتخاب روش ارسال پیام',
      'لطفاً روش ارسال پیام را انتخاب کنید:',
      buttons,
      { cancelable: true }
    )
  }

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.containerMargin,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      height: 48,
      marginBottom: 16,
      ...theme.shadows.level1,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      height: '100%',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    listContainer: {
      paddingBottom: 24,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: 16,
      marginBottom: 12,
      ...theme.shadows.level1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      paddingBottom: 12,
      marginBottom: 12,
    },
    roleContainer: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    roleText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      fontWeight: 'bold',
    },
    nameText: {
      fontSize: theme.typography.cardTitle.fontSize,
      fontFamily: theme.typography.cardTitle.fontFamily,
      color: theme.colors.onSurface,
      fontWeight: '700',
    },
    detailsContainer: {
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    detailLabel: {
      color: theme.colors.secondary,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
    },
    detailValue: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontWeight: '600',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 40,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.level1,
    },
    callButton: {
      backgroundColor: theme.colors.success,
    },
    chatButton: {
      backgroundColor: theme.colors.primary,
    },
    actionText: {
      color: '#ffffff',
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
    },
    emptyText: {
      color: theme.colors.secondary,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
    },
    offlineIndicator: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
      alignItems: 'center',
    },
    offlineText: {
      color: theme.colors.error,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
    },
  })

  function renderItem({ item }: { item: DirectoryUser }) {
    // استخراج فیلدهای پویا
    const station = item.customFields?.station || 'ایستگاه نامشخص'
    const line = item.customFields?.line || 'نامشخص'
    const emergencyContact = item.customFields?.emergencyContact

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>{item.role.name}</Text>
          </View>
          <Text style={styles.nameText}>{item.name}</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{station} ({line})</Text>
            <Text style={styles.detailLabel}>محل خدمت:</Text>
          </View>

          {item.phone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{item.phone}</Text>
              <Text style={styles.detailLabel}>شماره تماس:</Text>
            </View>
          ) : null}

          {emergencyContact ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{emergencyContact}</Text>
              <Text style={styles.detailLabel}>تماس اضطراری:</Text>
            </View>
          ) : null}
        </View>

        {item.phone ? (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleCall(item.phone!)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={16} color="#ffffff" />
              <Text style={styles.actionText}>تماس مستقیم</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => handleMessage(item.id, item.phone)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chat" size={16} color="#ffffff" />
              <Text style={styles.actionText}>ارسال پیام</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <ScreenWrapper title="دفتر تلفن پرسنل" navigation={navigation}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={theme.colors.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="جست‌وجوی پرسنل (نام، شماره، ایستگاه...)"
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
          />
        </View>

        {isOffline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>جست‌وجوی آفلاین بر روی داده‌های کش‌شده</Text>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              fetchUsers(true)
            }}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>
                  {isOffline 
                    ? 'ارتباط قطع است و داده کش‌شده‌ای یافت نشد.' 
                    : 'هیچ کاربری یافت نشد.'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  )
}

export default DirectoryScreen

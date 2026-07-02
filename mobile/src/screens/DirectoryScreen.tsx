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
  Alert,
  Modal,
  Platform,
  Pressable
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

  // Custom Action Sheet Modal state (handles React Native Web compatibility)
  const [actionSheetVisible, setActionSheetVisible] = useState(false)
  const [actionSheetType, setActionSheetType] = useState<'call' | 'message' | null>(null)
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null)

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

  function handleCall(user: DirectoryUser) {
    setSelectedUser(user)
    setActionSheetType('call')
    setActionSheetVisible(true)
  }

  function handleMessage(user: DirectoryUser) {
    setSelectedUser(user)
    setActionSheetType('message')
    setActionSheetVisible(true)
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    modalContent: {
      width: Platform.OS === 'web' ? 450 : '100%',
      maxWidth: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      alignItems: 'stretch',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 6,
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    modalSubtitle: {
      fontSize: 13,
      color: theme.colors.secondary,
      textAlign: 'center',
      marginBottom: 20,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    modalButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 10,
      gap: 12,
    },
    modalButtonText: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontWeight: '600',
    },
    modalCancelButton: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      justifyContent: 'center',
      marginTop: 8,
    },
    modalCancelButtonText: {
      fontSize: 14,
      color: theme.colors.error || '#ef4444',
      fontWeight: 'bold',
      fontFamily: theme.typography.cardTitle.fontFamily,
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
              onPress={() => handleCall(item)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={16} color="#ffffff" />
              <Text style={styles.actionText}>تماس مستقیم</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => handleMessage(item)}
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

      <Modal
        visible={actionSheetVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setActionSheetVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionSheetType === 'call' ? 'انتخاب روش تماس' : 'انتخاب روش ارسال پیام'}
            </Text>
            <Text style={styles.modalSubtitle}>
              ارتباط با {selectedUser?.name}
            </Text>

            {actionSheetType === 'call' && selectedUser?.phone && (
              <>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setActionSheetVisible(false)
                    Linking.openURL(`tel:${selectedUser.phone}`)
                  }}
                >
                  <MaterialIcons name="phone" size={20} color={theme.colors.success} />
                  <Text style={styles.modalButtonText}>تماس تلفنی معمولی (سیم‌کارت)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setActionSheetVisible(false)
                    navigation.navigate('کنفرانس صوتی')
                  }}
                >
                  <MaterialIcons name="group" size={20} color={theme.colors.primary} />
                  <Text style={styles.modalButtonText}>کنفرانس صوتی خط ۱ (VoIP)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setActionSheetVisible(false)
                    navigation.navigate('بی‌سیم راهبری')
                  }}
                >
                  <MaterialIcons name="radio" size={20} color={theme.colors.warning || '#f59e0b'} />
                  <Text style={styles.modalButtonText}>شبیه‌ساز بی‌سیم راهبری</Text>
                </TouchableOpacity>
              </>
            )}

            {actionSheetType === 'message' && selectedUser && (
              <>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setActionSheetVisible(false)
                    navigation.navigate('چت', { dm: selectedUser.id })
                  }}
                >
                  <MaterialIcons name="chat" size={20} color={theme.colors.primary} />
                  <Text style={styles.modalButtonText}>چت داخلی اپلیکیشن (بلادرنگ)</Text>
                </TouchableOpacity>

                {selectedUser.phone && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setActionSheetVisible(false)
                      Linking.openURL(`sms:${selectedUser.phone}`)
                    }}
                  >
                    <MaterialIcons name="sms" size={20} color={theme.colors.success} />
                    <Text style={styles.modalButtonText}>ارسال پیامک معمولی (SMS)</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setActionSheetVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>انصراف</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  )
}

export default DirectoryScreen

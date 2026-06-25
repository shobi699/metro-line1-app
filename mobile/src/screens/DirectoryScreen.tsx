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
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { Phone, MessageSquare, Search, Car, User } from 'lucide-react-native'

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
    Linking.openURL(`tel:${phone}`)
  }

  function handleMessage(userId: string) {
    // ناوبری به تب چت و بازکردن چت مستقیم
    navigation.navigate('چت', { dm: userId })
  }

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
              <Phone size={16} color="#ffffff" />
              <Text style={styles.actionText}>تماس مستقیم</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => handleMessage(item.id)}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color="#ffffff" />
              <Text style={styles.actionText}>ارسال پیام</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={18} color="#a0a3b0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="جست‌وجوی پرسنل (نام، شماره، ایستگاه...)"
          placeholderTextColor="#555860"
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
          <ActivityIndicator size="large" color="#e53935" />
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e24',
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f2f2f7',
    fontSize: 14,
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
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    paddingBottom: 12,
    marginBottom: 12,
  },
  roleContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)', // سبز
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    color: '#34c759',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 16,
    color: '#f2f2f7',
    fontWeight: '600',
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
    color: '#a0a3b0',
    fontSize: 13,
  },
  detailValue: {
    color: '#f2f2f7',
    fontSize: 13,
    fontWeight: '500',
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
    height: 36,
    borderRadius: 6,
  },
  callButton: {
    backgroundColor: '#34c759', // سبز تماس
  },
  chatButton: {
    backgroundColor: '#e53935', // قرمز برند چت
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#a0a3b0',
    fontSize: 14,
  },
  offlineIndicator: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  offlineText: {
    color: '#e53935',
    fontSize: 12,
    fontWeight: 'bold',
  },
})
export default DirectoryScreen

import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import {
  Flame,
  Radio,
  ClipboardList,
  CheckCircle,
  Navigation,
  AlertTriangle,
  Play,
  ArrowRight
} from 'lucide-react-native'

interface Trip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH'
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  status: string
  operationalNote: string | null
  assignment: {
    id: string
    role: string
    acknowledgedAt: string | null
    readyAt: string | null
    handoverAt: string | null
  }
}

export function CabinModeScreen({ navigation }: any) {
  const token = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [gpsLocation, setGpsLocation] = useState('در حال دریافت GPS...')
  const [sosActive, setSosActive] = useState(false)

  // Fetch today's first active/incomplete trip for the cabin
  const fetchActiveTrip = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/me/trips?date=${new Date().toISOString().split('T')[0]}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        const trips: Trip[] = json.data?.trips || []
        // Find first trip that hasn't completed handover
        const current = trips.find(t => !t.assignment.handoverAt) || trips[0] || null
        setActiveTrip(current)
      }
    } catch (err) {
      console.error('Error fetching cabin trip:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveTrip()
    
    // Simulate GPS updates
    const interval = setInterval(() => {
      const lat = (35.6892 + (Math.random() - 0.5) * 0.01).toFixed(4)
      const lng = (51.3890 + (Math.random() - 0.5) * 0.01).toFixed(4)
      setGpsLocation(`عرض: ${lat} | طول: ${lng}`)
    }, 5000)

    return () => clearInterval(interval)
  }, [token])

  const triggerSOS = async () => {
    if (sosActive) {
      setSosActive(false)
      Alert.alert('وضعیت اضطراری', 'وضعیت SOS لغو شد.')
      return
    }

    Alert.alert(
      'تایید ارسال SOS',
      'آیا مطمئن هستید که می‌خواهید هشدار وضعیت اضطراری را به مرکز فرمان ارسال کنید؟ موقعیت مکانی شما فوراً مخابره خواهد شد.',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'ارسال هشدار',
          style: 'destructive',
          onPress: async () => {
            setSosActive(true)
            try {
              await fetch(`${API_URL}/crisis/sos`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  geoLocation: gpsLocation,
                  tripId: activeTrip?.id
                })
              })
            } catch {}
          }
        }
      ]
    )
  }

  const handleAction = async (actionType: 'ready' | 'handover') => {
    if (!activeTrip) return
    try {
      const res = await fetch(`${API_URL}/trips/${activeTrip.id}/${actionType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ geoLocation: gpsLocation })
      })

      if (res.ok) {
        Alert.alert('موفقیت', actionType === 'ready' ? 'اعلام آمادگی ثبت شد.' : 'تحویل کابین ثبت شد.')
        fetchActiveTrip()
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error || 'خطایی رخ داد.')
      }
    } catch {
      Alert.alert('خطا', 'عدم اتصال به شبکه.')
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    )
  }

  const dirLabel = activeTrip?.direction === 'TAJRISH_TO_SHAHRREY' ? 'تجریش ➔ شهرری' : 'شهرری ➔ تجریش'

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>وضعیت مانیتور راهبری کابین</Text>
        <Text style={styles.headerSubtitle}>خط ۱ مترو تهران</Text>
      </View>

      {/* GPS Status */}
      <View style={[styles.card, styles.gpsCard]}>
        <Navigation size={18} color="#FFD60A" />
        <Text style={styles.gpsText}>{gpsLocation}</Text>
      </View>

      {/* Active Trip Information */}
      {activeTrip ? (
        <View style={styles.tripCard}>
          <Text style={styles.tripLabel}>سفر فعال جاری</Text>
          <Text style={styles.directionText}>{dirLabel}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>قطار</Text>
              <Text style={styles.detailValue}>{activeTrip.trainNumber || '—'}</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>حرکت</Text>
              <Text style={styles.detailValue}>{activeTrip.departureTime || '—'}</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>رسیدن</Text>
              <Text style={styles.detailValue}>{activeTrip.arrivalTime || '—'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {!activeTrip.assignment.readyAt ? (
              <TouchableOpacity style={styles.readyButton} onPress={() => handleAction('ready')}>
                <Play size={20} color="#000" />
                <Text style={styles.readyButtonText}>اعلام آمادگی حرکت</Text>
              </TouchableOpacity>
            ) : !activeTrip.assignment.handoverAt ? (
              <TouchableOpacity style={styles.handoverButton} onPress={() => handleAction('handover')}>
                <CheckCircle size={20} color="#FFF" />
                <Text style={styles.handoverButtonText}>ثبت تحویل کابین</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBlock}>
                <CheckCircle size={24} color="#30D158" />
                <Text style={styles.completedText}>این سفر با موفقیت به پایان رسید</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>هیچ سفر فعال و معلقی برای امروز ثبت نشده است.</Text>
        </View>
      )}

      {/* Auxiliary Buttons */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Checklists')}>
          <ClipboardList size={32} color="#0A84FF" />
          <Text style={styles.gridText}>چک‌لیست ایمنی</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('RadioSimulator')}>
          <Radio size={32} color="#30D158" />
          <Text style={styles.gridText}>بی‌سیم راهبری</Text>
        </TouchableOpacity>
      </View>

      {/* SOS Button */}
      <TouchableOpacity 
        style={[styles.sosButton, sosActive && styles.sosActiveButton]} 
        onPress={triggerSOS}
      >
        <Flame size={40} color="#FFF" />
        <Text style={styles.sosButtonText}>
          {sosActive ? 'لغو SOS اضطراری' : 'SOS وضعیت اضطراری'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  gpsCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD60A/30',
  },
  gpsText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tripCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  tripLabel: {
    color: '#FFF',
    opacity: 0.6,
    fontSize: 12,
    marginBottom: 4,
  },
  directionText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailBlock: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    color: '#FFF',
    opacity: 0.5,
    fontSize: 11,
    marginBottom: 6,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionRow: {
    marginTop: 8,
  },
  readyButton: {
    backgroundColor: '#FFD60A',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  readyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  handoverButton: {
    backgroundColor: '#30D158',
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  handoverButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedBlock: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  completedText: {
    color: '#30D158',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row-reverse',
    gap: 16,
    marginBottom: 24,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  gridText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sosButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  sosActiveButton: {
    backgroundColor: '#8E8E93',
    shadowColor: '#8E8E93',
  },
  sosButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  }
})

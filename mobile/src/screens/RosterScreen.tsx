import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  MapPin,
  Flame,
  FileText,
  User,
  HelpCircle,
  Users
} from 'lucide-react-native'

interface TripAssignment {
  id: string
  role: 'H1' | 'H2' | 'T' | 'R'
  rawName: string | null
  matchedUserId: string | null
  personnelNo: string | null
  matchStatus: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
  confirmedAt: string | null
  matchedUser?: {
    name: string
  }
}

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
  assignment?: TripAssignment // For driver view
  assignments: TripAssignment[] // For full view
}

interface RosterDay {
  id: string
  jalaliDate: string
  gregorianDate: string
  title: string
  schedulingTitle: string
  versionNo: number
}

// Helpers to format Persian numbers manually in Mobile App
function toPersianDigits(num: number | string): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, (d) => persian[Number(d)])
}

export function RosterScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [loading, setLoading] = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'cabin' | 'all'>('cabin')
  
  // Driver personal trips
  const [rosterDay, setRosterDay] = useState<RosterDay | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])

  // Full line trips (All Today Roster)
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [allDirectionFilter, setAllDirectionFilter] = useState<'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'>('SHAHRREY_TO_TAJRISH')
  
  // Dispute Modal state
  const [disputeModalVisible, setDisputeModalVisible] = useState(false)
  const [disputeNote, setDisputeNote] = useState('')
  const [disputeTripId, setDisputeTripId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Calendar Sync Modal state
  const [syncModalVisible, setSyncModalVisible] = useState(false)

  // Fetch driver's personal roster
  async function fetchRoster(showLoader = true) {
    if (!accessToken) return
    if (showLoader) setLoading(true)
    
    try {
      const res = await fetch(`${API_URL}/me/roster/today`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setRosterDay(json.data.rosterDay)
          setTrips(json.data.trips)
          
          // Save to offline cache
          await AsyncStorage.setItem(
            '@driver_roster_today',
            JSON.stringify(json.data)
          )
        }
      } else {
        await loadOfflineCache()
      }
    } catch (err) {
      await loadOfflineCache()
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  // Fetch entire roster of the line
  async function fetchAllRoster(showLoader = true) {
    if (!accessToken) return
    if (showLoader) setAllLoading(true)
    
    try {
      const res = await fetch(`${API_URL}/supervisor/roster/today`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data?.trips) {
          setAllTrips(json.data.trips)
          
          // Save to offline cache
          await AsyncStorage.setItem(
            '@all_roster_today',
            JSON.stringify(json.data.trips)
          )
        }
      } else {
        await loadAllOfflineCache()
      }
    } catch {
      await loadAllOfflineCache()
    } finally {
      if (showLoader) setAllLoading(false)
    }
  }

  // Load roster data from storage if offline
  async function loadOfflineCache() {
    try {
      const cached = await AsyncStorage.getItem('@driver_roster_today')
      if (cached) {
        const parsed = JSON.parse(cached)
        setRosterDay(parsed.rosterDay)
        setTrips(parsed.trips)
      }
    } catch {
      // silent
    }
  }

  async function loadAllOfflineCache() {
    try {
      const cached = await AsyncStorage.getItem('@all_roster_today')
      if (cached) {
        setAllTrips(JSON.parse(cached))
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (accessToken) {
      void fetchRoster()
      void fetchAllRoster()
    }
  }, [accessToken])

  // Refreshes based on current tab
  function handleRefresh() {
    if (activeTab === 'all') {
      void fetchAllRoster(true)
    } else {
      void fetchRoster(true)
    }
  }

  // Driver action handlers
  async function handleTripAction(tripId: string, actionType: 'receipt' | 'ready' | 'cabin-handover') {
    if (!accessToken) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/trips/${tripId}/${actionType}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const json = await res.json()
      
      if (res.ok) {
        Alert.alert('موفقیت', json.message || 'عملیات با موفقیت ثبت شد.')
        await fetchRoster(false)
      } else {
        Alert.alert('خطا', json.error || 'خطا در ثبت عملیات')
      }
    } catch {
      Alert.alert('خطا', 'خطا در ارتباط با سرور')
    } finally {
      setActionLoading(false)
    }
  }

  // Report dispute handler
  async function handleDisputeSubmit() {
    if (!accessToken || !disputeTripId || !disputeNote.trim()) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_URL}/trips/${disputeTripId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ disputeNote: disputeNote.trim() })
      })
      const json = await res.json()
      
      if (res.ok) {
        Alert.alert('موفقیت', 'گزارش مغایرت ثبت گردید.')
        setDisputeModalVisible(false)
        setDisputeNote('')
        setDisputeTripId(null)
        await fetchRoster(false)
      } else {
        Alert.alert('خطا', json.error || 'خطا در ثبت گزارش')
      }
    } catch {
      Alert.alert('خطا', 'خطا در ارتباط با سرور')
    } finally {
      setActionLoading(false)
    }
  }

  // Find current trip for Cabin Mode
  const currentTrip = trips.find(t => t.assignment && !t.assignment.handoverAt) || trips[0]

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <Text style={styles.headerTitle}>برنامه لوحه و اعزام راهبر</Text>
          {rosterDay ? (
            <Text style={styles.headerSubtitle}>
              تاریخ: {toPersianDigits(rosterDay.jalaliDate)} | نسخه: {toPersianDigits(rosterDay.versionNo)}
            </Text>
          ) : (
            <Text style={styles.headerSubtitle}>لوحه امروز بارگذاری نشده است</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          <TouchableOpacity style={styles.refreshButton} onPress={() => setSyncModalVisible(true)}>
            <Calendar size={20} color="#ff3b30" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Clock size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs - 3 options */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' ? styles.activeTab : null]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' ? styles.activeTabText : null]}>
            کل لوحه روز
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' ? styles.activeTab : null]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[styles.tabText, activeTab === 'timeline' ? styles.activeTabText : null]}>
            خط زمان من
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cabin' ? styles.activeTab : null]}
          onPress={() => setActiveTab('cabin')}
        >
          <Text style={[styles.tabText, activeTab === 'cabin' ? styles.activeTabText : null]}>
            کابین (Cabin)
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'all' ? (
        /* Full Daily Roster View for everyone */
        allLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ff3b30" />
            <Text style={styles.loaderText}>در حال دریافت لوحه کل خط...</Text>
          </View>
        ) : allTrips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HelpCircle size={48} color="#8e8e93" />
            <Text style={styles.emptyText}>هیچ لوحه اعزامی برای کل خط ثبت نشده است.</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Direction Filter Toggles */}
            <View style={styles.directionFilter}>
              <TouchableOpacity
                style={[styles.filterBtn, allDirectionFilter === 'SHAHRREY_TO_TAJRISH' ? styles.filterBtnActive : null]}
                onPress={() => setAllDirectionFilter('SHAHRREY_TO_TAJRISH')}
              >
                <Text style={[styles.filterBtnText, allDirectionFilter === 'SHAHRREY_TO_TAJRISH' ? styles.filterBtnTextActive : null]}>
                  شهرری ← تجریش
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterBtn, allDirectionFilter === 'TAJRISH_TO_SHAHRREY' ? styles.filterBtnActive : null]}
                onPress={() => setAllDirectionFilter('TAJRISH_TO_SHAHRREY')}
              >
                <Text style={[styles.filterBtnText, allDirectionFilter === 'TAJRISH_TO_SHAHRREY' ? styles.filterBtnTextActive : null]}>
                  تجریش ← شهرری
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {allTrips
                .filter(t => t.direction === allDirectionFilter)
                .map((trip) => {
                  const h1 = trip.assignments.find(a => a.role === 'H1')
                  const h2 = trip.assignments.find(a => a.role === 'H2')
                  const assistT = trip.assignments.find(a => a.role === 'T')
                  const assistR = trip.assignments.find(a => a.role === 'R')
                  
                  return (
                    <View key={trip.id} style={styles.fullTripCard}>
                      <View style={styles.fullCardHeader}>
                        <Text style={styles.fullTrainText}>قطار {toPersianDigits(trip.trainNumber || '—')}</Text>
                        <Text style={styles.fullTimeText}>
                          {toPersianDigits(trip.departureTime || '')} ← {toPersianDigits(trip.arrivalTime || '')}
                        </Text>
                      </View>
                      
                      <View style={styles.fullCardBody}>
                        {/* H1 Row */}
                        <View style={styles.driverRow}>
                          <User size={13} color="#a0a3b0" />
                          <Text style={styles.driverLabel}>H1 (اصلی):</Text>
                          <Text style={styles.driverName}>
                            {h1?.matchedUser?.name || h1?.rawName || 'تخصیص نیافته'}
                          </Text>
                          {h1?.readyAt && (
                            <View style={styles.activeDot} />
                          )}
                        </View>
 
                        {/* H2 Row */}
                        <View style={styles.driverRow}>
                          <User size={13} color="#a0a3b0" />
                          <Text style={styles.driverLabel}>H2 (دوم):</Text>
                          <Text style={styles.driverName}>
                            {h2?.matchedUser?.name || h2?.rawName || 'کابین تک راهبر'}
                          </Text>
                          {h2?.readyAt && (
                            <View style={styles.activeDot} />
                          )}
                        </View>

                        {/* Assistant T Row */}
                        {assistT && (
                          <View style={styles.driverRow}>
                            <User size={13} color="#a0a3b0" />
                            <Text style={styles.driverLabel}>کمکی T:</Text>
                            <Text style={styles.driverName}>
                              {assistT?.matchedUser?.name || assistT?.rawName || '—'}
                            </Text>
                            {assistT?.readyAt && (
                              <View style={styles.activeDot} />
                            )}
                          </View>
                        )}

                        {/* Assistant R Row */}
                        {assistR && (
                          <View style={styles.driverRow}>
                            <User size={13} color="#a0a3b0" />
                            <Text style={styles.driverLabel}>کمکی R:</Text>
                            <Text style={styles.driverName}>
                              {assistR?.matchedUser?.name || assistR?.rawName || '—'}
                            </Text>
                            {assistR?.readyAt && (
                              <View style={styles.activeDot} />
                            )}
                          </View>
                        )}

                        {/* Notes / Disputes */}
                        {trip.operationalNote && (
                          <Text style={styles.fullNoteText}>پیام: {trip.operationalNote}</Text>
                        )}
                        {((h1?.disputed) || (h2?.disputed) || (assistT?.disputed) || (assistR?.disputed)) && (
                          <Text style={styles.fullAlertText}>
                            ⚠️ مغایرت: {h1?.disputeNote || h2?.disputeNote || assistT?.disputeNote || assistR?.disputeNote}
                          </Text>
                        )}
                      </View>
                    </View>
                  )
                })}
            </ScrollView>
          </View>
        )
      ) : loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ff3b30" />
          <Text style={styles.loaderText}>در حال دریافت برنامه لوحه روزانه...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <HelpCircle size={48} color="#8e8e93" />
          <Text style={styles.emptyText}>هیچ سفری در لوحه امروز برای شما ثبت نشده است.</Text>
        </View>
      ) : activeTab === 'timeline' ? (
        /* Driver Timeline View */
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.trainText}>قطار {toPersianDigits(trip.trainNumber || '—')}</Text>
                {trip.assignment && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{trip.assignment.role}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.routeRow}>
                  <Text style={styles.stationText}>
                    {trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'}
                  </Text>
                  <ArrowLeftRight size={14} color="#8e8e93" style={styles.arrowIcon} />
                  <Text style={styles.stationText}>
                    {trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'}
                  </Text>
                </View>

                <View style={styles.timeRow}>
                  <Clock size={14} color="#a0a3b0" />
                  <Text style={styles.timeText}>
                    حرکت: {toPersianDigits(trip.departureTime || '')} | رسیدن: {toPersianDigits(trip.arrivalTime || '')}
                  </Text>
                </View>

                {trip.operationalNote && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>پیام: {trip.operationalNote}</Text>
                  </View>
                )}

                {/* Workflow Status Indicators */}
                {trip.assignment && (
                  <View style={styles.workflowContainer}>
                    <View style={styles.workflowStep}>
                      <CheckCircle size={12} color={trip.assignment.acknowledgedAt ? '#34c759' : '#8e8e93'} />
                      <Text style={[styles.stepText, trip.assignment.acknowledgedAt ? styles.stepTextActive : null]}>
                        رؤیت
                      </Text>
                    </View>
                    <View style={styles.workflowStep}>
                      <CheckCircle size={12} color={trip.assignment.readyAt ? '#34c759' : '#8e8e93'} />
                      <Text style={[styles.stepText, trip.assignment.readyAt ? styles.stepTextActive : null]}>
                        آمادگی
                      </Text>
                    </View>
                    <View style={styles.workflowStep}>
                      <CheckCircle size={12} color={trip.assignment.handoverAt ? '#34c759' : '#8e8e93'} />
                      <Text style={[styles.stepText, trip.assignment.handoverAt ? styles.stepTextActive : null]}>
                        تحویل
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* Cabin Mode (High contrast current trip display) */
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {currentTrip && currentTrip.assignment && (
            <View style={styles.cabinContainer}>
              
              {/* Trip Highlight details */}
              <View style={styles.cabinCard}>
                <Text style={styles.cabinAlertTitle}>سفر جاری / بعدی راهبر</Text>
                
                <Text style={styles.cabinTrainNumber}>
                  قطار {toPersianDigits(currentTrip.trainNumber || '—')}
                </Text>
                
                <View style={styles.cabinRoute}>
                  <Text style={styles.cabinStation}>
                    {currentTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'ایستگاه شهرری' : 'ایستگاه تجریش'}
                  </Text>
                  <Text style={styles.cabinArrow}>↓</Text>
                  <Text style={styles.cabinStation}>
                    {currentTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'ایستگاه تجریش' : 'ایستگاه شهرری'}
                  </Text>
                </View>

                <View style={styles.cabinTimeRow}>
                  <Text style={styles.cabinTimeLabel}>ساعت حرکت:</Text>
                  <Text style={styles.cabinTimeValue}>{toPersianDigits(currentTrip.departureTime || '')}</Text>
                </View>
                
                <View style={styles.cabinTimeRow}>
                  <Text style={styles.cabinTimeLabel}>سمت و نقش شما:</Text>
                  <Text style={styles.cabinRoleValue}>
                    {currentTrip.assignment.role === 'H1'
                      ? 'راهبر اصلی (H1)'
                      : currentTrip.assignment.role === 'H2'
                      ? 'راهبر دوم (H2)'
                      : currentTrip.assignment.role === 'T'
                      ? 'راهبر کمکی (T)'
                      : 'راهبر کمکی (R)'}
                  </Text>
                </View>
              </View>

              {/* Action workflows */}
              <View style={styles.actionsBox}>
                {actionLoading ? (
                  <ActivityIndicator size="large" color="#ff3b30" />
                ) : (
                  <>
                    {/* Step 1: Acknowledge */}
                    {!currentTrip.assignment.acknowledgedAt && (
                      <TouchableOpacity
                        style={[styles.bigButton, styles.receiptBtn]}
                        onPress={() => handleTripAction(currentTrip.id, 'receipt')}
                      >
                        <Text style={styles.bigButtonText}>تأیید رؤیت برنامه شیت اعزام</Text>
                      </TouchableOpacity>
                    )}

                    {/* Step 2: Ready */}
                    {currentTrip.assignment.acknowledgedAt && !currentTrip.assignment.readyAt && (
                      <TouchableOpacity
                        style={[styles.bigButton, styles.readyBtn]}
                        onPress={() => handleTripAction(currentTrip.id, 'ready')}
                      >
                        <Text style={styles.bigButtonText}>اعلام حضور و آمادگی در کابین</Text>
                      </TouchableOpacity>
                    )}

                    {/* Step 3: Cabin Handover */}
                    {currentTrip.assignment.readyAt && !currentTrip.assignment.handoverAt && (
                      <TouchableOpacity
                        style={[styles.bigButton, styles.handoverBtn]}
                        onPress={() => handleTripAction(currentTrip.id, 'cabin-handover')}
                      >
                        <Text style={styles.bigButtonText}>ثبت تحویل نهایی کابین و پایان سفر</Text>
                      </TouchableOpacity>
                    )}

                    {/* Success state */}
                    {currentTrip.assignment.handoverAt && (
                      <View style={styles.successState}>
                        <CheckCircle size={32} color="#34c759" />
                        <Text style={styles.successStateText}>سفر با موفقیت انجام و تحویل داده شد.</Text>
                      </View>
                    )}

                    {/* Dispute button */}
                    {!currentTrip.assignment.disputed ? (
                      <TouchableOpacity
                        style={styles.disputeButton}
                        onPress={() => {
                          setDisputeTripId(currentTrip.id)
                          setDisputeModalVisible(true)
                        }}
                      >
                        <Text style={styles.disputeButtonText}>ثبت مغایرت در لوحه / تاخیر</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.disputedContainer}>
                        <AlertTriangle size={16} color="#ffcc00" />
                        <Text style={styles.disputedText}>مغایرت ثبت شده است: {currentTrip.assignment.disputeNote}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Dispute Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={disputeModalVisible}
        onRequestClose={() => setDisputeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ثبت مغایرت لوحه اعزام</Text>
            <Text style={styles.modalSubtitle}>علت مغایرت، تغییر شیفت یا عدم امکان انجام سفر را بنویسید:</Text>
            
            <TextInput
              style={styles.textInput}
              multiline={true}
              numberOfLines={4}
              placeholder="مثلا: تاخیر راهبر کمکی یا جابجایی با آقای..."
              placeholderTextColor="#8e8e93"
              value={disputeNote}
              onChangeText={setDisputeNote}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={handleDisputeSubmit}
              >
                <Text style={styles.modalBtnText}>ثبت مغایرت</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setDisputeModalVisible(false)
                  setDisputeNote('')
                }}
              >
                <Text style={styles.modalBtnText}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Sync Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={syncModalVisible}
        onRequestClose={() => setSyncModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>همگام‌سازی تقویم گوشی</Text>
            <Text style={styles.modalSubtitle}>
              لینک زیر را کپی کرده و به برنامه تقویم خود (Google یا Apple Calendar) اضافه کنید تا نوبت سفرهایتان همیشه سینک باشد:
            </Text>
            
            <TextInput
              style={[styles.textInput, { fontSize: 10, fontFamily: 'monospace', textAlign: 'left' }]}
              readOnly={true}
              selectTextOnFocus={true}
              value={`${API_URL}/me/roster/export?token=${accessToken}`}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn, { flex: 1 }]}
                onPress={() => setSyncModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>بستن</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#262930',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#262930',
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1e2127',
    padding: 4,
    margin: 16,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#262930',
  },
  tabText: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#ffffff',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  directionFilter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1c1e24',
  },
  filterBtnActive: {
    borderColor: '#ff3b30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  filterBtnText: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: 'bold',
  },
  filterBtnTextActive: {
    color: '#ff3b30',
  },
  tripCard: {
    backgroundColor: '#1c1e24',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262930',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#262930',
    paddingBottom: 8,
    marginBottom: 8,
  },
  trainText: {
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 8,
  },
  routeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  stationText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  arrowIcon: {
    transform: [{ scaleX: -1 }],
  },
  timeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#a0a3b0',
  },
  noteContainer: {
    backgroundColor: 'rgba(255, 153, 0, 0.1)',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 153, 0, 0.2)',
    alignItems: 'flex-end',
  },
  noteText: {
    fontSize: 10,
    color: '#ff9900',
  },
  workflowContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#262930',
    paddingTop: 10,
    marginTop: 4,
  },
  workflowStep: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  stepText: {
    fontSize: 10,
    color: '#8e8e93',
  },
  stepTextActive: {
    color: '#34c759',
    fontWeight: 'bold',
  },
  fullTripCard: {
    backgroundColor: '#1c1e24',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#262930',
  },
  fullCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#262930',
    paddingBottom: 6,
    marginBottom: 8,
  },
  fullTrainText: {
    fontSize: 13,
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  fullTimeText: {
    fontSize: 12,
    color: '#34c759',
    fontWeight: 'bold',
    fontMono: true,
  },
  fullCardBody: {
    gap: 6,
  },
  driverRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  driverLabel: {
    fontSize: 11,
    color: '#8e8e93',
  },
  driverName: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34c759',
    marginLeft: 6,
  },
  fullNoteText: {
    fontSize: 10,
    color: '#ff9500',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: 4,
    borderRadius: 4,
    textAlign: 'right',
    marginTop: 4,
  },
  fullAlertText: {
    fontSize: 10,
    color: '#ff3b30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 4,
    borderRadius: 4,
    textAlign: 'right',
    marginTop: 2,
  },
  cabinContainer: {
    gap: 16,
  },
  cabinCard: {
    backgroundColor: '#1c1e24',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ff3b30',
    alignItems: 'center',
  },
  cabinAlertTitle: {
    fontSize: 12,
    color: '#ff3b30',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cabinTrainNumber: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cabinRoute: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cabinStation: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cabinArrow: {
    fontSize: 20,
    color: '#8e8e93',
    marginVertical: 4,
  },
  cabinTimeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#262930',
  },
  cabinTimeLabel: {
    fontSize: 13,
    color: '#8e8e93',
  },
  cabinTimeValue: {
    fontSize: 13,
    color: '#34c759',
    fontWeight: 'bold',
  },
  cabinRoleValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  actionsBox: {
    gap: 12,
  },
  bigButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  receiptBtn: {
    backgroundColor: '#ff9500',
  },
  readyBtn: {
    backgroundColor: '#34c759',
  },
  handoverBtn: {
    backgroundColor: '#007aff',
  },
  bigButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  disputeButton: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#8e8e93',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disputeButtonText: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '500',
  },
  disputedContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.3)',
    alignItems: 'center',
    gap: 8,
  },
  disputedText: {
    fontSize: 12,
    color: '#ffcc00',
    flex: 1,
    textAlign: 'right',
  },
  successState: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  successStateText: {
    color: '#34c759',
    fontSize: 13,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1c1e24',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#262930',
  },
  modalTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#13151a',
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: '#ff3b30',
  },
  modalCancelBtn: {
    backgroundColor: '#262930',
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
})

export default RosterScreen

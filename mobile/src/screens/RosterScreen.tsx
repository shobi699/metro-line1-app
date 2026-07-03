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
  RefreshControl,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../shared/ThemeProvider'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { cachedFetch } from '../shared/cached-fetch'
import { getJalaliDateLabel } from '../shared/jalali'
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
  Users,
  ChevronLeft,
  ChevronRight
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  const [loading, setLoading] = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'cabin' | 'all'>('cabin')
  const { theme } = useTheme()
  const styles = React.useMemo(() => getStyles(theme), [theme])
  
  // Driver personal trips
  const [rosterDay, setRosterDay] = useState<RosterDay | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])

  // Full line trips (All Today Roster)
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [allDirectionFilter, setAllDirectionFilter] = useState<'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'>('SHAHRREY_TO_TAJRISH')
  const [allSearchQuery, setAllSearchQuery] = useState('')

  // Filtered trips for "Whole Daily Roster" tab
  const filteredAllTrips = React.useMemo(() => {
    return allTrips
      .filter((t) => t.direction === allDirectionFilter)
      .filter((t) => {
        if (!allSearchQuery.trim()) return true
        const query = allSearchQuery.toLowerCase().trim()
        const trainNo = (t.trainNumber || '').toLowerCase()
        if (trainNo.includes(query)) return true
        
        return t.assignments.some(a => {
          const name = (a.matchedUser?.name || a.rawName || '').toLowerCase()
          const personnel = (a.personnelNo || '').toLowerCase()
          const role = (a.role || '').toLowerCase()
          return name.includes(query) || personnel.includes(query) || role.includes(query)
        })
      })
  }, [allTrips, allDirectionFilter, allSearchQuery])

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
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      const data = await cachedFetch<any>(`/me/roster/today?date=${dateStr}`)
      if (data) {
        setRosterDay(data.rosterDay)
        setTrips(data.trips)
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
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      const data = await cachedFetch<any>(`/supervisor/roster/today?date=${dateStr}`)
      if (data) {
        setAllTrips(data.trips)
        if (data.rosterDay) {
          setRosterDay(data.rosterDay)
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
  }, [accessToken, selectedDate])

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
  const activeTrip = trips.find(t => t.assignment && !t.assignment.handoverAt) || trips[0]
  const currentTrip = activeTrip

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <Calendar size={20} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>لوحه و برنامه‌ریزی</Text>
        </View>
        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          <TouchableOpacity style={styles.refreshButton} onPress={() => setSyncModalVisible(true)}>
            <Calendar size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Clock size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Navigator (RTL correct navigation) */}
      <View style={styles.dateNavigator}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => {
            const next = new Date(selectedDate)
            next.setDate(next.getDate() + 1)
            setSelectedDate(next)
          }}
        >
          <ChevronRight size={18} color={theme.colors.primary} />
          <Text style={styles.dateNavBtnText}>روز بعد</Text>
        </TouchableOpacity>

        <View style={styles.dateLabelContainer}>
          <Text style={styles.dateLabelText}>
            {getJalaliDateLabel(selectedDate)}
          </Text>
          {rosterDay ? (
            <Text style={styles.versionLabelText}>
              نسخه {toPersianDigits(rosterDay.versionNo)}
            </Text>
          ) : (
            <Text style={styles.versionLabelText}>فاقد لوحه منتشر شده</Text>
          )}
          {!isToday && (
            <TouchableOpacity
              style={styles.todayPill}
              onPress={() => setSelectedDate(new Date())}
            >
              <Text style={styles.todayPillText}>بازگشت به امروز</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => {
            const prev = new Date(selectedDate)
            prev.setDate(prev.getDate() - 1)
            setSelectedDate(prev)
          }}
        >
          <Text style={styles.dateNavBtnText}>روز قبل</Text>
          <ChevronLeft size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs - 3 options */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' ? styles.activeTab : null]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' ? styles.activeTabLabel : null]}>
            کل لوحه روز
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' ? styles.activeTab : null]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[styles.tabText, activeTab === 'timeline' ? styles.activeTabLabel : null]}>
            خط زمان من
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cabin' ? styles.activeTab : null]}
          onPress={() => setActiveTab('cabin')}
        >
          <Text style={[styles.tabText, activeTab === 'cabin' ? styles.activeTabLabel : null]}>
            کابین (Cabin)
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'all' ? (
        /* Full Daily Roster View for everyone */
        allLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>در حال دریافت برنامه لوحه...</Text>
          </View>
        ) : !rosterDay ? (
          <View style={styles.emptyContainer}>
            <HelpCircle size={48} color={theme.colors.secondary} />
            <Text style={styles.emptyText}>هیچ لوحه اعزامی برای کل خط ثبت نشده است.</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="جستجو در شماره قطار، نام راهبر، سمت..."
                placeholderTextColor={theme.colors.secondary}
                value={allSearchQuery}
                onChangeText={setAllSearchQuery}
              />
            </View>

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

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={allLoading}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
            >
              {filteredAllTrips.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <HelpCircle size={48} color={theme.colors.secondary} />
                  <Text style={styles.emptyText}>
                    {allSearchQuery.trim() 
                      ? 'موردی یافت نشد.' 
                      : 'هیچ سفری در این مسیر برای امروز ثبت نشده است.'}
                  </Text>
                </View>
              ) : (
                filteredAllTrips.map((trip) => {
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
                            <User size={13} color={theme.colors.secondary} />
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
                            <User size={13} color={theme.colors.secondary} />
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
                              <User size={13} color={theme.colors.secondary} />
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
                              <User size={13} color={theme.colors.secondary} />
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
                  })
              )}
            </ScrollView>
          </View>
        )
      ) : activeTab === 'timeline' ? (
        /* Driver Timeline View */
        loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>در حال دریافت برنامه لوحه روزانه...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <HelpCircle size={48} color={theme.colors.secondary} />
            <Text style={styles.emptyText}>هیچ سفری در لوحه امروز برای شما ثبت نشده است.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
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
                    <ArrowLeftRight size={14} color={theme.colors.secondary} style={styles.arrowIcon} />
                    <Text style={styles.stationText}>
                      {trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'}
                    </Text>
                  </View>

                  <View style={styles.timeRow}>
                    <Clock size={14} color={theme.colors.secondary} />
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
                        <CheckCircle size={12} color={trip.assignment.acknowledgedAt ? theme.colors.success : theme.colors.border} />
                        <Text style={[styles.stepText, trip.assignment.acknowledgedAt ? styles.stepTextActive : null]}>
                          رؤیت
                        </Text>
                      </View>
                      <View style={styles.workflowStep}>
                        <CheckCircle size={12} color={trip.assignment.readyAt ? theme.colors.success : theme.colors.border} />
                        <Text style={[styles.stepText, trip.assignment.readyAt ? styles.stepTextActive : null]}>
                          آمادگی
                        </Text>
                      </View>
                      <View style={styles.workflowStep}>
                        <CheckCircle size={12} color={trip.assignment.handoverAt ? theme.colors.success : theme.colors.border} />
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
        )
      ) : (
        /* Cabin Mode (High contrast current trip display) */
        loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loaderText}>در حال بارگذاری سفر...</Text>
          </View>
        ) : activeTrip ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            <View style={styles.cabinContainer}>
              
              {/* Trip Highlight details */}
              <View style={styles.cabinCard}>
                <Text style={styles.cabinAlertTitle}>سفر جاری / بعدی راهبر</Text>
                
                <Text style={styles.cabinTrainNumber}>
                  قطار {toPersianDigits(activeTrip.trainNumber || '—')}
                </Text>
                
                <View style={styles.cabinRoute}>
                  <Text style={styles.cabinStation}>
                    {activeTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'ایستگاه شهرری' : 'ایستگاه تجریش'}
                  </Text>
                  <Text style={styles.cabinArrow}>↓</Text>
                  <Text style={styles.cabinStation}>
                    {activeTrip.direction === 'SHAHRREY_TO_TAJRISH' ? 'ایستگاه تجریش' : 'ایستگاه شهرری'}
                  </Text>
                </View>

                <View style={styles.cabinTimeRow}>
                  <Text style={styles.cabinTimeLabel}>ساعت حرکت:</Text>
                  <Text style={styles.cabinTimeValue}>{toPersianDigits(activeTrip.departureTime || '')}</Text>
                </View>
                {currentTrip.assignment && (
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
                )}
              </View>

              {/* Action workflows */}
              <View style={styles.actionsBox}>
                {actionLoading ? (
                  <ActivityIndicator size="large" color="#ff3b30" />
                ) : currentTrip.assignment ? (
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
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>جزئیات انتساب برای این سفر ثبت نشده است.</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <HelpCircle size={48} color={theme.colors.secondary} />
            <Text style={styles.emptyText}>هیچ سفری در لوحه امروز برای شما ثبت نشده است.</Text>
          </View>
        )
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dateNavigator: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateNavBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dateNavBtnText: {
    fontSize: 11,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  dateLabelContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabelText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.bodyMd.fontFamily,
    textAlign: 'center',
  },
  versionLabelText: {
    fontSize: 9,
    color: theme.colors.secondary,
    marginTop: 2,
    fontFamily: theme.typography.captionSm.fontFamily,
    textAlign: 'center',
  },
  todayPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: theme.colors.primaryContainer + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  todayPillText: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.screenTitle.fontFamily,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.secondary,
    marginTop: 2,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.md,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 4,
    margin: 16,
    borderRadius: theme.borderRadius.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    ...theme.shadows.level1,
  },
  tabText: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '600',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  activeTabLabel: {
    color: theme.colors.primary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    color: theme.colors.secondary,
    fontSize: 12,
    marginTop: 12,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: theme.colors.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: theme.typography.bodyMd.fontFamily,
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
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  filterBtnActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer + '1A',
  },
  filterBtnText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  filterBtnTextActive: {
    color: theme.colors.primary,
  },
  tripCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.level1,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  trainText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  roleBadge: {
    backgroundColor: theme.colors.primaryContainer + '1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
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
    color: theme.colors.onSurface,
    fontWeight: '500',
    fontFamily: theme.typography.bodyMd.fontFamily,
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
    color: theme.colors.secondary,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  noteContainer: {
    backgroundColor: theme.colors.warning + '1A',
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
    alignItems: 'flex-end',
  },
  noteText: {
    fontSize: 10,
    color: theme.colors.warning,
    fontFamily: theme.typography.captionSm.fontFamily,
    fontWeight: '600',
  },
  workflowContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: theme.colors.border,
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
    color: theme.colors.secondary,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  stepTextActive: {
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  fullTripCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.level1,
  },
  fullCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: 6,
    marginBottom: 8,
  },
  fullTrainText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  fullTimeText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: 'bold',
    fontFamily: 'monospace',
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
    color: theme.colors.secondary,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  driverName: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontWeight: '500',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginLeft: 6,
  },
  fullNoteText: {
    fontSize: 10,
    color: theme.colors.warning,
    backgroundColor: theme.colors.warning + '1A',
    padding: 4,
    borderRadius: 4,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: theme.typography.captionSm.fontFamily,
    fontWeight: '600',
  },
  fullAlertText: {
    fontSize: 10,
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer + '1A',
    padding: 4,
    borderRadius: 4,
    textAlign: 'right',
    marginTop: 2,
    fontFamily: theme.typography.captionSm.fontFamily,
    fontWeight: '600',
  },
  cabinContainer: {
    gap: 16,
  },
  cabinCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    ...theme.shadows.level2,
  },
  cabinAlertTitle: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  cabinTrainNumber: {
    fontSize: 32,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: theme.typography.numericHero.fontFamily,
  },
  cabinRoute: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cabinStation: {
    fontSize: 18,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    fontFamily: theme.typography.screenTitle.fontFamily,
  },
  cabinArrow: {
    fontSize: 20,
    color: theme.colors.secondary,
    marginVertical: 4,
  },
  cabinTimeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  cabinTimeLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  cabinTimeValue: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: 'bold',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  cabinRoleValue: {
    fontSize: 13,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  actionsBox: {
    gap: 12,
  },
  bigButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    ...theme.shadows.level2,
  },
  receiptBtn: {
    backgroundColor: theme.colors.warning,
  },
  readyBtn: {
    backgroundColor: theme.colors.success,
  },
  handoverBtn: {
    backgroundColor: theme.colors.info,
  },
  bigButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  disputeButton: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disputeButtonText: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  disputedContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.warning + '1A',
    padding: 12,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
    alignItems: 'center',
    gap: 8,
  },
  disputedText: {
    fontSize: 12,
    color: theme.colors.warning,
    flex: 1,
    textAlign: 'right',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  successState: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  successStateText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.secondary,
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 18,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    color: theme.colors.onSurface,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 20,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.primary,
  },
  modalCancelBtn: {
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.onSurface,
    fontSize: 13,
    textAlign: 'right',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
})

export default RosterScreen

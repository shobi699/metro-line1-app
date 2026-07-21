import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native'
import { useTheme } from '../shared/ThemeProvider'
import { useAuthStore } from '../stores/auth'
import { getJalaliDateString, getJalaliDateLabel } from '../shared/jalali'
import { useRosterStore, MyRosterTrip } from '../stores/roster'
import { Calendar, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react-native'

import { SearchFilterBarMobile, MobileFilterState } from '../components/roster/SearchFilterBarMobile'
import { NextDepartureHeroMobile, MobileTripData } from '../components/roster/NextDepartureHeroMobile'
import { TripCardMobile } from '../components/roster/TripCardMobile'
import { TripDetailsBottomSheet } from '../components/roster/TripDetailsBottomSheet'

// Persian numbers
function toPersianDigits(num: number | string): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, (d) => persian[Number(d)])
}

// Client-side search for mobile (mimics useRosterSearch)
function normalizeText(text: string | null | undefined): string {
  if (!text) return ''
  const arabicYe = 'ي'
  const persianYe = 'ی'
  const arabicKe = 'ك'
  const persianKe = 'ک'
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g]
  const arabicDigits  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g]
  
  let normalized = text.toLowerCase()
    .replace(new RegExp(arabicYe, 'g'), persianYe)
    .replace(new RegExp(arabicKe, 'g'), persianKe)
    
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i))
  }
  return normalized.trim()
}

export function RosterScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const rosterStore = useRosterStore()
  
  const [rosterDay, setRosterDay] = useState<any>(null)
  const [trips, setTrips] = useState<MyRosterTrip[]>([])
  
  const [selectedTrip, setSelectedTrip] = useState<MyRosterTrip | null>(null)
  const [isSheetVisible, setIsSheetVisible] = useState(false)

  const [filters, setFilters] = useState<MobileFilterState>({
    query: '',
    direction: 'ALL',
    onlyAmended: false,
    onlyConflicts: false,
  })

  async function fetchRoster(showLoader = true) {
    if (!accessToken) return
    if (showLoader) setLoading(true)
    
    try {
      const jalaliDate = getJalaliDateString(selectedDate)
      const data = await rosterStore.getDay(jalaliDate)
      
      if (data && data.rosterDayId) {
        setRosterDay({
          id: data.rosterDayId,
          versionNo: data.versionNo
        })
        setTrips(data.trips)
      } else {
        setRosterDay(null)
        setTrips([])
      }
    } catch (err) {
      console.warn('Error fetching personal roster', err)
    } finally {
      if (showLoader) setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      void fetchRoster()
    }
  }, [accessToken, selectedDate])

  const handleRefresh = () => {
    void fetchRoster(true)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Find Next Departure
  const nextTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null
    return trips.find(t => !t.handoverAt) || trips[0]
  }, [trips])

  // Map trips to MobileTripData format
  const mappedTrips = useMemo(() => trips.map(t => ({
    id: t.id,
    trainNumber: t.trainNumber,
    direction: t.direction,
    departureTime: t.departureTime,
    status: t.status,
    isAmended: false, // Map from payload if available
    operationalNote: t.operationalNote,
    myRole: t.myRole,
    assignmentId: t.assignmentId,
    handoverAt: t.handoverAt,
    coCrew: t.coCrew
  })), [trips])

  const mappedNextTrip = nextTrip ? {
    id: nextTrip.id,
    trainNumber: nextTrip.trainNumber,
    direction: nextTrip.direction,
    departureTime: nextTrip.departureTime,
    status: nextTrip.status,
    isAmended: false,
    operationalNote: nextTrip.operationalNote,
    myRole: nextTrip.myRole,
    assignmentId: nextTrip.assignmentId,
    handoverAt: nextTrip.handoverAt,
    coCrew: nextTrip.coCrew
  } : null

  // Filter Logic
  const filteredTrips = useMemo(() => {
    return mappedTrips.filter(trip => {
      if (filters.direction !== 'ALL' && trip.direction !== filters.direction) return false
      if (filters.onlyAmended && !trip.isAmended) return false
      // Only Conflicts not fully mapped from MyRosterTrip for this example
      
      const query = normalizeText(filters.query)
      if (!query) return true

      const isTimeQuery = query.includes(':') || /^\d{2}$/.test(query)
      const isTrainQuery = /^\d{1,3}$/.test(query) && !query.includes(':')
      
      if (isTrainQuery || !isTimeQuery) {
        if (normalizeText(trip.trainNumber).includes(query)) return true
      }
      if (isTimeQuery || !isTrainQuery) {
        if (normalizeText(trip.departureTime).includes(query)) return true
      }
      const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
      const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'
      if (normalizeText(origin).includes(query) || normalizeText(dest).includes(query)) return true

      return false
    })
  }, [mappedTrips, filters])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Header Info */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerRight}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>لوحه روز من</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Calendar size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Navigator */}
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
        </TouchableOpacity>

        <View style={styles.dateLabelContainer}>
          <Text style={[styles.dateLabelText, { color: theme.colors.text }]}>
            {getJalaliDateLabel(selectedDate)}
          </Text>
          {rosterDay && (
            <Text style={[styles.versionLabelText, { color: theme.colors.secondary }]}>
              نسخه {toPersianDigits(rosterDay.versionNo)}
            </Text>
          )}
          {!isToday && (
            <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
              <Text style={{ color: theme.colors.primary, fontSize: 12, marginTop: 4 }}>بازگشت به امروز</Text>
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
          <ChevronLeft size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Next Departure Hero (Only if not filtering) */}
      {!filters.query && !filters.onlyAmended && filters.direction === 'ALL' && mappedNextTrip && (
        <NextDepartureHeroMobile 
          trip={mappedNextTrip} 
          onPress={() => {
            const originalTrip = trips.find(t => t.id === mappedNextTrip.id)
            if (originalTrip) {
              setSelectedTrip(originalTrip)
              setIsSheetVisible(true)
            }
          }}
        />
      )}

      {/* Search and Filters */}
      {(trips.length > 0 || filters.query !== '') && (
        <SearchFilterBarMobile 
          filters={filters}
          onFilterChange={setFilters}
          resultCount={filters.query ? filteredTrips.length : undefined}
        />
      )}

      {/* Trips List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <HelpCircle size={48} color={theme.colors.border} />
          <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
            هیچ سفری در لوحه امروز برای شما ثبت نشده است.
          </Text>
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
          {filteredTrips.map(trip => (
            <TripCardMobile 
              key={trip.id} 
              trip={trip} 
              onPress={() => {
                const originalTrip = trips.find(t => t.id === trip.id)
                if (originalTrip) {
                  setSelectedTrip(originalTrip)
                  setIsSheetVisible(true)
                }
              }} 
            />
          ))}
          
          {filteredTrips.length === 0 && (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
                موردی مطابق جستجوی شما یافت نشد.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <TripDetailsBottomSheet 
        trip={selectedTrip} 
        visible={isSheetVisible} 
        onClose={() => setIsSheetVisible(false)} 
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 18,
  },
  refreshButton: {
    padding: 8,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateNavBtn: {
    padding: 12,
  },
  dateLabelContainer: {
    alignItems: 'center',
  },
  dateLabelText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  },
  versionLabelText: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  }
})

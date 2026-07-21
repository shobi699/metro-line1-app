import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Train, Clock, ArrowLeftRight, AlertTriangle, Timer } from 'lucide-react-native'
import { useTheme } from '../../shared/ThemeProvider'

export interface MobileTripData {
  id: string
  trainNumber: string | null
  direction: string
  departureTime: string | null
  status: string
  isAmended?: boolean
  operationalNote?: string | null
  myRole: string
  assignmentId: string
  handoverAt: string | null
}

interface NextDepartureHeroMobileProps {
  trip: MobileTripData
  amendmentNumber?: number
  onAction?: (tripId: string, actionType: 'receipt' | 'ready' | 'cabin-handover') => void
  onPress?: () => void
}

function parseTimeToDate(timeString: string | null): Date | null {
  if (!timeString) return null
  const [hours, minutes] = timeString.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return null
  const now = new Date()
  now.setHours(hours, minutes, 0, 0)
  return now
}

// Persian numbers
function toPersianDigits(num: number | string): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, (d) => persian[Number(d)])
}

export function NextDepartureHeroMobile({ trip, amendmentNumber, onAction, onPress }: NextDepartureHeroMobileProps) {
  const { theme } = useTheme()
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isUrgent, setIsUrgent] = useState(false)

  const isCancelled = trip.status === 'CANCELLED'
  const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
  const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'

  useEffect(() => {
    if (!trip.departureTime || isCancelled || trip.handoverAt) {
      setTimeLeft('')
      setIsUrgent(false)
      return
    }

    const targetDate = parseTimeToDate(trip.departureTime)
    if (!targetDate) return

    const timer = setInterval(() => {
      const now = new Date()
      const diffMs = targetDate.getTime() - now.getTime()
      
      if (diffMs <= 0) {
        setTimeLeft('زمان اعزام')
        setIsUrgent(true)
        clearInterval(timer)
        return
      }

      const diffMins = Math.floor(diffMs / 60000)
      
      setIsUrgent(diffMins <= 15)
      setTimeLeft(toPersianDigits(diffMins) + ' دقیقه دیگر')
    }, 1000)

    return () => clearInterval(timer)
  }, [trip.departureTime, isCancelled, trip.handoverAt])

  if (trip.handoverAt) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.successState}>
          <Text style={[styles.successText, { color: theme.colors.success }]}>همه سفرهای امروز انجام شد</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, 
      isCancelled ? styles.cancelledBg : 
      trip.isAmended ? styles.amendedBg : 
      { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }
    ]}>
      {/* Hero Banner Area */}
      {(trip.isAmended || isCancelled) && (
        <View style={[styles.alertBanner, isCancelled ? styles.bgRed : styles.bgOrange]}>
          <AlertTriangle size={14} color="#fff" />
          <Text style={styles.alertText}>
            {isCancelled ? 'این سفر لغو شده است' : `سفر شما تغییر کرده است (اصلاحیه ${toPersianDigits(amendmentNumber || '')})`}
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.content}
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
      >
        <View style={styles.headerRow}>
          <View style={styles.badgeLabel}>
            <Text style={styles.badgeText}>اعزام بعدی</Text>
          </View>
          <View style={[styles.badgeRole, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>نقش: {trip.myRole}</Text>
          </View>
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>ساعت حرکت</Text>
            <Text style={[styles.timeValue, isCancelled && styles.strike]}>
              {toPersianDigits(trip.departureTime || '--:--')}
            </Text>
          </View>
          
          <View style={styles.routeBox}>
            <Text style={[styles.routeStation, { color: theme.colors.text }]}>{origin}</Text>
            <ArrowLeftRight size={16} color={theme.colors.secondary} style={styles.arrow} />
            <Text style={[styles.routeStation, { color: theme.colors.text }]}>{dest}</Text>
            
            <View style={styles.trainBox}>
              <Train size={14} color={theme.colors.secondary} />
              <Text style={[styles.trainText, { color: theme.colors.secondary }]}>
                قطار {toPersianDigits(trip.trainNumber || '---')}
              </Text>
            </View>
          </View>
        </View>

        {!isCancelled && timeLeft && (
          <View style={styles.timerRow}>
            <Timer size={16} color={isUrgent ? '#ef4444' : theme.colors.secondary} />
            <Text style={[styles.timerText, isUrgent ? styles.textRed : { color: theme.colors.secondary }]}>
              {timeLeft}
            </Text>
          </View>
        )}

        {trip.operationalNote && (
          <View style={styles.noteBox}>
            <AlertTriangle size={14} color="#b45309" />
            <Text style={styles.noteText}>{trip.operationalNote}</Text>
          </View>
        )}

        {/* Quick Actions per ROSTER_UI_DESIGN.md */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
            onPress={onPress}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>جزئیات</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.actionBtnText, { color: theme.colors.text }]}>فالت قطار</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
          >
            <ArrowLeftRight size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelledBg: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  amendedBg: {
    backgroundColor: '#fff7ed',
    borderColor: '#f97316',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  bgRed: { backgroundColor: '#ef4444' },
  bgOrange: { backgroundColor: '#f97316' },
  alertText: {
    color: '#fff',
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeLabel: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeRole: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 10,
    color: '#4b5563',
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeBox: {
    alignItems: 'flex-start',
  },
  timeLabel: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  timeValue: {
    fontFamily: 'Vazirmatn-Black',
    fontSize: 32,
    color: '#111827',
  },
  strike: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  routeBox: {
    alignItems: 'flex-end',
  },
  routeStation: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 18,
  },
  arrow: {
    marginVertical: 2,
    transform: [{ rotate: '90deg' }], // vertical arrow for layout
  },
  trainBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trainText: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    marginBottom: 12,
  },
  timerText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
  },
  textRed: { color: '#ef4444' },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  noteText: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
  },
  successState: {
    padding: 24,
    alignItems: 'center',
  },
  successText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  }
})

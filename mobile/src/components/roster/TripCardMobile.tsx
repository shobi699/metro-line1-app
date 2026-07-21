import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { ArrowLeftRight, CheckCircle, AlertTriangle } from 'lucide-react-native'
import { useTheme } from '../../shared/ThemeProvider'
import { MobileTripData } from './NextDepartureHeroMobile'

interface TripCardMobileProps {
  trip: MobileTripData
  onPress?: () => void
}

// Persian numbers
function toPersianDigits(num: number | string): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, (d) => persian[Number(d)])
}

export function TripCardMobile({ trip, onPress }: TripCardMobileProps) {
  const { theme } = useTheme()
  const isPast = !!trip.handoverAt
  const isCancelled = trip.status === 'CANCELLED'
  
  const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
  const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={onPress}
      style={[
        styles.container, 
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        isPast && { opacity: 0.6 },
        trip.isAmended && !isPast && { borderColor: '#f97316' }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.timeBox}>
          <Text style={[styles.timeText, { color: theme.colors.text }, isCancelled && styles.strike]}>
            {toPersianDigits(trip.departureTime || '--:--')}
          </Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.routeRow}>
            <Text style={[styles.stationText, { color: theme.colors.text }]}>{origin}</Text>
            <ArrowLeftRight size={12} color={theme.colors.secondary} style={styles.arrow} />
            <Text style={[styles.stationText, { color: theme.colors.text }]}>{dest}</Text>
            
            <Text style={[styles.trainText, { color: theme.colors.secondary, marginLeft: 8 }]}>
              {toPersianDigits(trip.trainNumber || '-')}
            </Text>

            {isPast && (
              <View style={[styles.pastBadge, { marginLeft: 'auto' }]}>
                <CheckCircle size={14} color={theme.colors.secondary} />
                <Text style={[styles.pastText, { color: theme.colors.secondary, marginLeft: 4 }]}>✓شده</Text>
              </View>
            )}
            {isCancelled && (
              <View style={[styles.cancelledBadge, { marginLeft: 'auto' }]}>
                <Text style={styles.cancelledText}>لغو شده</Text>
              </View>
            )}
          </View>
          
          <View style={styles.bottomRow}>
            <Text style={[styles.roleText, { color: theme.colors.secondary }]}>
              {trip.myRole}
            </Text>
            {trip.isAmended && (
              <Text style={{ color: '#f97316', fontSize: 12, marginLeft: 8 }}>▲</Text>
            )}
            {trip.operationalNote && (
              <AlertTriangle size={14} color="#f59e0b" style={{ marginLeft: 8 }} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  timeBox: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
    paddingRight: 12,
    marginRight: 12,
  },
  timeText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  detailsBox: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stationText: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
  },
  arrow: {
    marginHorizontal: 4,
  },
  trainBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trainText: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 12,
  },
  amendedBadge: {
    marginLeft: 8,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  amendedText: {
    color: '#f97316',
    fontSize: 10,
  },
  statusBox: {
    marginLeft: 8,
  },
  pastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pastText: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 10,
  },
  cancelledBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cancelledText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 10,
    color: '#ef4444',
  }
})

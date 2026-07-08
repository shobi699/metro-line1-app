import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  Alert
} from 'react-native'
import { useTheme } from '../../shared/ThemeProvider'
import { MyRosterTrip } from '../../stores/roster'
import {
  X,
  MapPin,
  ArrowLeftRight,
  Clock,
  Phone,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react-native'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

interface TripDetailsBottomSheetProps {
  trip: MyRosterTrip | null
  visible: boolean
  onClose: () => void
}

// Persian numbers
function toPersianDigits(num: number | string): string {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, (d) => persian[Number(d)])
}

export function TripDetailsBottomSheet({ trip, visible, onClose }: TripDetailsBottomSheetProps) {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'CREW' | 'REPORT'>('DETAILS')
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT))

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }).start()
      
      // Reset tab after hide
      setTimeout(() => setActiveTab('DETAILS'), 300)
    }
  }, [visible, slideAnim])

  if (!trip && !visible) return null

  const handleClose = () => {
    onClose()
  }

  const handleCall = (name: string) => {
    Alert.alert('تماس', `تماس با ${name} (شبیه‌سازی)`)
  }

  const handleChat = (name: string) => {
    Alert.alert('پیام', `ارسال پیام به ${name} (شبیه‌سازی)`)
  }

  const handleReport = () => {
    Alert.alert('گزارش', 'ثبت گزارش سریع برای این سفر (شبیه‌سازی)')
  }

  const renderContent = () => {
    if (!trip) return null

    if (activeTab === 'DETAILS') {
      const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
      const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'

      return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.routeHeader}>
              <View style={styles.routeBox}>
                <MapPin size={16} color={theme.colors.primary} />
                <Text style={[styles.stationText, { color: theme.colors.text }]}>{origin}</Text>
                <ArrowLeftRight size={14} color={theme.colors.secondary} style={{ marginHorizontal: 8 }} />
                <Text style={[styles.stationText, { color: theme.colors.text }]}>{dest}</Text>
              </View>
              <View style={[styles.trainBadge, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Text style={[styles.trainBadgeLabel, { color: theme.colors.secondary }]}>قطار</Text>
                <Text style={[styles.trainBadgeValue, { color: theme.colors.text }]}>{toPersianDigits(trip.trainNumber || '-')}</Text>
              </View>
            </View>

            <View style={[styles.timesRow, { borderTopColor: theme.colors.border }]}>
              <View style={styles.timeBox}>
                <View style={styles.timeLabelRow}>
                  <Clock size={12} color={theme.colors.secondary} />
                  <Text style={[styles.timeLabel, { color: theme.colors.secondary }]}>حرکت</Text>
                </View>
                <Text style={[styles.timeValue, { color: theme.colors.text }]}>{toPersianDigits(trip.departureTime || '--:--')}</Text>
              </View>
              <View style={[styles.timeDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.timeBox}>
                <View style={styles.timeLabelRow}>
                  <Clock size={12} color={theme.colors.secondary} />
                  <Text style={[styles.timeLabel, { color: theme.colors.secondary }]}>ورود</Text>
                </View>
                <Text style={[styles.timeValue, { color: theme.colors.text }]}>{toPersianDigits(trip.arrivalTime || '--:--')}</Text>
              </View>
            </View>
          </View>

          {trip.operationalNote && (
            <View style={styles.noteCard}>
              <AlertTriangle size={20} color="#f59e0b" style={{ marginTop: 2 }} />
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle}>توضیحات عملیاتی:</Text>
                <Text style={styles.noteText}>{trip.operationalNote}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )
    }

    if (activeTab === 'CREW') {
      return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          {trip.coCrew && trip.coCrew.length > 0 ? (
            trip.coCrew.map((crew, idx) => {
              const isMe = crew.role === trip.myRole
              return (
                <View 
                  key={idx} 
                  style={[
                    styles.crewCard, 
                    { backgroundColor: theme.colors.card, borderColor: isMe ? theme.colors.primary : theme.colors.border }
                  ]}
                >
                  <View style={styles.crewInfo}>
                    <View style={[styles.roleBadge, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.roleText, { color: theme.colors.text }]}>{crew.role}</Text>
                    </View>
                    <Text style={[styles.crewName, { color: theme.colors.text }]}>
                      {crew.name || 'تخصیص‌نیافته'}
                    </Text>
                    {isMe && (
                      <View style={[styles.meBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.meText}>شما</Text>
                      </View>
                    )}
                  </View>
                  {!isMe && crew.name && (
                    <View style={styles.crewActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleChat(crew.name!)}>
                        <MessageSquare size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(crew.name!)}>
                        <Phone size={20} color="#16a34a" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
                همکاری برای این سفر ثبت نشده است.
              </Text>
            </View>
          )}
        </ScrollView>
      )
    }

    if (activeTab === 'REPORT') {
      return (
        <View style={styles.tabContent}>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={handleReport}
            activeOpacity={0.8}
          >
            <AlertTriangle size={24} color="#fff" />
            <Text style={styles.reportButtonText}>ثبت گزارش سریع (تاخیر/خرابی)</Text>
          </TouchableOpacity>
          <Text style={[styles.reportHelp, { color: theme.colors.secondary }]}>
            با کلیک روی دکمه بالا فرم گزارش برای این اعزام باز می‌شود.
          </Text>
        </View>
      )
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <Animated.View 
          style={[
            styles.sheet, 
            { backgroundColor: theme.colors.background, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          </View>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>جزئیات سفر</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'DETAILS' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => setActiveTab('DETAILS')}
            >
              <FileText size={16} color={activeTab === 'DETAILS' ? theme.colors.primary : theme.colors.secondary} />
              <Text style={[styles.tabText, { color: activeTab === 'DETAILS' ? theme.colors.primary : theme.colors.secondary }]}>جزئیات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'CREW' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => setActiveTab('CREW')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'CREW' ? theme.colors.primary : theme.colors.secondary }]}>همکاران</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'REPORT' && { borderBottomColor: theme.colors.primary }]}
              onPress={() => setActiveTab('REPORT')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'REPORT' ? theme.colors.primary : theme.colors.secondary }]}>گزارش</Text>
            </TouchableOpacity>
          </View>

          {renderContent()}

        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.65,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 20,
  },
  closeBtn: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationText: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 16,
    marginLeft: 6,
  },
  trainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  trainBadgeLabel: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
  },
  trainBadgeValue: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  },
  timesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    height: '100%',
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timeLabel: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
  },
  timeValue: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 24,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
    color: '#b45309',
    marginBottom: 4,
  },
  noteText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
    color: '#d97706',
    lineHeight: 22,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  crewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 12,
  },
  crewName: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 15,
  },
  meBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  meText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 10,
    color: '#fff',
  },
  crewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
  },
  reportButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  reportButtonText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
    color: '#fff',
  },
  reportHelp: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  }
})

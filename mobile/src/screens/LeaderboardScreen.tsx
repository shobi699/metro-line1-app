import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { API_URL } from '../shared/config'
import { MaterialIcons } from '@expo/vector-icons'

export default function LeaderboardScreen({ navigation }: any) {
  const { accessToken } = useAuthStore()
  const { theme } = useTheme()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/gamification/leaderboard?period=${period}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setLeaderboard(json.data || [])
      } else {
        Alert.alert('خطا', 'مشکل در دریافت جدول رده‌بندی')
      }
    } catch (e) {
      console.error(e)
      Alert.alert('خطا', 'مشکل در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const toFa = (numStr: string | number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  // Simple period changer (Farsi month name helpers)
  const getFarsiMonthName = (dateStr: string) => {
    const month = parseInt(dateStr.slice(5, 7))
    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ]
    return months[month - 1] || ''
  }

  return (
    <ScreenWrapper title="جدول برترها" showBack onBack={() => navigation.goBack()}>
      <View style={[s.headerCard, { backgroundColor: theme.colors.primary }]}>
        <View style={s.headerContent}>
          <MaterialIcons name="emoji-events" size={48} color="#f59e0b" />
          <View style={{ marginRight: 12, flex: 1 }}>
            <Text style={s.headerTitle}>لیگ ستارگان راهبری خط ۱</Text>
            <Text style={s.headerDesc}>نمایش پرسنل نمونه بر اساس رعایت اصول ایمنی و عملکرد بی‌نقص</Text>
          </View>
        </View>

        <View style={s.periodSelector}>
          <TouchableOpacity 
            style={s.periodBtn} 
            onPress={() => {
              const current = new Date(period + '-01')
              current.setMonth(current.getMonth() - 1)
              setPeriod(current.toISOString().slice(0, 7))
            }}
          >
            <MaterialIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.periodText}>{toFa(period.slice(0, 4))} - {getFarsiMonthName(period)}</Text>
          <TouchableOpacity 
            style={s.periodBtn} 
            onPress={() => {
              const current = new Date(period + '-01')
              current.setMonth(current.getMonth() + 1)
              setPeriod(current.toISOString().slice(0, 7))
            }}
          >
            <MaterialIcons name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.colors.primary} />
      ) : (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {top3.length > 0 && (
            <View style={s.podiumContainer}>
              {/* Rank 2 */}
              {top3[1] && (
                <View style={[s.podiumCol, s.podiumRank2]}>
                  <View style={s.avatarContainer}>
                    <Text style={s.podiumRankNumber}>۲</Text>
                    <MaterialIcons name="person" size={40} color="#94a3b8" />
                  </View>
                  <Text style={s.podiumName} numberOfLines={1}>{top3[1].name}</Text>
                  <View style={[s.podiumBar, { backgroundColor: '#cbd5e1', height: 60 }]}>
                    <Text style={s.podiumPoints}>{toFa(top3[1].totalPoints)}</Text>
                    <Text style={s.podiumPointsLabel}>امتیاز</Text>
                  </View>
                </View>
              )}

              {/* Rank 1 */}
              {top3[0] && (
                <View style={[s.podiumCol, s.podiumRank1]}>
                  <View style={s.avatarContainer}>
                    <MaterialIcons name="star" size={20} color="#f59e0b" style={s.crown} />
                    <Text style={s.podiumRankNumber}>۱</Text>
                    <MaterialIcons name="person" size={48} color="#f59e0b" />
                  </View>
                  <Text style={s.podiumName} numberOfLines={1}>{top3[0].name}</Text>
                  <View style={[s.podiumBar, { backgroundColor: '#f59e0b', height: 80 }]}>
                    <Text style={s.podiumPoints}>{toFa(top3[0].totalPoints)}</Text>
                    <Text style={s.podiumPointsLabel}>امتیاز</Text>
                  </View>
                </View>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <View style={[s.podiumCol, s.podiumRank3]}>
                  <View style={s.avatarContainer}>
                    <Text style={s.podiumRankNumber}>۳</Text>
                    <MaterialIcons name="person" size={40} color="#b45309" />
                  </View>
                  <Text style={s.podiumName} numberOfLines={1}>{top3[2].name}</Text>
                  <View style={[s.podiumBar, { backgroundColor: '#d97706', height: 50 }]}>
                    <Text style={s.podiumPoints}>{toFa(top3[2].totalPoints)}</Text>
                    <Text style={s.podiumPointsLabel}>امتیاز</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {leaderboard.length === 0 ? (
            <Text style={s.emptyText}>هیچ داده ارزیابی برای این دوره وجود ندارد.</Text>
          ) : (
            <View style={s.listContainer}>
              {rest.map((user, index) => (
                <View key={user.userId} style={s.listItem}>
                  <Text style={s.listRank}>#{toFa(index + 4)}</Text>
                  <View style={s.listAvatar}>
                    <MaterialIcons name="person" size={24} color="#64748b" />
                  </View>
                  <Text style={s.listName}>{user.name}</Text>
                  <Text style={s.listPoints}>{toFa(user.totalPoints)} امتیاز</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerCard: { padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, direction: 'rtl' },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 18, color: '#fff' },
  headerDesc: { fontFamily: 'Vazirmatn', fontSize: 12, color: '#f1f5f9', marginTop: 4, lineHeight: 18 },
  
  periodSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  periodBtn: { padding: 8 },
  periodText: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#fff' },

  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginVertical: 24, direction: 'rtl' },
  podiumCol: { alignItems: 'center', width: 100 },
  podiumRank1: { marginHorizontal: 8, zIndex: 2 },
  podiumRank2: { zIndex: 1 },
  podiumRank3: { zIndex: 1 },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0', marginBottom: 8, position: 'relative' },
  podiumRankNumber: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#1e293b', color: '#fff', fontSize: 10, fontFamily: 'Vazirmatn-Bold', width: 18, height: 18, borderRadius: 9, textAlign: 'center', lineHeight: 18 },
  crown: { position: 'absolute', top: -16, alignSelf: 'center' },
  podiumName: { fontFamily: 'Vazirmatn-Medium', fontSize: 13, color: '#334155', marginBottom: 6 },
  podiumBar: { width: 80, borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'center', alignItems: 'center' },
  podiumPoints: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#fff' },
  podiumPointsLabel: { fontFamily: 'Vazirmatn', fontSize: 9, color: '#fff', opacity: 0.8 },

  listContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9', direction: 'rtl' },
  listRank: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#64748b', width: 40, textAlign: 'left' },
  listAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  listName: { flex: 1, fontFamily: 'Vazirmatn-Medium', fontSize: 14, color: '#1e293b', textAlign: 'right' },
  listPoints: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#0f172a' },
  emptyText: { fontFamily: 'Vazirmatn', fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 40 }
})

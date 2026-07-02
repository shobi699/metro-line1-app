import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { API_URL } from '../shared/config'

export default function PerformanceScreen({ navigation }: any) {
  const { accessToken } = useAuthStore()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appealingId, setAppealingId] = useState<string | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [tab, setTab] = useState<'me' | 'leaderboard'>('me')
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  // Gamification stats
  const [points, setPoints] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [logsRes, myPointsRes, lbRes] = await Promise.all([
        fetch(`${API_URL}/performance/logs`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/gamification/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/gamification/leaderboard`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ])
      
      if (logsRes.ok) {
        const json = await logsRes.json()
        setLogs(json.data || [])
      }

      if (myPointsRes.ok) {
        const pjson = await myPointsRes.json()
        setPoints(pjson.data?.totalPoints || 0)
      }
      
      if (lbRes.ok) {
        const ljson = await lbRes.json()
        setLeaderboard(ljson.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitAppeal(logId: string) {
    if (appealReason.length < 5) {
      Alert.alert('خطا', 'متن اعتراض باید حداقل ۵ کاراکتر باشد.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/performance/appeals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ logId, reason: appealReason })
      })

      if (res.ok) {
        Alert.alert('موفقیت', 'اعتراض شما با موفقیت ثبت شد و در انتظار بررسی است.', [
          { text: 'باشه', onPress: () => { setAppealingId(null); setAppealReason(''); fetchData() } }
        ])
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error?.message || 'خطا در ثبت اعتراض')
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکل در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScreenWrapper title="عملکرد و تشویقات" showBack onBack={() => navigation.goBack()}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#ae0011" />
      ) : (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={s.tabContainer}>
            <TouchableOpacity style={[s.tabBtn, tab === 'me' && s.tabBtnActive]} onPress={() => setTab('me')}>
              <Text style={[s.tabText, tab === 'me' && s.tabTextActive]}>عملکرد من</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tabBtn, tab === 'leaderboard' && s.tabBtnActive]} onPress={() => setTab('leaderboard')}>
              <Text style={[s.tabText, tab === 'leaderboard' && s.tabTextActive]}>لیدربورد (برترین‌ها)</Text>
            </TouchableOpacity>
          </View>

          {tab === 'me' && (
            <>
              <View style={s.scoreCard}>
                <MaterialIcons name="emoji-events" size={40} color="#f59e0b" />
                <Text style={s.scoreLabel}>مجموع امتیازات (گیمیفیکیشن)</Text>
                <Text style={s.scoreValue}>{points}</Text>
              </View>

              <Text style={s.sectionTitle}>سوابق عملکردی شما</Text>
              {logs.map((log) => {
                const isPositive = log.actionType?.competency?.direction === 'positive'
                return (
                  <View key={log.id} style={s.logCard}>
                    <View style={s.logHeader}>
                      <View style={s.logIconBox}>
                        <MaterialIcons name={isPositive ? "star" : "warning"} size={24} color={isPositive ? "#10b981" : "#ef4444"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.logTitle}>{log.actionType?.title}</Text>
                        <Text style={s.logPeriod}>دوره ارزیابی: {log.periodId}</Text>
                      </View>
                      <View style={[s.badge, log.status === 'active' ? s.badgeActive : log.status === 'appealed' ? s.badgeWarning : s.badgeMuted]}>
                        <Text style={s.badgeText}>{log.status === 'active' ? 'قطعی' : log.status === 'appealed' ? 'در حال بررسی' : 'لغو شده'}</Text>
                      </View>
                    </View>

                    {log.status === 'active' && !isPositive && appealingId !== log.id && (
                      <TouchableOpacity style={s.appealBtn} onPress={() => setAppealingId(log.id)}>
                        <MaterialIcons name="feedback" size={16} color="#64748b" />
                        <Text style={s.appealBtnText}>ثبت اعتراض (Appeal)</Text>
                      </TouchableOpacity>
                    )}

                    {appealingId === log.id && (
                      <View style={s.appealBox}>
                        <TextInput 
                          style={s.appealInput}
                          placeholder="دلیل اعتراض خود را کامل بنویسید..."
                          multiline
                          value={appealReason}
                          onChangeText={setAppealReason}
                        />
                        <View style={s.appealActions}>
                          <TouchableOpacity style={s.cancelBtn} onPress={() => setAppealingId(null)}>
                            <Text style={s.cancelBtnText}>انصراف</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={() => handleSubmitAppeal(log.id)} disabled={submitting}>
                            {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.submitBtnText}>ارسال اعتراض</Text>}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
              {logs.length === 0 && <Text style={s.emptyText}>هیچ سابقه عملکردی برای شما ثبت نشده است.</Text>}
            </>
          )}

          {tab === 'leaderboard' && (
            <View>
              {leaderboard.map((lb, index) => (
                <View key={lb.userId} style={s.lbItem}>
                  <Text style={s.lbRank}>#{index + 1}</Text>
                  <Text style={s.lbName}>{lb.user.firstName} {lb.user.lastName}</Text>
                  <Text style={s.lbPoints}>{lb.totalScore} امتیاز</Text>
                </View>
              ))}
              {leaderboard.length === 0 && <Text style={s.emptyText}>لیدربورد در حال حاضر خالی است.</Text>}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scoreCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 2 },
  scoreLabel: { fontSize: 14, fontFamily: 'Vazirmatn-Medium', color: '#64748b', marginTop: 12 },
  scoreValue: { fontSize: 36, fontFamily: 'Vazirmatn-Bold', color: '#1e293b', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Vazirmatn-Bold', color: '#1e293b', marginBottom: 12 },
  
  logCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  logHeader: { flexDirection: 'row', alignItems: 'center' },
  logIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  logTitle: { fontSize: 15, fontFamily: 'Vazirmatn-Medium', color: '#1e293b' },
  logPeriod: { fontSize: 12, fontFamily: 'Vazirmatn', color: '#64748b', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeActive: { backgroundColor: '#10b98120' },
  badgeWarning: { backgroundColor: '#f59e0b20' },
  badgeMuted: { backgroundColor: '#94a3b820' },
  badgeText: { fontSize: 11, fontFamily: 'Vazirmatn-Medium', color: '#334155' },

  appealBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
  appealBtnText: { fontSize: 13, fontFamily: 'Vazirmatn-Medium', color: '#64748b', marginRight: 4 },
  
  appealBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9' },
  appealInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top', fontFamily: 'Vazirmatn', fontSize: 13 },
  appealActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  cancelBtnText: { color: '#64748b', fontFamily: 'Vazirmatn-Medium', fontSize: 13 },
  submitBtn: { backgroundColor: '#ae0011', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  submitBtnText: { color: '#fff', fontFamily: 'Vazirmatn-Medium', fontSize: 13 },

  emptyText: { textAlign: 'center', color: '#64748b', fontFamily: 'Vazirmatn', marginTop: 20 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabBtnActive: { backgroundColor: '#fff', elevation: 1 },
  tabText: { fontFamily: 'Vazirmatn-Medium', fontSize: 14, color: '#64748b' },
  tabTextActive: { color: '#1e293b' },

  lbItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  lbRank: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#94a3b8', width: 40 },
  lbName: { flex: 1, fontFamily: 'Vazirmatn-Medium', fontSize: 15, color: '#1e293b' },
  lbPoints: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#10b981' }
})

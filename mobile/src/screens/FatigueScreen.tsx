import React, { useState } from 'react'
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { MaterialIcons } from '@expo/vector-icons'

export default function FatigueScreen({ navigation }: any) {
  const { accessToken } = useAuthStore()
  const [sleepHours, setSleepHours] = useState(7)
  const [sleepQuality, setSleepQuality] = useState<'good' | 'fair' | 'poor'>('good')
  const [fatigueLevel, setFatigueLevel] = useState(2) // 1 to 5
  const [hasHeadacheOrColds, setHasHeadacheOrColds] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/fatigue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          sleepHours,
          sleepQuality,
          fatigueLevel,
          hasHeadacheOrColds
        })
      })

      if (res.ok) {
        const json = await res.json()
        setScore(json.data?.score || 20)
        Alert.alert('ثبت موفق', 'گزارش پایش سلامت و خستگی شما با موفقیت ثبت شد.')
      } else {
        Alert.alert('خطا', 'متاسفانه مشکلی در ثبت اطلاعات پیش آمد.')
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکل در برقراری ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQualityBtn = (value: 'good' | 'fair' | 'poor', label: string, icon: string, color: string) => {
    const isSelected = sleepQuality === value
    return (
      <TouchableOpacity 
        style={[s.qualityBtn, isSelected && { borderColor: color, backgroundColor: `${color}15` }]}
        onPress={() => setSleepQuality(value)}
      >
        <MaterialIcons name={icon as any} size={24} color={isSelected ? color : '#94a3b8'} />
        <Text style={[s.qualityText, isSelected && { color }]}>{label}</Text>
      </TouchableOpacity>
    )
  }

  const toFa = (numStr: string | number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  return (
    <ScreenWrapper title="پایش خستگی و سلامت" showBack onBack={() => navigation.goBack()}>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View style={s.infoBox}>
          <MaterialIcons name="info-outline" size={20} color="#0284c7" />
          <Text style={s.infoText}>لطفاً با دقت فرم زیر را تکمیل کنید. این اطلاعات مستقیماً روی مجوز راهبری شما در شیفت امروز تاثیر دارد.</Text>
        </View>

        {score !== null && (
          <View style={[s.scoreBox, score > 60 ? s.scoreBoxDanger : s.scoreBoxSafe]}>
            <Text style={s.scoreTitle}>شاخص خستگی شما</Text>
            <Text style={[s.scoreValue, score > 60 ? s.scoreValueDanger : s.scoreValueSafe]}>{score}</Text>
            <Text style={s.scoreDesc}>
              {score > 60 ? 'خستگی شما بالاتر از حد مجاز است. لطفا به سوپروایزر مراجعه کنید.' : 'وضعیت شما نرمال است. شیفت خوبی داشته باشید.'}
            </Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.label}>۱. دیشب چند ساعت خوابیدید؟ (ساعت: {toFa(sleepHours)})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hoursScroll}>
            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hr => (
              <TouchableOpacity 
                key={hr} 
                style={[s.hourBox, sleepHours === hr && s.hourBoxActive]}
                onPress={() => setSleepHours(hr)}
              >
                <Text style={[s.hourText, sleepHours === hr && s.hourTextActive]}>{toFa(hr)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={s.card}>
          <Text style={s.label}>۲. کیفیت خواب شما چطور بود؟</Text>
          <View style={s.row}>
            {renderQualityBtn('good', 'عالی / خوب', 'sentiment-very-satisfied', '#10b981')}
            {renderQualityBtn('fair', 'متوسط', 'sentiment-neutral', '#f59e0b')}
            {renderQualityBtn('poor', 'بد / ناپیوسته', 'sentiment-dissatisfied', '#ef4444')}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.label}>۳. در حال حاضر چقدر احساس خستگی می‌کنید؟ (۱ تا ۵)</Text>
          <View style={s.fatigueRow}>
            {[1, 2, 3, 4, 5].map(lvl => (
              <TouchableOpacity 
                key={lvl} 
                style={[s.fatigueCircle, fatigueLevel === lvl && s.fatigueCircleActive]}
                onPress={() => setFatigueLevel(lvl)}
              >
                <Text style={[s.fatigueCircleText, fatigueLevel === lvl && s.fatigueCircleTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.sliderLabels}>
            <Text style={s.sliderLabelSmall}>کاملا سرحال (۱)</Text>
            <Text style={s.sliderLabelSmall}>بسیار خسته (۵)</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.label}>۴. آیا علائم سرماخوردگی، بدن‌درد یا سردرد دارید؟</Text>
          <View style={s.row}>
            <TouchableOpacity 
              style={[s.toggleBtn, hasHeadacheOrColds === false && s.toggleBtnActive]}
              onPress={() => setHasHeadacheOrColds(false)}
            >
              <Text style={[s.toggleBtnText, hasHeadacheOrColds === false && s.toggleBtnTextActive]}>خیر، کاملا سالمم</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.toggleBtn, hasHeadacheOrColds === true && s.toggleBtnDanger]}
              onPress={() => setHasHeadacheOrColds(true)}
            >
              <Text style={[s.toggleBtnText, hasHeadacheOrColds === true && s.toggleBtnTextActive]}>بله، علائم دارم</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>ثبت فرم ارزیابی سلامت</Text>}
        </TouchableOpacity>

      </ScrollView>
    </ScreenWrapper>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  infoBox: { flexDirection: 'row', backgroundColor: '#f0f9ff', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 12, fontFamily: 'Vazirmatn', fontSize: 13, color: '#0369a1', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  label: { fontFamily: 'Vazirmatn-Medium', fontSize: 14, color: '#1e293b', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  
  qualityBtn: { flex: 1, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
  qualityText: { fontFamily: 'Vazirmatn-Medium', fontSize: 12, color: '#64748b', marginTop: 8 },

  hoursScroll: { paddingVertical: 8, gap: 10 },
  hourBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  hourBoxActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  hourText: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#475569' },
  hourTextActive: { color: '#fff' },

  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabelSmall: { fontFamily: 'Vazirmatn', fontSize: 11, color: '#94a3b8' },

  fatigueRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 10 },
  fatigueCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  fatigueCircleActive: { backgroundColor: '#f59e0b' },
  fatigueCircleText: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#64748b' },
  fatigueCircleTextActive: { color: '#fff' },

  toggleBtn: { flex: 1, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  toggleBtnDanger: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  toggleBtnText: { fontFamily: 'Vazirmatn-Medium', fontSize: 13, color: '#64748b' },
  toggleBtnTextActive: { color: '#fff' },

  submitBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontFamily: 'Vazirmatn-Bold', fontSize: 15 },

  scoreBox: { padding: 20, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  scoreBoxSafe: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  scoreBoxDanger: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  scoreTitle: { fontFamily: 'Vazirmatn-Medium', fontSize: 14, color: '#475569' },
  scoreValue: { fontFamily: 'Vazirmatn-Black', fontSize: 48, marginVertical: 4 },
  scoreValueSafe: { color: '#059669' },
  scoreValueDanger: { color: '#dc2626' },
  scoreDesc: { fontFamily: 'Vazirmatn', fontSize: 13, color: '#475569', textAlign: 'center' }
})

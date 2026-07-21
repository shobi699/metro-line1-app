import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../../shared/ThemeProvider'
import { API_URL } from '../../shared/config'
import { ArrowRight, PlayCircle, FileText, CheckCircle } from 'lucide-react-native'
import { useAuthStore } from '../../stores/auth'

export function LessonPlayerView({ 
  course, 
  lessonId, 
  onBack 
}: { 
  course: any, 
  lessonId: string, 
  onBack: () => void 
}) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [isCompleted, setIsCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user || !lessonId) return
    AsyncStorage.getItem(`completed_lessons_${user.id}`).then((stored) => {
      if (stored) {
        const list = JSON.parse(stored) as string[]
        setIsCompleted(list.includes(lessonId))
      }
    })
  }, [user, lessonId])

  const markAsCompleted = async () => {
    if (!user || !lessonId || !course || !accessToken) return
    setSubmitting(true)
    try {
      const stored = await AsyncStorage.getItem(`completed_lessons_${user.id}`)
      const list = (stored ? JSON.parse(stored) : []) as string[]
      if (!list.includes(lessonId)) {
        list.push(lessonId)
        await AsyncStorage.setItem(`completed_lessons_${user.id}`, JSON.stringify(list))
      }
      setIsCompleted(true)

      const allLessons: any[] = []
      course.chapters?.forEach((chap: any) => {
        chap.lessons?.forEach((les: any) => {
          allLessons.push(les)
        })
      })
      const completedInThisCourse = allLessons.filter(l => list.includes(l.id)).length
      const progressPct = allLessons.length > 0 
        ? Math.round((completedInThisCourse / allLessons.length) * 100) 
        : 0

      const res = await fetch(`${API_URL}/learning/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          progressPct,
          completed: progressPct === 100 ? true : undefined,
        }),
      })
      if (res.ok) {
        Alert.alert('موفقیت', 'درس با موفقیت تکمیل شد و پیشرفت شما ثبت گردید.')
        onBack()
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error?.message || 'خطا در ثبت پیشرفت درس در سرور')
      }
    } catch (e) {
      console.error(e)
      Alert.alert('خطا', 'خطا در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  let selectedLesson: any = null
  for (const chapter of course.chapters || []) {
    const found = chapter.lessons?.find((l: any) => l.id === lessonId)
    if (found) {
      selectedLesson = found
      break
    }
  }

  if (!selectedLesson) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontFamily: 'Vazirmatn', color: theme.colors.onBackground }}>درس یافت نشد.</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.primary, fontFamily: 'Vazirmatn-Bold' }}>بازگشت</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const getAbsoluteUrl = (url: string) => {
    if (!url) return ''
    const trimmed = url.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${API_URL}${path}`
  }

  const parseShortcodes = (text: string) => {
    const parts = []
    const regex = /\[(video|pdf|word)\](.*?)\[\/\1\]/gi
    let lastIndex = 0
    let match
    
    while ((match = regex.exec(text)) !== null) {
      const index = match.index
      const type = match[1].toLowerCase()
      const url = match[2].trim()
      
      // Add preceding text
      if (index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, index) })
      }
      
      parts.push({ type, url })
      lastIndex = regex.lastIndex
    }
    
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) })
    }
    
    return parts
  }

  const renderBlock = (block: any, index: number) => {
    if (!block) return null

    switch (block.type) {
      case 'heading': {
        const level = block.headingLevel || 'h2'
        const fontSize = level === 'h1' ? 22 : level === 'h2' ? 18 : 16
        return (
          <Text key={index} style={[styles.heading, { fontSize, color: theme.colors.onBackground }]}>
            {block.headingText}
          </Text>
        )
      }
      case 'paragraph': {
        return (
          <Text key={index} style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            {block.paragraphText}
          </Text>
        )
      }
      case 'table': {
        const rows = block.tableRows || 3
        const cols = block.tableCols || 3
        const data = block.tableData || []
        return (
          <View key={index} style={[styles.tableContainer, { borderColor: theme.colors.border }]}>
            {/* Header Row */}
            <View style={[styles.tableRow, { backgroundColor: theme.colors.surface }]}>
              {Array.from({ length: cols }).map((_, c) => (
                <View key={c} style={[styles.tableCell, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.tableCellText, { fontFamily: 'Vazirmatn-Bold', color: theme.colors.onSurface }]}>
                    {data[0]?.[c] || ''}
                  </Text>
                </View>
              ))}
            </View>
            {/* Data Rows */}
            {Array.from({ length: rows - 1 }).map((_, r) => {
              const rowIndex = r + 1
              return (
                <View key={rowIndex} style={styles.tableRow}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <View key={c} style={[styles.tableCell, { borderColor: theme.colors.border }]}>
                      <Text style={[styles.tableCellText, { color: theme.colors.onBackground }]}>
                        {data[rowIndex]?.[c] || ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        )
      }
      case 'alert': {
        const alertColors = {
          warning: { bg: '#eab30815', border: '#eab308', text: '#eab308', icon: '⚠️' },
          danger: { bg: '#ef444415', border: '#ef4444', text: '#ef4444', icon: '🚨' },
          success: { bg: '#10b98115', border: '#10b981', text: '#10b981', icon: '✅' },
          info: { bg: '#3b82f615', border: '#3b82f6', text: '#3b82f6', icon: 'ℹ️' }
        }
        const alertStyle = alertColors[block.alertType as 'warning' | 'danger' | 'success' | 'info'] || alertColors.warning
        return (
          <View key={index} style={[styles.alertContainer, { backgroundColor: alertStyle.bg, borderRightColor: alertStyle.border }]}>
            <Text style={[styles.alertTitle, { color: alertStyle.text }]}>
              {alertStyle.icon} {block.alertTitle}
            </Text>
            <Text style={[styles.alertText, { color: theme.colors.onBackground }]}>
              {block.alertText}
            </Text>
          </View>
        )
      }
      case 'chart': {
        const pts = block.chartPoints || []
        const maxVal = Math.max(...pts.map((p: any) => Number(p.value) || 1), 1)
        return (
          <View key={index} style={[styles.chartContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>{block.chartTitle}</Text>
            {block.chartType === 'vertical' ? (
              <View style={styles.verticalChart}>
                {pts.map((p: any, idx: number) => {
                  const val = Number(p.value) || 0
                  const pct = (val / maxVal) * 100
                  return (
                    <View key={idx} style={styles.verticalBarContainer}>
                      <Text style={[styles.chartValText, { color: theme.colors.onBackground }]}>{val}</Text>
                      <View style={styles.verticalBarOutline}>
                        <View style={[styles.verticalBarFill, { height: `${pct}%`, backgroundColor: theme.colors.primary }]} />
                      </View>
                      <Text style={[styles.chartLabelText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{p.label}</Text>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.horizontalChart}>
                {pts.map((p: any, idx: number) => {
                  const val = Number(p.value) || 0
                  const pct = (val / maxVal) * 100
                  return (
                    <View key={idx} style={styles.horizontalRow}>
                      <Text style={[styles.chartLabelText, { width: 60, color: theme.colors.textSecondary }]} numberOfLines={1}>{p.label}</Text>
                      <View style={styles.horizontalBarOutline}>
                        <View style={[styles.horizontalBarFill, { width: `${pct}%`, backgroundColor: theme.colors.primary }]} />
                      </View>
                      <Text style={[styles.chartValText, { width: 30, color: theme.colors.onBackground }]}>{val}</Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        )
      }
      case 'diagram': {
        const steps = block.diagramSteps || []
        return (
          <View key={index} style={[styles.chartContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface, marginBottom: 16 }]}>دیاگرام توالی مراحل</Text>
            <View style={styles.stepperContainer}>
              {steps.map((step: string, idx: number) => {
                const isLast = idx === steps.length - 1
                return (
                  <View key={idx} style={styles.stepperRow}>
                    <View style={styles.stepperLeft}>
                      <View style={[styles.stepperNode, { backgroundColor: isLast ? theme.colors.primary : '#1e293b', borderColor: theme.colors.primary }]}>
                        <Text style={styles.stepperNodeText}>{idx + 1}</Text>
                      </View>
                      {!isLast && <View style={[styles.stepperLine, { backgroundColor: theme.colors.primary }]} />}
                    </View>
                    <View style={styles.stepperRight}>
                      <Text style={[styles.stepperText, { color: theme.colors.onSurface, fontWeight: isLast ? 'bold' : 'normal' }]}>{step}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>
        )
      }
      case 'media': {
        const url = block.mediaUrl || ''
        if (!url) return null
        const finalUrl = getAbsoluteUrl(url)
        const filename = url.split('/').pop() || 'file'
        
        if (block.mediaType === 'video') {
          return (
            <View key={index} style={styles.videoContainer}>
              <PlayCircle size={48} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onBackground, marginTop: 8, fontFamily: 'Vazirmatn', textAlign: 'center' }}>{filename}</Text>
              <TouchableOpacity 
                style={[styles.downloadBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => Linking.openURL(finalUrl)}
              >
                <Text style={styles.downloadBtnText}>پخش / دانلود ویدئو</Text>
              </TouchableOpacity>
            </View>
          )
        }
        
        const isWord = block.mediaType === 'word'
        const fileIconColor = isWord ? '#3b82f6' : '#ef4444'
        const fileLabel = isWord ? 'سند ضمیمه Word (آیین‌نامه)' : 'فایل ضمیمه PDF'
        
        return (
          <View key={index} style={[styles.fileCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.fileRight}>
              <FileText size={32} color={fileIconColor} />
              <View style={styles.fileInfo}>
                <Text style={[styles.fileLabelText, { color: theme.colors.onSurface }]}>{fileLabel}</Text>
                <Text style={[styles.fileNameText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{filename}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.downloadActionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => Linking.openURL(finalUrl)}
            >
              <Text style={styles.downloadBtnText}>دانلود</Text>
            </TouchableOpacity>
          </View>
        )
      }
      case 'image': {
        const url = block.imageUrl || ''
        if (!url) return null
        const finalUrl = getAbsoluteUrl(url)
        return (
          <View key={index} style={styles.imageBlockContainer}>
            <Image 
              source={{ uri: finalUrl }} 
              style={styles.imageBlock} 
              resizeMode="contain"
            />
            {block.imageCaption && (
              <Text style={[styles.imageCaption, { color: theme.colors.textSecondary }]}>{block.imageCaption}</Text>
            )}
          </View>
        )
      }
      case 'html': {
        const stripped = (block.htmlContent || '').replace(/<[^>]*>/g, '')
        return (
          <Text key={index} style={[styles.paragraph, { color: theme.colors.onBackground }]}>
            {stripped}
          </Text>
        )
      }
      default:
        return null
    }
  }

  const renderContentText = (text: string) => {
    if (!text) return <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>محتوایی یافت نشد.</Text>

    const trimmed = text.trim()
    if (trimmed.startsWith('[')) {
      try {
        const blocks = JSON.parse(trimmed)
        if (Array.isArray(blocks)) {
          return (
            <View style={styles.blocksWrapper}>
              {blocks.map((b, i) => renderBlock(b, i))}
            </View>
          )
        }
      } catch (e) {
        // fallback to normal text parsing
      }
    }

    // Parse text containing [video], [pdf], [word] shortcodes
    const parts = parseShortcodes(trimmed)
    return (
      <View style={styles.blocksWrapper}>
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <Text key={i} style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
                {part.content}
              </Text>
            )
          }
          if (part.type === 'video') {
            const finalUrl = getAbsoluteUrl(part.url!)
            const filename = part.url!.split('/').pop() || 'video.mp4'
            return (
              <View key={i} style={styles.videoContainer}>
                <PlayCircle size={48} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.onBackground, marginTop: 8, fontFamily: 'Vazirmatn', textAlign: 'center' }}>{filename}</Text>
                <TouchableOpacity 
                  style={[styles.downloadBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => Linking.openURL(finalUrl)}
                >
                  <Text style={styles.downloadBtnText}>پخش / دانلود ویدئو</Text>
                </TouchableOpacity>
              </View>
            )
          }
          
          const isWord = part.type === 'word'
          const fileIconColor = isWord ? '#3b82f6' : '#ef4444'
          const fileLabel = isWord ? 'سند ضمیمه Word (آیین‌نامه)' : 'فایل ضمیمه PDF'
          const finalUrl = getAbsoluteUrl(part.url!)
          const filename = part.url!.split('/').pop() || 'file'

          return (
            <View key={i} style={[styles.fileCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.fileRight}>
                <FileText size={32} color={fileIconColor} />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileLabelText, { color: theme.colors.onSurface }]}>{fileLabel}</Text>
                  <Text style={[styles.fileNameText, { color: theme.colors.textSecondary }]} numberOfLines={1}>{filename}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.downloadActionBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => Linking.openURL(finalUrl)}
              >
                <Text style={styles.downloadBtnText}>دانلود</Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </View>
    )
  }

  // Parse details
  let videoUrl = ''
  let textContent = ''

  if (selectedLesson.contentRef) {
    try {
      const parsed = JSON.parse(selectedLesson.contentRef)
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.videoUrl) videoUrl = parsed.videoUrl
        if (parsed.textContent) textContent = parsed.textContent
      } else {
        textContent = selectedLesson.contentRef
      }
    } catch {
      textContent = selectedLesson.contentRef
    }
  }

  const isVideoKind = selectedLesson.kind === 'video'

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowRight color={theme.colors.onBackground} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onBackground }]} numberOfLines={1}>
          {selectedLesson.title}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {isVideoKind && (videoUrl || selectedLesson.contentRef) && (
          <View style={styles.videoPlaceholder}>
            <PlayCircle size={48} color="#fff" />
            <Text style={{ color: '#fff', marginTop: 8, fontFamily: 'Vazirmatn' }}>آماده پخش (کلیک برای اجرا)</Text>
            <TouchableOpacity 
              style={[styles.downloadBtn, { backgroundColor: theme.colors.primary, marginTop: 12, width: '60%' }]}
              onPress={() => Linking.openURL(getAbsoluteUrl(videoUrl || selectedLesson.contentRef))}
            >
              <Text style={styles.downloadBtnText}>پخش ویدئو</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>{selectedLesson.title}</Text>
          {renderContentText(textContent)}
        </View>
        <View style={styles.completionContainer}>
          {isCompleted ? (
            <View style={styles.completedBadge}>
              <CheckCircle size={18} color="#10b981" />
              <Text style={styles.completedBadgeText}>این درس را کامل مطالعه کردم ✓</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.completeBtn, { backgroundColor: theme.colors.primary }]}
              onPress={markAsCompleted}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.completeBtnText}>مطالعه کردم و علامت‌گذاری به عنوان تکمیل شده</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Vazirmatn-Bold', textAlign: 'right' },
  content: { flex: 1 },
  videoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { padding: 16 },
  title: { fontSize: 20, fontFamily: 'Vazirmatn-Bold', marginBottom: 20, textAlign: 'right' },
  blocksWrapper: { gap: 12 },
  heading: { fontFamily: 'Vazirmatn-Bold', marginTop: 16, marginBottom: 8, textAlign: 'right' },
  paragraph: { fontSize: 14, fontFamily: 'Vazirmatn', textAlign: 'right', lineHeight: 26, marginVertical: 4 },
  
  // Table
  tableContainer: { borderWidth: 1, borderRadius: 8, marginVertical: 12, overflow: 'hidden' },
  tableRow: { flexDirection: 'row-reverse', minHeight: 36 },
  tableCell: { flex: 1, borderWidth: 0.5, padding: 8, justifyContent: 'center', alignItems: 'center' },
  tableCellText: { fontSize: 11, fontFamily: 'Vazirmatn', textAlign: 'center' },

  // Alert Box
  alertContainer: { padding: 12, borderRadius: 8, borderRightWidth: 4, marginVertical: 8 },
  alertTitle: { fontSize: 13, fontFamily: 'Vazirmatn-Bold', textAlign: 'right', marginBottom: 4 },
  alertText: { fontSize: 12, fontFamily: 'Vazirmatn', textAlign: 'right', lineHeight: 20 },

  // Chart
  chartContainer: { marginVertical: 12, padding: 16, borderRadius: 8, borderWidth: 1 },
  chartTitle: { fontSize: 13, fontFamily: 'Vazirmatn-Bold', textAlign: 'center', marginBottom: 16 },
  verticalChart: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'flex-end', height: 160, paddingBottom: 20 },
  verticalBarContainer: { alignItems: 'center', flex: 1 },
  verticalBarOutline: { width: 12, height: 100, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden', marginVertical: 4, justifyContent: 'flex-end' },
  verticalBarFill: { width: '100%', borderRadius: 6 },
  chartLabelText: { fontSize: 10, fontFamily: 'Vazirmatn', textAlign: 'center', marginTop: 4 },
  chartValText: { fontSize: 10, fontFamily: 'Vazirmatn-Bold', textAlign: 'center' },
  horizontalChart: { gap: 12 },
  horizontalRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  horizontalBarOutline: { flex: 1, height: 12, backgroundColor: '#1e293b', borderRadius: 6, overflow: 'hidden' },
  horizontalBarFill: { height: '100%', borderRadius: 6 },

  // Stepper / Timeline Diagram
  stepperContainer: { paddingVertical: 8 },
  stepperRow: { flexDirection: 'row-reverse', minHeight: 60 },
  stepperLeft: { width: 40, alignItems: 'center' },
  stepperRight: { flex: 1, paddingLeft: 12, alignItems: 'flex-end' },
  stepperNode: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  stepperNodeText: { color: 'white', fontSize: 11, fontFamily: 'Vazirmatn-Bold' },
  stepperLine: { width: 2, flex: 1, position: 'absolute', top: 24, bottom: 0 },
  stepperText: { fontSize: 13, fontFamily: 'Vazirmatn', textAlign: 'right' },

  // Media
  videoContainer: { width: '100%', padding: 24, backgroundColor: '#00000030', borderWidth: 1, borderColor: '#38bdf820', borderRadius: 8, alignItems: 'center', marginVertical: 12 },
  downloadBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  downloadBtnText: { color: 'white', fontFamily: 'Vazirmatn-Bold', fontSize: 12 },
  fileCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, marginVertical: 8 },
  fileRight: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 },
  fileInfo: { alignItems: 'flex-end', flex: 1, paddingRight: 8 },
  fileLabelText: { fontSize: 13, fontFamily: 'Vazirmatn-Bold' },
  fileNameText: { fontSize: 11, fontFamily: 'Vazirmatn', marginTop: 2 },
  downloadActionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },

  // Image
  imageBlockContainer: { width: '100%', alignItems: 'center', marginVertical: 12 },
  imageBlock: { width: '100%', height: 200, borderRadius: 8 },
  imageCaption: { fontSize: 11, fontFamily: 'Vazirmatn', marginTop: 6, textAlign: 'center' },
  completionContainer: {
    paddingHorizontal: 16,
    marginVertical: 24,
    alignItems: 'stretch',
  },
  completedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b98115',
    borderColor: '#10b98140',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  completedBadgeText: {
    color: '#10b981',
    fontSize: 13,
    fontFamily: 'Vazirmatn-Bold',
  },
  completeBtn: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Vazirmatn-Bold',
  },
})

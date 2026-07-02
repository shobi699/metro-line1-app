import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import {
  GraduationCap,
  Award,
  Trophy,
  Play,
  Search,
  Clock,
  Lock,
  CheckCircle,
  Download,
  Wifi,
  AlertTriangle,
  RotateCcw,
  Printer,
  Video,
  FileText,
  Sliders,
  ChevronRight,
  BookOpen
} from 'lucide-react-native'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { API_URL } from '../shared/config'
import { toFa } from '../shared/jalali'

interface VideoItem {
  id: string
  title: string
  slug: string
  excerpt: string
  duration: string
  durationSeconds: number
  category: string
  coverUrl: string
  mediaUrl: string
  mandatory: boolean
  points: number
  isCompleted: boolean
  watchedPercentage: number
}

interface LearningPath {
  id: string
  title: string
  description: string
  coursesCount: number
  completedPercentage: number
  isUnlocked: boolean
  category: string
}

interface ExamRecord {
  id: string
  title: string
  slug: string
  totalQuestions: number
  correctAnswers: number
  score: number
  status: 'passed' | 'failed'
  date: string
  retryAvailableAt?: string
}

interface PendingExam {
  id: string
  title: string
  slug: string
  category: string
  questionCount: number
  mandatory: boolean
  dueDate: string
  timeLimitMinutes: number
}

interface Certificate {
  id: string
  userName: string
  courseTitle: string
  score: number
  date: string
  expiryDate: string
  isExpired: boolean
}

const SAMPLE_QUESTIONS = [
  {
    q: 'در زمان افت فشار هوای فشرده به زیر ۵.۵ بار، راهبر در بلاک ورودی ایستگاه تجریش چه اقدامی باید انجام دهد؟',
    options: [
      'بلافاصله ترمز اضطراری زده و قطار را متوقف کند.',
      'ایزولاسیون مکانیکی ترمز (بایکوت درب‌ها) را انجام دهد.',
      'دکمه تخلیه اضطراری را زده و به OCC گزارش دهد.',
      'تست ایزولاسیون شیر پارکینگ را اجرا کند.'
    ],
    correct: 0,
  },
  {
    q: 'در پروتکل تخلیه اضطراری مسافرین در تونل مترو، کدام سمت قطار جهت هدایت ترجیح داده می‌شود؟',
    options: [
      'سمت خط گرم (ریل سوم)',
      'سمت مخالف ریل سوم برق‌دار (سمت فرار ایمن)',
      'هر دو سمت تفاوتی ندارد.',
      'تخلیه فقط از کابین عقب قطار انجام می‌شود.'
    ],
    correct: 1
  },
  {
    q: 'حداکثر سرعت مجاز در عبور از روی سوزن‌های شانت پایانه شهر ری چقدر است؟',
    options: [
      '۱۵ کیلومتر بر ساعت',
      '۳۰ کیلومتر بر ساعت',
      '۵ کیلومتر بر ساعت',
      '۴۵ کیلومتر بر ساعت'
    ],
    correct: 0
  }
]

export function LearningScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const styles = useMemo(() => getStyles(theme), [theme])

  const [activeTab, setActiveTab] = useState<'paths' | 'videos' | 'exams' | 'certs'>('paths')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // State Lists
  const [completedExams, setCompletedExams] = useState<ExamRecord[]>([
    {
      id: 'exam-failed-demo',
      title: 'آزمون شبیه‌ساز بایکوت قطار سری ۳۰۰',
      slug: 'failed-exam-slug',
      totalQuestions: 10,
      correctAnswers: 5,
      score: 50,
      status: 'failed',
      date: '۱۴۰۵/۰۴/۰۹'
    }
  ])
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: 'cert-1',
      userName: user?.name || 'راهبر قطار',
      courseTitle: 'دوره ایمنی پایه و خودمراقبتی',
      score: 100,
      date: '۱۴۰۵/۰۲/۱۵',
      expiryDate: '۱۴۰۶/۰۲/۱۵',
      isExpired: false
    }
  ])

  // Mocked Learning Paths
  const learningPaths: LearningPath[] = [
    {
      id: 'path-1',
      title: 'دوره ایمنی پایه و خودمراقبتی',
      description: 'ضوابط ایمنی تردد در حریم ریل، ولتاژ ریل سوم و پروتکل‌های خودمراقبتی.',
      coursesCount: 4,
      completedPercentage: 100,
      isUnlocked: true,
      category: 'ایمنی'
    },
    {
      id: 'path-2',
      title: 'دوره مقررات مقررات عمومی سیر و حرکت خط ۱',
      description: 'سیگنال‌های ثابت، بلاک‌های حفاظتی، سرعت‌های مجاز و ضوابط شانت.',
      coursesCount: 6,
      completedPercentage: 33,
      isUnlocked: true,
      category: 'مقررات'
    },
    {
      id: 'path-3',
      title: 'دوره عیب‌یابی فوری و بایکوت قطار سری ۱۰۰',
      description: 'مهارت‌های تخصصی ایزوله کردن نقص ترمزها و عیب‌یابی درب واگن‌ها.',
      coursesCount: 5,
      completedPercentage: 0,
      isUnlocked: true,
      category: 'فنی'
    },
    {
      id: 'path-4',
      title: 'دوره مدیریت بحران و سناریوهای حادثه',
      description: 'پروتکل‌های خروج اضطراری، حریق در تونل و قطع برق سراسری OCC.',
      coursesCount: 8,
      completedPercentage: 0,
      isUnlocked: false,
      category: 'بحران'
    }
  ]

  // Mocked Video Gallery
  const videosList: VideoItem[] = [
    {
      id: 'vid-1',
      title: 'آموزش تخلیه اضطراری در تونل خط ۱',
      slug: 'tunnel-emergency-evac',
      excerpt: 'آموزش گام‌به‌گام نحوه برقراری ارتباط با OCC و بازکردن درب قطارهای سری ۱۰۰ جهت تخلیه.',
      duration: '۰۷:۴۵',
      durationSeconds: 465,
      category: 'بحران',
      coverUrl: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=600&q=80',
      mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      mandatory: true,
      points: 20,
      isCompleted: true,
      watchedPercentage: 100
    },
    {
      id: 'vid-2',
      title: 'بایکوت دستی ترمز مکانیکی واگن‌ها',
      slug: 'mechanical-brake-bypass',
      excerpt: 'مجموعه اقدامات عملی راهبر قطار در زیر کابین جهت خلاص کردن قفل ترمز کششی.',
      duration: '۱۲:۳۰',
      durationSeconds: 750,
      category: 'فنی',
      coverUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      mandatory: true,
      points: 30,
      isCompleted: false,
      watchedPercentage: 45
    },
    {
      id: 'vid-3',
      title: 'پروتکل کنترل سرعت سوزن شانت دپو',
      slug: 'depot-shunt-speed',
      excerpt: 'بررسی ضوابط ورود به سوزن شانت پایانه جنوب (کهریزک) و هشدارهای سیگنالی مرتبط.',
      duration: '۰۵:۱۵',
      durationSeconds: 315,
      category: 'مقررات',
      coverUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
      mediaUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      mandatory: false,
      points: 15,
      isCompleted: false,
      watchedPercentage: 0
    }
  ]

  // Data Consumption settings
  const [videoQuality, setVideoQuality] = useState<'auto' | 'high' | 'low'>('auto')
  const [wifiOnly, setWifiOnly] = useState(true)

  // Exam Simulator states
  const [activeExam, setActiveExam] = useState<PendingExam | null>(null)
  const [examStarted, setExamStarted] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [examTimer, setExamTimer] = useState(0)
  const [examFinished, setExamFinished] = useState(false)
  const [examResultScore, setExamResultScore] = useState(0)

  // Video Player Modal States
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [playingVideo, setPlayingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  // Certificate Modal State
  const [activeCert, setActiveCert] = useState<Certificate | null>(null)

  // Load pending exams from posts API
  const loadExams = async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const posts = (json.data ?? []) as any[]
        const quizPosts = posts.filter(p => p.hasQuiz === true)
        
        const pending = quizPosts
          .filter(p => !p.isCompleted)
          .map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            category: p.category || 'آموزش تخصصی',
            questionCount: SAMPLE_QUESTIONS.length,
            mandatory: p.mandatory ?? false,
            dueDate: '۱۴۰۵/۰۵/۱۵',
            timeLimitMinutes: 10
          }))
        
        setPendingExams(pending)
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExams()
  }, [accessToken])

  // Timer interval for Exam
  useEffect(() => {
    let interval: any
    if (examStarted && examTimer > 0) {
      interval = setInterval(() => {
        setExamTimer(prev => {
          if (prev <= 1) {
            handleFinishExam(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [examStarted, examTimer])

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${secs < 10 ? '۰' : ''}${toFa(secs)}:${mins < 10 ? '۰' : ''}${toFa(mins)}`
  }

  const handleStartExam = (exam: PendingExam) => {
    setActiveExam(exam)
    setSelectedAnswers({})
    setCurrentQuestionIdx(0)
    setExamTimer(exam.timeLimitMinutes * 60)
    setExamStarted(true)
    setExamFinished(false)
  }

  const handleFinishExam = (isTimeout = false) => {
    setExamStarted(false)
    setExamFinished(true)

    let correctCount = 0
    SAMPLE_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        correctCount++
      }
    })

    const scorePct = Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100)
    setExamResultScore(scorePct)

    if (scorePct >= 70 && activeExam) {
      // Move to completed
      setCompletedExams(prev => [
        {
          id: activeExam.id,
          title: activeExam.title,
          slug: activeExam.slug,
          totalQuestions: SAMPLE_QUESTIONS.length,
          correctAnswers: correctCount,
          score: scorePct,
          status: 'passed',
          date: new Date().toLocaleDateString('fa-IR')
        },
        ...prev
      ])
      setPendingExams(prev => prev.filter(p => p.id !== activeExam.id))
      // Add certificate
      setCertificates(prev => [
        {
          id: 'cert-' + Date.now().toString(),
          userName: user?.name || 'راهبر قطار',
          courseTitle: activeExam.title,
          score: scorePct,
          date: new Date().toLocaleDateString('fa-IR'),
          expiryDate: '۱۴۰۶/۰۲/۱۵',
          isExpired: false
        },
        ...prev
      ])
    }
  }

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videosList
    return videosList.filter(v => v.title.includes(searchQuery) || v.excerpt.includes(searchQuery))
  }, [searchQuery])

  return (
    <ScreenWrapper title="سامانه آموزش پرسنل" navigation={navigation}>
      <View style={styles.container}>
        
        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'paths' && styles.tabActive]}
            onPress={() => setActiveTab('paths')}
          >
            <BookOpen size={16} color={activeTab === 'paths' ? '#ffffff' : theme.colors.secondary} />
            <Text style={[styles.tabText, activeTab === 'paths' && styles.tabTextActive]}>مسیرهای آموزشی</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'videos' && styles.tabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Video size={16} color={activeTab === 'videos' ? '#ffffff' : theme.colors.secondary} />
            <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>ویدیوها</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'exams' && styles.tabActive]}
            onPress={() => setActiveTab('exams')}
          >
            <GraduationCap size={16} color={activeTab === 'exams' ? '#ffffff' : theme.colors.secondary} />
            <Text style={[styles.tabText, activeTab === 'exams' && styles.tabTextActive]}>آزمون‌ها</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'certs' && styles.tabActive]}
            onPress={() => setActiveTab('certs')}
          >
            <Award size={16} color={activeTab === 'certs' ? '#ffffff' : theme.colors.secondary} />
            <Text style={[styles.tabText, activeTab === 'certs' && styles.tabTextActive]}>گواهی‌نامه‌ها</Text>
          </TouchableOpacity>
        </View>

        {/* Tab contents */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* TAB 1: LEARNING PATHS */}
          {activeTab === 'paths' && (
            <View style={styles.listContainer}>
              <View style={styles.headerInfoCard}>
                <Trophy size={20} color={theme.colors.warning} />
                <Text style={styles.headerInfoText}>
                  امتیاز دوره یادگیری شما: {toFa(180)} امتیاز | رتبه در خط: {toFa(8)}
                </Text>
              </View>

              {learningPaths.map((path) => (
                <View key={path.id} style={[styles.pathCard, !path.isUnlocked && styles.pathCardLocked]}>
                  <View style={styles.pathHeader}>
                    <View style={styles.pathTitleCol}>
                      <Text style={styles.pathTitle}>{path.title}</Text>
                      <Text style={styles.pathCategory}>دسته: {path.category} | {toFa(path.coursesCount)} محتوای آموزشی</Text>
                    </View>
                    {!path.isUnlocked && <Lock size={16} color={theme.colors.secondary} />}
                  </View>
                  <Text style={styles.pathDesc}>{path.description}</Text>
                  
                  <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>پیشرفت دوره:</Text>
                      <Text style={styles.progressValue}>%{toFa(path.completedPercentage)}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${path.completedPercentage}%`, backgroundColor: path.completedPercentage === 100 ? theme.colors.success : theme.colors.primary }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: VIDEOS */}
          {activeTab === 'videos' && (
            <View style={styles.listContainer}>
              <View style={styles.searchBox}>
                <Search size={16} color={theme.colors.secondary} style={{ marginLeft: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="جستجوی ویدیو یا موضوع..."
                  placeholderTextColor={theme.colors.secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  textAlign="right"
                />
              </View>

              {filteredVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={styles.videoCard}
                  activeOpacity={0.8}
                  onPress={() => setSelectedVideo(video)}
                >
                  <View style={styles.videoThumbnailContainer}>
                    <Image source={{ uri: video.coverUrl }} style={styles.videoThumbnail} />
                    <View style={styles.playOverlay}>
                      <Play size={20} color="#ffffff" fill="#ffffff" />
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>{toFa(video.duration)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.videoInfo}>
                    <View style={styles.videoTitleRow}>
                      <Text style={styles.videoTitle}>{video.title}</Text>
                      {video.mandatory && <Text style={styles.mandatoryBadge}>الزامی</Text>}
                    </View>
                    <Text style={styles.videoExcerpt} numberOfLines={2}>{video.excerpt}</Text>
                    
                    <View style={styles.videoFooter}>
                      <Text style={styles.videoMeta}>+{toFa(video.points)} امتیاز علمی</Text>
                      {video.isCompleted ? (
                        <View style={styles.statusCompleted}>
                          <CheckCircle size={12} color={theme.colors.success} style={{ marginLeft: 4 }} />
                          <Text style={styles.statusCompletedText}>کامل شده</Text>
                        </View>
                      ) : (
                        <Text style={styles.videoProgressPercent}>%{toFa(video.watchedPercentage)} مشاهده</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* TAB 3: EXAMS */}
          {activeTab === 'exams' && (
            <View style={styles.listContainer}>
              {/* Mandatory/Pending Exams */}
              <Text style={styles.sectionTitle}>آزمون‌های در دست اقدام</Text>
              
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : pendingExams.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CheckCircle size={32} color={theme.colors.success} />
                  <Text style={styles.emptyText}>آزمون معلقی ندارید! تمامی آزمون‌ها را با موفقیت گذرانده‌اید.</Text>
                </View>
              ) : (
                pendingExams.map((exam) => (
                  <View key={exam.id} style={styles.examCard}>
                    <View style={styles.examHeader}>
                      <Text style={styles.examTitle}>{exam.title}</Text>
                      {exam.mandatory && <Text style={styles.mandatoryBadge}>الزامی</Text>}
                    </View>
                    <Text style={styles.examMeta}>
                      مدت آزمون: {toFa(exam.timeLimitMinutes)} دقیقه | تعداد سوالات: {toFa(exam.questionCount)} | مهلت: {exam.dueDate}
                    </Text>
                    <TouchableOpacity
                      style={styles.examStartButton}
                      activeOpacity={0.7}
                      onPress={() => handleStartExam(exam)}
                    >
                      <Play size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                      <Text style={styles.examStartText}>شروع آزمون آنلاین</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {/* Past Results */}
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>سوابق و نتایج آزمون‌ها</Text>
              {completedExams.map((rec) => (
                <View key={rec.id} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>{rec.title}</Text>
                    <View style={[styles.resultBadge, rec.status === 'passed' ? styles.badgePassed : styles.badgeFailed]}>
                      <Text style={rec.status === 'passed' ? styles.badgeTextPassed : styles.badgeTextFailed}>
                        {rec.status === 'passed' ? 'قبول شده' : 'مردود'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultFooter}>
                    <Text style={styles.resultMeta}>نمره: %{toFa(rec.score)} ({toFa(rec.correctAnswers)} از {toFa(rec.totalQuestions)} صحیح)</Text>
                    <Text style={styles.resultDate}>تاریخ: {rec.date}</Text>
                  </View>
                  {rec.status === 'failed' && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      activeOpacity={0.7}
                      onPress={() => handleStartExam({
                        id: rec.id,
                        title: rec.title,
                        slug: rec.slug,
                        category: 'آموزش فنی',
                        questionCount: SAMPLE_QUESTIONS.length,
                        mandatory: true,
                        dueDate: 'بدون محدودیت',
                        timeLimitMinutes: 10
                      })}
                    >
                      <RotateCcw size={12} color={theme.colors.error} style={{ marginLeft: 4 }} />
                      <Text style={styles.retryText}>تلاش مجدد و آزمون مجدد</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Data settings embedded inside Exams as additional tool */}
              <View style={styles.settingsCard}>
                <View style={styles.settingsHeader}>
                  <Sliders size={16} color={theme.colors.primary} />
                  <Text style={styles.settingsTitle}>تنظیمات مصرف اینترنت آموزشی</Text>
                </View>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>پخش ویدیو فقط در زمان اتصال به WiFi:</Text>
                  <Switch
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryContainer }}
                    thumbColor={wifiOnly ? theme.colors.primary : theme.colors.secondary}
                    value={wifiOnly}
                    onValueChange={setWifiOnly}
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 4: CERTIFICATES */}
          {activeTab === 'certs' && (
            <View style={styles.listContainer}>
              {certificates.map((cert) => (
                <TouchableOpacity
                  key={cert.id}
                  style={styles.certCard}
                  activeOpacity={0.8}
                  onPress={() => setActiveCert(cert)}
                >
                  <View style={styles.certHeader}>
                    <Award size={36} color={theme.colors.primary} />
                    <View style={styles.certInfo}>
                      <Text style={styles.certTitle}>{cert.courseTitle}</Text>
                      <Text style={styles.certMeta}>صادر شده برای: {cert.userName}</Text>
                    </View>
                  </View>
                  <View style={styles.certFooter}>
                    <Text style={styles.certDate}>اعتبار تا: {cert.expiryDate}</Text>
                    <Text style={styles.certScore}>نمره: %{toFa(cert.score)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </ScrollView>

        {/* 1. EXAM SIMULATOR MODAL */}
        <Modal visible={examStarted} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.examModalContent}>
              <View style={styles.examModalHeader}>
                <Text style={styles.examModalTitle}>{activeExam?.title}</Text>
                <View style={styles.timerBox}>
                  <Clock size={14} color={theme.colors.error} style={{ marginLeft: 4 }} />
                  <Text style={styles.timerText}>{formatTimer(examTimer)}</Text>
                </View>
              </View>

              <View style={styles.questionBox}>
                <Text style={styles.questionNumber}>
                  سوال {toFa(currentQuestionIdx + 1)} از {toFa(SAMPLE_QUESTIONS.length)}:
                </Text>
                <Text style={styles.questionText}>{SAMPLE_QUESTIONS[currentQuestionIdx].q}</Text>

                <View style={styles.optionsList}>
                  {SAMPLE_QUESTIONS[currentQuestionIdx].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIdx] === oIdx
                    return (
                      <TouchableOpacity
                        key={oIdx}
                        style={[styles.optionButton, isSelected && styles.optionSelected]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedAnswers({ ...selectedAnswers, [currentQuestionIdx]: oIdx })}
                      >
                        <View style={[styles.optionDot, isSelected && styles.optionDotActive]} />
                        <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              <View style={styles.examModalFooter}>
                {currentQuestionIdx > 0 ? (
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => setCurrentQuestionIdx(prev => prev - 1)}
                  >
                    <Text style={styles.navButtonText}>قبلی</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 80 }} />
                )}

                {currentQuestionIdx < SAMPLE_QUESTIONS.length - 1 ? (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonNext]}
                    onPress={() => setCurrentQuestionIdx(prev => prev + 1)}
                  >
                    <Text style={styles.navButtonText}>بعدی</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.navButton, styles.navButtonSubmit]}
                    onPress={() => handleFinishExam(false)}
                  >
                    <Text style={styles.navButtonText}>ثبت نهایی آزمون</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* 2. EXAM RESULT MODAL */}
        <Modal visible={examFinished} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.resultModalContent}>
              <Trophy size={60} color={examResultScore >= 70 ? theme.colors.success : theme.colors.error} />
              <Text style={styles.resultModalTitle}>
                {examResultScore >= 70 ? 'تبریک! آزمون را با موفقیت پاس کردید' : 'متاسفانه نمره حد نصاب را کسب نکردید'}
              </Text>
              <Text style={styles.resultModalScore}>نمره شما: %{toFa(examResultScore)}</Text>
              <Text style={styles.resultModalDesc}>
                {examResultScore >= 70
                  ? `امتیاز علمی شما افزایش یافت و گواهینامه معتبر این دوره صادر و به کارنامه شما پیوست شد.`
                  : 'شما می‌توانید پس از مطالعه مجدد مطالب آموزشی و ویدیوهای مرتبط، مجدداً در آزمون شرکت کنید.'}
              </Text>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setExamFinished(false)}
              >
                <Text style={styles.closeModalBtnText}>بستن صفحه نتایج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 3. VIDEO PLAYER MODAL */}
        <Modal visible={!!selectedVideo} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.videoPlayerContent}>
              <View style={styles.videoPlayerHeader}>
                <Text style={styles.videoPlayerTitle}>{selectedVideo?.title}</Text>
                <TouchableOpacity onPress={() => { setSelectedVideo(null); setPlayingVideo(false); }} style={styles.closeVideoBtn}>
                  <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Mock Video Canvas */}
              <View style={styles.videoPlayerCanvas}>
                {playingVideo ? (
                  <View style={styles.playingCanvas}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.playingText}>در حال پخش ویدیو آموزشی با کیفیت {videoQuality}...</Text>
                  </View>
                ) : (
                  <Image source={{ uri: selectedVideo?.coverUrl }} style={styles.canvasCover} />
                )}
                
                <TouchableOpacity
                  style={styles.canvasPlayOverlay}
                  onPress={() => setPlayingVideo(!playingVideo)}
                >
                  <Play size={40} color="#ffffff" fill="#ffffff" style={{ opacity: playingVideo ? 0.3 : 1 }} />
                </TouchableOpacity>
              </View>

              {/* Video Controls */}
              <View style={styles.videoControls}>
                <Text style={styles.timerText}>{toFa('00:00')} / {selectedVideo ? toFa(selectedVideo.duration) : ''}</Text>
                <View style={styles.videoTrackBg}>
                  <View style={[styles.videoTrackFill, { width: playingVideo ? '40%' : '0%' }]} />
                </View>
              </View>

              <Text style={styles.videoExcerptDetail}>{selectedVideo?.excerpt}</Text>

              {selectedVideo?.mandatory && (
                <View style={styles.prereqAlert}>
                  <AlertTriangle size={14} color={theme.colors.warning} style={{ marginLeft: 6 }} />
                  <Text style={styles.prereqAlertText}>مشاهده کامل این ویدیو جهت فعالسازی آزمون دوره الزامی است.</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* 4. CERTIFICATE GENERATOR MODAL */}
        <Modal visible={!!activeCert} animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.certificateCanvas}>
              <View style={styles.certBorder}>
                <Award size={48} color={theme.colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
                <Text style={styles.certCanvasTitle}>گواهینامه رسمی شایستگی فنی</Text>
                <Text style={styles.certCanvasSub}>شرکت بهره‌برداری راه آهن شهری تهران و حومه</Text>
                
                <View style={styles.certBodyTextContainer}>
                  <Text style={styles.certBodyText}>
                    بدین وسیله تایید می‌گردد همکار گرامی جناب آقای/سرکار خانم <Text style={{ fontWeight: 'bold' }}>{activeCert?.userName}</Text> با کد پرسنلی فوق، دوره آموزشی تخصصی:
                  </Text>
                  <Text style={styles.certCourseName}>{activeCert?.courseTitle}</Text>
                  <Text style={styles.certBodyText}>
                    را با موفقیت و کسب نمره شایستگی <Text style={{ fontWeight: 'bold' }}>%{toFa(activeCert?.score || 0)}</Text> سپری نموده و موفق به اخذ این گواهینامه گردیده است.
                  </Text>
                </View>

                <View style={styles.certCanvasFooter}>
                  <View style={styles.certSign}>
                    <Text style={styles.signTitle}>مهر و امضای معاونت آموزش</Text>
                    <View style={styles.mockSignature} />
                  </View>
                  <View style={styles.qrPlaceholder}>
                    <Text style={{ fontSize: 8, color: '#888' }}>QR Code</Text>
                  </View>
                </View>
              </View>

              <View style={styles.certActions}>
                <TouchableOpacity style={styles.printBtn} onPress={() => Alert.alert('پرینت', 'دستور چاپ گواهینامه به پرینتر شبکه دپو ارسال شد.')}>
                  <Printer size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  <Text style={styles.printBtnText}>چاپ گواهینامه</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeCertBtn} onPress={() => setActiveCert(null)}>
                  <Text style={styles.closeCertBtnText}>بستن</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </ScreenWrapper>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.xl,
    padding: 3,
    marginHorizontal: theme.spacing.containerMargin,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.lg,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 10.5,
    color: theme.colors.secondary,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollContent: {
    padding: theme.spacing.containerMargin,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 12,
  },
  headerInfoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '12',
    borderColor: theme.colors.warning + '30',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    gap: 8,
  },
  headerInfoText: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
    flex: 1,
    textAlign: 'right',
  },
  pathCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    gap: 8,
    ...theme.shadows.level1,
  },
  pathCardLocked: {
    opacity: 0.6,
  },
  pathHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pathTitleCol: {
    alignItems: 'flex-start',
    flex: 1,
  },
  pathTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  pathCategory: {
    fontSize: 10,
    color: theme.colors.secondary,
    marginTop: 2,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  pathDesc: {
    fontSize: 11.5,
    color: theme.colors.secondary,
    lineHeight: 16,
    textAlign: 'right',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  progressSection: {
    marginTop: 8,
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  progressValue: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.onSurface,
    fontSize: 13,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  videoCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.level1,
  },
  videoThumbnailContainer: {
    height: 140,
    position: 'relative',
    backgroundColor: '#000000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229,57,53,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  videoInfo: {
    padding: 12,
    gap: 6,
  },
  videoTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    flex: 1,
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  mandatoryBadge: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.error + '12',
    color: theme.colors.error,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    fontWeight: '800',
    marginRight: 6,
  },
  videoExcerpt: {
    fontSize: 11,
    color: theme.colors.secondary,
    lineHeight: 15,
    textAlign: 'right',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  videoFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  videoMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statusCompleted: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  statusCompletedText: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  videoProgressPercent: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    marginBottom: 10,
    fontFamily: theme.typography.sectionTitle.fontFamily,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  emptyText: {
    fontSize: 11.5,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  examCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    gap: 8,
    ...theme.shadows.level1,
  },
  examHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    flex: 1,
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  examMeta: {
    fontSize: 10,
    color: theme.colors.secondary,
    textAlign: 'right',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  examStartButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    height: 36,
    borderRadius: theme.borderRadius.md,
    marginTop: 4,
  },
  examStartText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    flex: 1,
  },
  resultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePassed: {
    backgroundColor: theme.colors.success + '15',
  },
  badgeFailed: {
    backgroundColor: theme.colors.error + '15',
  },
  badgeTextPassed: {
    color: theme.colors.success,
    fontSize: 9,
    fontWeight: 'bold',
  },
  badgeTextFailed: {
    color: theme.colors.error,
    fontSize: 9,
    fontWeight: 'bold',
  },
  resultFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  resultMeta: {
    fontSize: 9.5,
    color: theme.colors.secondary,
  },
  resultDate: {
    fontSize: 9,
    color: theme.colors.secondary,
  },
  retryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 10,
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  certCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    gap: 12,
    ...theme.shadows.level1,
  },
  certHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  certInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  certTitle: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'right',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  certMeta: {
    fontSize: 10,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  certFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  certDate: {
    fontSize: 9.5,
    color: theme.colors.secondary,
  },
  certScore: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  settingsCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    marginTop: 16,
    gap: 12,
  },
  settingsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  settingsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  settingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 10.5,
    color: theme.colors.secondary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  examModalContent: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    gap: 16,
  },
  examModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 10,
  },
  examModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timerText: {
    color: theme.colors.error,
    fontSize: 11,
    fontWeight: 'bold',
  },
  questionBox: {
    gap: 12,
  },
  questionNumber: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  questionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    lineHeight: 18,
    textAlign: 'right',
  },
  optionsList: {
    gap: 10,
    marginTop: 10,
  },
  optionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    gap: 10,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '0A',
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
  },
  optionDotActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 11.5,
    color: theme.colors.onSurface,
    textAlign: 'right',
    flex: 1,
  },
  optionTextActive: {
    fontWeight: '700',
  },
  examModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 14,
  },
  navButton: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerHigh,
  },
  navButtonNext: {
    backgroundColor: theme.colors.primary,
  },
  navButtonSubmit: {
    backgroundColor: theme.colors.success,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  resultModalContent: {
    width: '90%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  resultModalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginTop: 8,
  },
  resultModalScore: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  resultModalDesc: {
    fontSize: 11.5,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  closeModalBtn: {
    backgroundColor: theme.colors.primary,
    height: 40,
    width: '100%',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Video player modal
  videoPlayerContent: {
    width: '100%',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 12,
  },
  videoPlayerHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoPlayerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  closeVideoBtn: {
    padding: 4,
  },
  videoPlayerCanvas: {
    height: 180,
    backgroundColor: '#000000',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingCanvas: {
    alignItems: 'center',
    gap: 8,
  },
  playingText: {
    color: '#ffffff',
    fontSize: 11,
  },
  canvasCover: {
    width: '100%',
    height: '100%',
  },
  canvasPlayOverlay: {
    position: 'absolute',
    alignSelf: 'center',
  },
  videoControls: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  videoTrackBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  videoTrackFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  videoExcerptDetail: {
    fontSize: 11,
    color: theme.colors.secondary,
    lineHeight: 16,
    textAlign: 'right',
  },
  prereqAlert: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '12',
    borderColor: theme.colors.warning + '30',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  prereqAlertText: {
    fontSize: 9.5,
    color: theme.colors.warning,
    fontWeight: 'bold',
  },
  // Certificate canvas
  certificateCanvas: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    gap: 16,
  },
  certBorder: {
    borderWidth: 2,
    borderColor: '#d4af37',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#faf9f6',
  },
  certCanvasTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    fontFamily: theme.typography.screenTitle.fontFamily,
  },
  certCanvasSub: {
    fontSize: 10,
    color: '#555555',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  certBodyTextContainer: {
    gap: 12,
    marginVertical: 12,
  },
  certBodyText: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 18,
    textAlign: 'center',
  },
  certCourseName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginVertical: 6,
  },
  certCanvasFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 14,
  },
  certSign: {
    alignItems: 'flex-start',
  },
  signTitle: {
    fontSize: 8.5,
    color: '#666666',
  },
  mockSignature: {
    width: 80,
    height: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#888888',
    marginTop: 4,
  },
  qrPlaceholder: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certActions: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeCertBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#eaeaea',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCertBtnText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: 'bold',
  },
})

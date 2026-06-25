import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Vibration,
  TextInput,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import {
  Radio,
  Wifi,
  Volume2,
  VolumeX,
  Clock,
  ShieldAlert,
  ChevronRight,
  Delete,
} from 'lucide-react-native'

interface RadioLog {
  id: string
  time: string
  sender: string
  message: string
  channel: string
}

export function RadioSimulatorScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user)
  const [channel, setChannel] = useState('OCC MAIN')
  const [dialedCode, setDialedCode] = useState('1000') // Default frequency code
  const [state, setState] = useState<'IDLE' | 'TRANSMITTING' | 'RECEIVING'>('IDLE')
  const [muted, setMuted] = useState(false)
  const [radioLogs, setRadioLogs] = useState<RadioLog[]>([])
  const [currentTransmittingText, setCurrentTransmittingText] = useState('')

  // Web Audio Context for tone synthesis (works on React Native Web)
  const audioCtxRef = useRef<any>(null)

  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass()
        }
      }
    } catch (e) {
      // Audio not supported or needs user gesture
    }
  }

  // Play standard TETRA start beep (triple chirp)
  const playStartBeep = () => {
    if (muted) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const duration = 0.05
      
      // Chirp 1 (800Hz)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(800, now)
      gain1.gain.setValueAtTime(0.08, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + duration)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + duration)

      // Chirp 2 (900Hz)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(900, now + 0.06)
      gain2.gain.setValueAtTime(0.08, now + 0.06)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06 + duration)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.06)
      osc2.stop(now + 0.06 + duration)

      // Chirp 3 (1000Hz)
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(1000, now + 0.12)
      gain3.gain.setValueAtTime(0.08, now + 0.12)
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.12 + duration)
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(now + 0.12)
      osc3.stop(now + 0.12 + duration)
    } catch {}
  }

  // Play squelch/white noise burst on transmission end
  const playSquelch = () => {
    if (muted) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1000
      filter.Q.value = 1.0

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      noise.start()
      noise.stop(ctx.currentTime + 0.16)
    } catch {}
  }

  // Play DTMF dual tones
  const playDtmfTone = (freq1: number, freq2: number, duration = 0.12) => {
    if (muted) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc1.frequency.value = freq1
      osc2.frequency.value = freq2
      osc1.type = 'sine'
      osc2.type = 'sine'
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      
      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      
      osc1.start()
      osc2.start()
      osc1.stop(ctx.currentTime + duration)
      osc2.stop(ctx.currentTime + duration)
    } catch {}
  }

  const dtmfFrequencies: Record<string, [number, number]> = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
  }

  const handleKeyPress = (key: string) => {
    Vibration.vibrate(30)
    if (dtmfFrequencies[key]) {
      playDtmfTone(dtmfFrequencies[key][0], dtmfFrequencies[key][1])
    }
    
    setDialedCode((prev) => {
      if (prev.length >= 6) return prev
      return prev + key
    })
  }

  const handleClearCode = () => {
    Vibration.vibrate(50)
    playDtmfTone(440, 440, 0.08)
    setDialedCode('')
  }

  const playSystemTone = (freq: number, duration: number) => {
    if (muted) return
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
  }

  // Load initial logs
  useEffect(() => {
    setRadioLogs([
      { id: '1', time: '۰۳:۴۰', sender: 'مرکز فرمان OCC', message: 'کلیه راهبران سرعت در بلاک امام خمینی به دلیل بازرسی فنی تقلیل یابد.', channel: 'OCC MAIN' },
      { id: '2', time: '۰۳:۴۱', sender: 'راهبر رام ۱۰۴', message: 'OCC رام ۱۰۴ دستور را دریافت کرد. در حال تقلیل سرعت به ۳۰ کیلومتر.', channel: 'OCC MAIN' },
      { id: '3', time: '۰۳:۴۲', sender: 'ایستگاه هفت تیر', message: 'دیسپاچینگ، سوزن خط ۲ با موفقیت آزاد شد. مسیر تخلیه است.', channel: 'STATION TALK' }
    ])
  }, [])

  // Simulate incoming messages based on channels or codes
  useEffect(() => {
    const interval = setInterval(() => {
      if (state !== 'IDLE') return

      const trigger = Math.random() > 0.65
      if (trigger) {
        const isCustomCode = dialedCode.length > 0
        const activeBand = isCustomCode ? `باند اختصاصی ${dialedCode}` : channel
        
        let message = ''
        let sender = ''

        if (isCustomCode) {
          const codes = [
            `OCC به راهبر رام ${dialedCode}، ارتباط سیگنالینگ برقرار است. سرعت در محدوده را کنترل کنید.`,
            `راهبر واحد فنی در فرکانس ${dialedCode}؛ تست تخلیه ترمز پارک به درستی انجام شد.`,
            `رئیس ایستگاه دروازه دولت در فرکانس اختصاصی ${dialedCode}؛ در انتظار تایید خروج قطار عملیاتی.`,
            `تکنسین پست علائم؛ ولتاژ تغذیه فرستنده در فرکانس ${dialedCode} پایدار گزارش شد.`
          ]
          message = codes[Math.floor(Math.random() * codes.length)]
          sender = Math.random() > 0.5 ? 'مرکز فرمان OCC' : `راهبر سیستم (کد ${dialedCode})`
        } else {
          const randomMessages = [
            { sender: 'مرکز فرمان OCC', message: 'سوزن ایستگاه دروازه دولت در وضعیت انحراف دستی قرار گرفت. اعزام قطار ۴۰۲ با احتیاط.', channel: 'OCC MAIN' },
            { sender: 'دپو کهریزک', message: 'قطار فنی جهت شستشوی تجهیزات خط به پارکینگ ۱۲ وارد شد. دیسپاچ تمام.', channel: 'DEPOT & TECH' },
            { sender: 'راهبر رام ۱۰۸', message: 'OCC رام ۱۰۸. سیستم ترمز اضطراری مجدداً تست شد. نقص برطرف شده است.', channel: 'OCC MAIN' },
            { sender: 'ایستگاه تجریش', message: 'رئیس ایستگاه تجریش. ازدحام روی سکو بیش از ظرفیت عادی است، لطفاً سرفاصله قطارها را کنترل کنید.', channel: 'STATION TALK' }
          ]
          const selected = randomMessages[Math.floor(Math.random() * randomMessages.length)]
          if (selected.channel !== channel) return
          message = selected.message
          sender = selected.sender
        }

        setState('RECEIVING')
        setCurrentTransmittingText(message)
        playStartBeep()

        const now = new Date()
        const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })

        setTimeout(() => {
          setRadioLogs((prev) => [
            {
              id: Date.now().toString(),
              time: timeStr,
              sender: sender,
              message: message,
              channel: activeBand
            },
            ...prev
          ])
          playSquelch()
          setState('IDLE')
          setCurrentTransmittingText('')
        }, 4500)
      }
    }, 9000)

    return () => clearInterval(interval)
  }, [state, channel, dialedCode, muted])

  const handlePttPress = () => {
    if (state !== 'IDLE') return
    Vibration.vibrate([0, 100])
    setState('TRANSMITTING')
    playStartBeep()
  }

  const handlePttRelease = () => {
    if (state !== 'TRANSMITTING') return
    Vibration.vibrate(50)
    playSquelch()
    setState('IDLE')

    const now = new Date()
    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    const activeBand = dialedCode.length > 0 ? `کد فرکانس ${dialedCode}` : channel

    setRadioLogs((prev) => [
      {
        id: Date.now().toString(),
        time: timeStr,
        sender: 'شما (راهبر)',
        message: dialedCode.length > 0 
          ? `پیام رادیویی با کد اختصاصی فرستنده ${dialedCode} با موفقیت مخابره شد.`
          : `پیام رادیویی با موفقیت در کانال عمومی ${channel} ارسال شد.`,
        channel: activeBand
      },
      ...prev
    ])
  }

  const formatFarsiNumber = (numStr: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  const filteredLogs = radioLogs.filter(log => {
    if (dialedCode.length > 0) {
      return log.channel.includes(dialedCode)
    }
    return log.channel === channel
  })

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronRight size={24} color="#f2f2f7" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Radio size={20} color="#e53935" />
          <Text style={styles.headerTitle}>شبیه‌ساز بی‌سیم TETRA</Text>
        </View>
        <TouchableOpacity
          onPress={() => setMuted(!muted)}
          style={styles.volumeButton}
        >
          {muted ? <VolumeX size={20} color="#e53935" /> : <Volume2 size={20} color="#34c759" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Device Wrapper */}
        <View style={styles.deviceWrapper}>
          
          {/* Antenna */}
          <View style={styles.antenna} />
          {/* Knob */}
          <View style={styles.knob}>
            <View style={styles.knobIndicator} />
          </View>

          {/* Motorola Body Frame */}
          <View style={styles.radioBody}>
            <Text style={styles.brandText}>Motorola MTP850</Text>

            {/* LCD Display */}
            <View
              style={[
                styles.lcdScreen,
                state === 'TRANSMITTING'
                  ? styles.lcdTx
                  : state === 'RECEIVING'
                  ? styles.lcdRx
                  : styles.lcdIdle,
              ]}
            >
              {/* LCD Top Bar */}
              <View style={styles.lcdHeader}>
                <View style={styles.lcdStatusIconBox}>
                  <Wifi size={10} color="#34c759" />
                  <Text style={styles.lcdStatusText}>آنلاین</Text>
                </View>
                <Text style={styles.lcdFreqText}>
                  {dialedCode ? `${formatFarsiNumber(dialedCode)}.۰۰ MHz` : '۳۸۵.۱۲۵ MHz'}
                </Text>
                {/* Battery */}
                <View style={styles.batteryIcon}>
                  <View style={styles.batteryLevel} />
                </View>
              </View>

              {/* LCD Center */}
              <View style={styles.lcdCenter}>
                <Text
                  style={[
                    styles.lcdBandText,
                    state === 'TRANSMITTING'
                      ? styles.textTx
                      : state === 'RECEIVING'
                      ? styles.textRx
                      : styles.textIdle,
                  ]}
                >
                  {dialedCode ? `باند اختصاصی: ${formatFarsiNumber(dialedCode)}` : channel}
                </Text>
                <Text style={styles.lcdStateText}>
                  {state === 'TRANSMITTING'
                    ? 'TRANSMITTING...'
                    : state === 'RECEIVING'
                    ? 'RECEIVING...'
                    : 'READY / آماده'}
                </Text>
              </View>

              {/* LCD Bottom Transcripts */}
              <View style={styles.lcdFooter}>
                <Text numberOfLines={2} style={styles.lcdFooterText}>
                  {state === 'TRANSMITTING'
                    ? 'در حال ارسال سیگنال صوتی...'
                    : state === 'RECEIVING'
                    ? currentTransmittingText
                    : dialedCode.length > 0
                    ? `باند اختصاصی کد ${formatFarsiNumber(dialedCode)} برقرار است.`
                    : 'دکمه PTT را نگه‌دارید و صحبت کنید.'}
                </Text>
              </View>
            </View>

            {/* LED Status Indicators */}
            <View style={styles.ledRow}>
              <View style={styles.ledGroup}>
                <View style={[styles.ledDot, state === 'TRANSMITTING' ? styles.ledRed : styles.ledOff]} />
                <Text style={styles.ledLabel}>TX</Text>
              </View>
              <View style={styles.ledGroup}>
                <View style={[styles.ledDot, state === 'RECEIVING' ? styles.ledAmber : styles.ledOff]} />
                <Text style={styles.ledLabel}>RX</Text>
              </View>
              <View style={styles.ledGroup}>
                <View style={[styles.ledDot, state === 'IDLE' ? styles.ledGreen : styles.ledOff]} />
                <Text style={styles.ledLabel}>ON</Text>
              </View>
            </View>

            {/* Keypad */}
            <View style={styles.keypadContainer}>
              <View style={styles.gridKeypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => handleKeyPress(key)}
                    style={styles.keyButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.keyButtonText}>{formatFarsiNumber(key)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={handleClearCode}
                style={styles.clearButton}
                activeOpacity={0.8}
              >
                <Delete size={16} color="#e53935" />
                <Text style={styles.clearButtonText}>پاک کردن فرکانس</Text>
              </TouchableOpacity>
            </View>

            {/* General Channels Selector */}
            <View style={styles.channelsSection}>
              <Text style={styles.channelsTitle}>کانال عمومی (بدون کد فرکانس):</Text>
              <View style={styles.channelsRow}>
                {['OCC MAIN', 'STATION TALK', 'DEPOT & TECH'].map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    onPress={() => {
                      Vibration.vibrate(30)
                      playSystemTone(500, 0.08)
                      setChannel(ch)
                      setDialedCode('') // reset dialed code
                    }}
                    style={[
                      styles.channelSelectBtn,
                      channel === ch && dialedCode === ''
                        ? styles.channelSelectBtnActive
                        : styles.channelSelectBtnInactive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.channelSelectBtnText,
                        channel === ch && dialedCode === ''
                          ? styles.channelSelectBtnTextActive
                          : styles.channelSelectBtnTextInactive,
                      ]}
                    >
                      {ch.replace(' ', '\n')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* PTT Trigger */}
            <View style={styles.pttContainer}>
              <TouchableOpacity
                onPressIn={handlePttPress}
                onPressOut={handlePttRelease}
                style={[
                  styles.pttButton,
                  state === 'TRANSMITTING' ? styles.pttActive : styles.pttIdle,
                ]}
                activeOpacity={0.9}
              >
                <Radio size={24} color={state === 'TRANSMITTING' ? '#ffffff' : '#a0a3b0'} />
                <Text
                  style={[
                    styles.pttButtonText,
                    state === 'TRANSMITTING' ? styles.pttActiveText : styles.pttIdleText,
                  ]}
                >
                  PTT
                </Text>
              </TouchableOpacity>
              <Text style={styles.pttInstruction}>نگه‌دارید و صحبت کنید</Text>
            </View>

          </View>
        </View>

        {/* Logs Archive */}
        <View style={styles.logsContainer}>
          <View style={styles.logsHeader}>
            <Clock size={16} color="#e53935" />
            <Text style={styles.logsTitle}>وقایع رادیویی باند فعال ({dialedCode ? `باند ${formatFarsiNumber(dialedCode)}` : channel})</Text>
          </View>

          <View style={styles.logsList}>
            {filteredLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <Text style={styles.logSender}>{log.sender}</Text>
                  <Text style={styles.logTime}>{formatFarsiNumber(log.time)}</Text>
                </View>
                <Text style={styles.logMessage}>{log.message}</Text>
                <View style={styles.logCardFooter}>
                  <Text style={styles.logMeta}>باند: {formatFarsiNumber(log.channel)}</Text>
                  <View style={styles.tetraBadge}>
                    <Text style={styles.tetraBadgeText}>TETRA Sec</Text>
                  </View>
                </View>
              </View>
            ))}

            {filteredLogs.length === 0 && (
              <View style={styles.emptyLogsBox}>
                <Radio size={32} color="#262930" />
                <Text style={styles.emptyLogsText}>هیچ پیام رادیویی در این باند مخابره نشده است.</Text>
                <Text style={styles.emptyLogsSub}>با نگه‌داشتن PTT در فرکانس انتخابی صحبت کنید یا منتظر پیام دیسپاچر باشید.</Text>
              </View>
            )}
          </View>

          <View style={styles.disclaimerBox}>
            <ShieldAlert size={16} color="#ff9500" style={styles.disclaimerIcon} />
            <Text style={styles.disclaimerText}>
              این شبیه‌ساز مستقیماً متصل به شبکه دیسپاچینگ خط ۱ مترو تهران است. کلیه ارتباطات ضبط و پایش می‌شود.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
  },
  header: {
    height: 56,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    backgroundColor: '#1c1e24',
  },
  backButton: {
    padding: 4,
  },
  headerTitleBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f2f2f7',
  },
  volumeButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  deviceWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  antenna: {
    position: 'absolute',
    top: -36,
    right: 60,
    width: 20,
    height: 38,
    backgroundColor: '#262930',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#13151a',
    zIndex: 1,
  },
  knob: {
    position: 'absolute',
    top: -24,
    left: 70,
    width: 28,
    height: 26,
    backgroundColor: '#262930',
    borderRadius: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#13151a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  knobIndicator: {
    width: 3,
    height: 12,
    backgroundColor: '#e53935',
    borderRadius: 1.5,
  },
  radioBody: {
    width: 300,
    backgroundColor: '#1c1e24',
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#262930',
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  brandText: {
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 2,
    color: '#8e8e93',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  lcdScreen: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  lcdIdle: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  lcdTx: {
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    borderColor: 'rgba(229, 57, 53, 0.2)',
  },
  lcdRx: {
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
    borderColor: 'rgba(255, 149, 0, 0.2)',
  },
  lcdHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lcdStatusIconBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  lcdStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8e8e93',
  },
  lcdFreqText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#8e8e93',
  },
  batteryIcon: {
    width: 14,
    height: 8,
    borderWidth: 1,
    borderColor: '#8e8e93',
    borderRadius: 1.5,
    padding: 0.5,
  },
  batteryLevel: {
    height: '100%',
    backgroundColor: '#34c759',
    width: '80%',
    borderRadius: 0.5,
  },
  lcdCenter: {
    alignItems: 'center',
    marginVertical: 4,
  },
  lcdBandText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textIdle: { color: '#34c759' },
  textTx: { color: '#e53935' },
  textRx: { color: '#ff9500' },
  lcdStateText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
    textAlign: 'center',
  },
  lcdFooter: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    padding: 6,
    height: 40,
    justifyContent: 'center',
  },
  lcdFooterText: {
    fontSize: 8.5,
    color: '#f2f2f7',
    textAlign: 'center',
    lineHeight: 12,
  },
  ledRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    marginBottom: 8,
  },
  ledGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  ledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ledRed: { backgroundColor: '#e53935' },
  ledAmber: { backgroundColor: '#ff9500' },
  ledGreen: { backgroundColor: '#34c759' },
  ledOff: { backgroundColor: '#262930' },
  ledLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#8e8e93',
  },
  keypadContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262930',
    alignItems: 'center',
  },
  gridKeypad: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  keyButton: {
    width: '30%',
    backgroundColor: '#262930',
    borderWidth: 1,
    borderColor: '#3a3f4b',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  keyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clearButton: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.2)',
    borderRadius: 8,
    paddingVertical: 6,
    marginTop: 4,
    gap: 6,
  },
  clearButtonText: {
    fontSize: 10,
    color: '#e53935',
    fontWeight: 'bold',
  },
  channelsSection: {
    width: '100%',
    marginTop: 12,
  },
  channelsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8e8e93',
    textAlign: 'right',
    marginBottom: 6,
  },
  channelsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 6,
  },
  channelSelectBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelSelectBtnActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  channelSelectBtnInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: '#262930',
  },
  channelSelectBtnText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  channelSelectBtnTextActive: {
    color: '#ffffff',
  },
  channelSelectBtnTextInactive: {
    color: '#8e8e93',
  },
  pttContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  pttButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  pttIdle: {
    backgroundColor: '#262930',
    borderColor: '#3a3f4b',
  },
  pttActive: {
    backgroundColor: '#e53935',
    borderColor: '#ff5c5c',
  },
  pttButtonText: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  pttIdleText: {
    color: '#a0a3b0',
  },
  pttActiveText: {
    color: '#ffffff',
  },
  pttInstruction: {
    fontSize: 8.5,
    color: '#8e8e93',
    marginTop: 6,
  },
  logsContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1c1e24',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262930',
    padding: 14,
    marginTop: 24,
  },
  logsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    paddingBottom: 10,
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 11.5,
    fontWeight: 'bold',
    color: '#f2f2f7',
  },
  logsList: {
    maxHeight: 280,
  },
  logCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  logCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logSender: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#e53935',
  },
  logTime: {
    fontSize: 8.5,
    fontFamily: 'monospace',
    color: '#8e8e93',
  },
  logMessage: {
    fontSize: 10.5,
    color: '#f2f2f7',
    textAlign: 'right',
    lineHeight: 15,
  },
  logCardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  logMeta: {
    fontSize: 8,
    color: '#8e8e93',
  },
  tetraBadge: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tetraBadgeText: {
    fontSize: 7.5,
    color: '#e53935',
    fontWeight: 'bold',
  },
  emptyLogsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyLogsText: {
    fontSize: 10.5,
    color: '#8e8e93',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyLogsSub: {
    fontSize: 9,
    color: '#555860',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 13,
  },
  disclaimerBox: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255, 149, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  disclaimerIcon: {
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 8.5,
    color: '#ff9500',
    textAlign: 'right',
    lineHeight: 13,
  },
})

export default RadioSimulatorScreen

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'
import {
  Radio,
  Wifi,
  Volume2,
  VolumeX,
  Clock,
  ShieldAlert,
  Delete
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RadioLog {
  id: string
  time: string
  sender: string
  message: string
  channel: string
}

export default function RadioSimulatorPage() {
  const [channel, setChannel] = useState('OCC MAIN')
  const [dialedCode, setDialedCode] = useState('1000') // default TETRA frequency band code
  const [state, setState] = useState<'IDLE' | 'TRANSMITTING' | 'RECEIVING'>('IDLE')
  const [vol, setVol] = useState(80)
  const [muted, setMuted] = useState(false)
  const [radioLogs, setRadioLogs] = useState<RadioLog[]>([])
  const [currentTransmittingText, setCurrentTransmittingText] = useState('')

  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setConfig(data.data)
          if (data.data.comms?.radioDefaultChannel) {
            setChannel(data.data.comms.radioDefaultChannel)
          }
        }
      })
      .catch(() => {})
  }, [])

  const audioCtxRef = useRef<AudioContext | null>(null)

  const formatFarsiNumber = (numStr: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  // Load initial logs
  useEffect(() => {
    setRadioLogs([
      { id: '1', time: '۰۳:۴۰', sender: 'مرکز فرمان OCC', message: 'کلیه راهبران سرعت در بلاک امام خمینی به دلیل بازرسی فنی تقلیل یابد.', channel: 'OCC MAIN' },
      { id: '2', time: '۰۳:۴۱', sender: 'راهبر رام ۱۰۴', message: 'OCC رام ۱۰۴ دستور را دریافت کرد. در حال تقلیل سرعت به ۳۰ کیلومتر.', channel: 'OCC MAIN' },
      { id: '3', time: '۰۳:۴۲', sender: 'ایستگاه هفت تیر', message: 'دیسپاچینگ، سوزن خط ۲ با موفقیت آزاد شد. مسیر تخلیه است.', channel: 'STATION TALK' }
    ])
  }, [])

  // Audio helper
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  };

  // Play standard TETRA start beep (triple chirp) using Web Audio API
  const playStartBeep = () => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx || muted) return

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
  }

  // Play squelch/white noise burst using Web Audio API on release
  const playSquelch = () => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx || muted) return

    const bufferSize = ctx.sampleRate * 0.15 // 150ms squelch burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1 // White noise
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1000 // Radio bandpass filter
    filter.Q.value = 1.0

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start()
    noise.stop(ctx.currentTime + 0.16)
  }

  // Synthesize DTMF Dial Tones
  const playDtmfTone = (freq1: number, freq2: number, duration = 0.12) => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx || muted) return
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
    if (dtmfFrequencies[key]) {
      playDtmfTone(dtmfFrequencies[key][0], dtmfFrequencies[key][1])
    }
    
    setDialedCode((prev) => {
      if (prev.length >= 6) return prev // limit to 6 digits
      return prev + key
    })
  }

  const handleClearCode = () => {
    playDtmfTone(440, 440, 0.08)
    setDialedCode('')
  }

  // Simulate dispatcher warnings randomly based on dialed code
  useEffect(() => {
    const intervalTime = (config?.comms?.radioTransmissionInterval ?? 10) * 1000
    const interval = setInterval(() => {
      if (state !== 'IDLE') return
      
      const trigger = Math.random() > 0.65
      if (trigger) {
        // Generate message dynamically related to the current code
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
    }, intervalTime)

    return () => clearInterval(interval)
  }, [state, channel, dialedCode, muted, config])

  // Handle Push To Talk (PTT) Press
  const handlePttPress = () => {
    if (state !== 'IDLE') return
    setState('TRANSMITTING')
    playStartBeep()
  }

  const handlePttRelease = () => {
    if (state !== 'TRANSMITTING') return
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

  // Keyboard Spacebar integration for PTT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state === 'IDLE' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        handlePttPress()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state === 'TRANSMITTING') {
        e.preventDefault()
        handlePttRelease()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [state, channel, dialedCode])

  const channelFreqs: Record<string, string> = {
    'OCC MAIN': '385.125 MHz',
    'STATION TALK': '386.450 MHz',
    'DEPOT & TECH': '387.900 MHz'
  }

  // Filter logs to show only currently active band or relevant logs
  const filteredLogs = radioLogs.filter(log => {
    if (dialedCode.length > 0) {
      return log.channel.includes(dialedCode)
    }
    return log.channel === channel
  })

  if (config && config.comms?.radioEnabled === false) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center" dir="rtl">
        <div className="w-full max-w-md rounded-lg border border-critical/30 bg-surface-container-low/40 backdrop-blur-md p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-[3px] w-full bg-gradient-to-l from-critical via-transparent to-critical" />
          <div className="flex flex-col items-center gap-3 text-critical">
            <ShieldAlert className="size-12 animate-pulse" />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">شبیه‌ساز بی‌سیم TETRA غیرفعال است</h1>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            سیستم شبیه‌ساز سخت‌افزاری بی‌سیم راهبران و دیسپاچینگ در حال حاضر توسط مدیریت سامانه غیرفعال شده است. لطفاً برای ارتباط با مرکز فرماندهی از سایر کانال‌ها استفاده کنید.
          </p>
          <div className="text-[10px] text-foreground-muted font-mono tracking-wider">
            TETRA RADIO SYSTEM OFF
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background text-foreground p-6 gap-6 text-right transition-colors duration-150" dir="rtl">
      {/* ──────────────────────────────────────────────────────── */}
      {/* LEFT: Motorola Radio UI Simulator */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Radio Frame */}
        <div className="w-80 bg-surface-container-low border border-border rounded-lg p-5 shadow-sm flex flex-col items-center relative">
          
          {/* Top Antenna and Knob illustrations */}
          <div className="absolute -top-12 left-12 w-6 h-12 bg-neutral-800 dark:bg-neutral-900 rounded-t border-b-2 border-neutral-700" title="آنتن بی‌سیم" />
          <div className="absolute -top-8 right-16 w-8 h-8 bg-neutral-850 dark:bg-neutral-950 rounded border-b-2 border-neutral-700 flex flex-col items-center justify-center" title="ولوم / تغییر کانال">
            <div className="w-1 h-4 bg-accent rounded" />
          </div>

          {/* Device brand */}
          <span className="text-[10px] font-mono tracking-widest text-foreground-muted mb-3 uppercase">Motorola MTP850 TETRA</span>

          {/* LCD Screen Container */}
          <div className={`w-full h-40 rounded-lg border p-3 flex flex-col justify-between transition-all duration-300 relative ${
            state === 'TRANSMITTING'
              ? 'bg-critical/10 border-critical/50'
              : state === 'RECEIVING'
              ? 'bg-warning/10 border-warning/55'
              : 'bg-success/15 border-success/35'
          }`}>
            {/* LCD Screen Top */}
            <div className="flex justify-between items-center text-[9px] font-bold text-foreground-muted">
              <div className="flex items-center gap-1">
                <Wifi className="size-3 text-success animate-pulse" />
                <span>برخط</span>
              </div>
              <span className="font-mono text-[9px]">
                {dialedCode ? `${formatFarsiNumber(dialedCode)}.۰۰ MHz` : formatFarsiNumber(channelFreqs[channel])}
              </span>
              <div className="w-5 h-2.5 border border-foreground-muted/60 rounded-sm relative p-0.5 flex">
                <div className="h-full bg-success w-full rounded-[1px]" />
                <div className="w-0.5 h-1 bg-foreground-muted absolute -left-1 top-0.5" />
              </div>
            </div>

            {/* LCD Screen Middle */}
            <div className="text-center py-1">
              <span className={`text-[11px] font-bold block ${
                state === 'TRANSMITTING' ? 'text-critical' : state === 'RECEIVING' ? 'text-warning' : 'text-success'
              }`}>
                {dialedCode ? `باند فرکانس: ${formatFarsiNumber(dialedCode)}` : channel}
              </span>
              <h2 className="text-xs font-bold text-foreground mt-0.5">
                {state === 'TRANSMITTING'
                  ? 'TRANSMITTING...'
                  : state === 'RECEIVING'
                  ? 'RECEIVING...'
                  : 'READY / آماده'}
              </h2>
            </div>

            {/* LCD Screen Bottom */}
            <div className="h-10 justify-center flex items-center bg-surface border border-border-subtle p-1 rounded-md shadow-inner">
              <span className="text-[10px] text-foreground font-medium text-center leading-snug w-full" title={currentTransmittingText}>
                {state === 'TRANSMITTING'
                  ? 'در حال ارسال صدا...'
                  : state === 'RECEIVING'
                  ? currentTransmittingText
                  : dialedCode.length > 0
                  ? `باند اختصاصی ${formatFarsiNumber(dialedCode)} فعال است.`
                  : 'دکمه PTT یا Space را نگه‌دارید.'}
              </span>
            </div>
          </div>

          {/* Status Indicator LED lights */}
          <div className="flex gap-4 mt-2.5">
            <div className="flex items-center gap-1">
              <div className={`size-2 rounded-full ${state === 'TRANSMITTING' ? 'bg-critical animate-ping' : 'bg-border'}`} />
              <span className="text-[9px] text-foreground-muted font-semibold">TX</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`size-2 rounded-full ${state === 'RECEIVING' ? 'bg-warning animate-ping' : 'bg-border'}`} />
              <span className="text-[9px] text-foreground-muted font-semibold">RX</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`size-2 rounded-full ${state === 'IDLE' ? 'bg-success animate-pulse' : 'bg-border'}`} />
              <span className="text-[9px] text-foreground-muted font-semibold">ON</span>
            </div>
          </div>

          {/* Keypad Layout */}
          <div className="w-full mt-4 bg-surface p-2.5 rounded-lg border border-border">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="bg-surface-container-low border border-border text-foreground font-semibold rounded-md py-1.5 text-xs hover:bg-surface-hover active:scale-95 transition-all cursor-pointer"
                >
                  {formatFarsiNumber(key)}
                </button>
              ))}
            </div>
            <button
              onClick={handleClearCode}
              className="w-full mt-1.5 bg-critical/5 border border-critical/20 text-critical text-[11px] font-semibold rounded-md py-1.5 flex items-center justify-center gap-1.5 hover:bg-critical/10 transition-colors cursor-pointer"
            >
              <Delete className="size-3.5" />
              پاک کردن فرکانس
            </button>
          </div>

          {/* Channel Selector controls */}
          <div className="w-full mt-4 space-y-1.5">
            <span className="text-[10px] font-semibold text-foreground-muted block">کانال عمومی (در صورت عدم وارد کردن فرکانس):</span>
            <div className="flex gap-1.5">
              {['OCC MAIN', 'STATION TALK', 'DEPOT & TECH'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => {
                    playSystemTone(500, 0.08)
                    setChannel(ch)
                    setDialedCode('') // reset dialed code to use general channels
                  }}
                  className={`flex-1 py-1.5 text-[9px] font-semibold rounded-md border transition-all cursor-pointer ${
                    channel === ch && dialedCode === ''
                      ? 'bg-accent border-accent text-accent-foreground shadow'
                      : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {ch.replace(' ', '\n')}
                </button>
              ))}
            </div>
          </div>

          {/* Large PTT Button container */}
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <button
              onMouseDown={handlePttPress}
              onMouseUp={handlePttRelease}
              onMouseLeave={handlePttRelease}
              className={`size-20 rounded-full border-4 flex flex-col justify-center items-center active:scale-95 transition-all cursor-pointer ${
                state === 'TRANSMITTING'
                  ? 'bg-critical border-critical/80 text-critical-foreground shadow-[0_0_15px_rgba(239,68,68,0.35)]'
                  : 'bg-surface border-border text-foreground-muted hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              <Radio className="size-5 mb-0.5" />
              <span className="text-[10px] font-bold">PTT</span>
            </button>
            <span className="text-[9px] text-foreground-muted font-medium">نگه‌دارید و صحبت کنید</span>
          </div>

        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* RIGHT: Radio logs / transcripts */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-96 flex flex-col border-r lg:border-r border-border p-4 bg-surface-container-low rounded-lg shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="size-4 text-accent" />
          گزارش و آرشیو وقایع رادیویی بی‌سیم
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] pr-1">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-3 bg-surface rounded-lg border border-border-subtle space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-[10px] font-semibold text-accent">
                <span>{log.sender}</span>
                <span className="font-mono text-foreground-muted font-medium">{formatFarsiNumber(log.time)}</span>
              </div>
              <p className="text-xs text-foreground font-semibold leading-relaxed">{log.message}</p>
              <div className="flex justify-between items-center text-[10px] text-foreground-muted pt-1.5 border-t border-border-subtle">
                <span>باند: {formatFarsiNumber(log.channel)}</span>
                <Badge variant="outline" className="text-[9px] border-accent/20 bg-accent/5 text-accent font-semibold">
                  TETRA Sec
                </Badge>
              </div>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-foreground-muted space-y-2">
              <Radio className="size-8 text-foreground-muted/40 animate-pulse" />
              <p className="text-xs font-semibold">هیچ وقایعی در این باند فرکانسی وجود ندارد.</p>
              <p className="text-[10px] leading-relaxed">
                {dialedCode ? `با نگه‌داشتن دکمه PTT در باند ${formatFarsiNumber(dialedCode)} پیام ارسال کنید.` : 'پیام‌های کانال عمومی را بررسی نمایید.'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4 text-xs text-foreground-muted space-y-2 font-medium">
          <div className="flex items-start gap-2 bg-surface p-2.5 rounded-lg border border-border-subtle shadow-sm">
            <ShieldAlert className="size-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[10.5px] leading-relaxed">
              این شبیه‌ساز مستقیماً از بستر امن ترافیک شبکه خط ۱ مترو تهران استفاده می‌کند. مکالمات رادیویی ضبط و در سیستم ممیزی OCC ذخیره می‌گردند.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toFa } from '@/lib/fa'
import { useAuthStore } from '@/features/auth'
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
  createdAt: string
  senderName: string
  message: string
  kind: string
}

export default function RadioSimulatorPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  
  const [channels, setChannels] = useState<any[]>([])
  const [activeChannel, setActiveChannel] = useState<any | null>(null)
  const [phrases, setPhrases] = useState<any[]>([])

  const [dialedCode, setDialedCode] = useState('1000') // default TETRA frequency band code
  const [state, setState] = useState<'IDLE' | 'TRANSMITTING' | 'RECEIVING'>('IDLE')
  const [vol, setVol] = useState(80)
  const [muted, setMuted] = useState(false)
  const [radioLogs, setRadioLogs] = useState<RadioLog[]>([])
  const [currentTransmittingText, setCurrentTransmittingText] = useState('')

  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    if (!accessToken) return

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setConfig(data.data)
        }
      })
      .catch(() => {})

    fetch('/api/comms/radio/channels', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setChannels(data.data)
          setActiveChannel(data.data[0] || null)
        }
      })
      .catch(() => {})

    fetch('/api/comms/radio/phrases', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setPhrases(data.data)
        }
      })
      .catch(() => {})
  }, [accessToken])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const bandpassFilterRef = useRef<BiquadFilterNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const formatFarsiNumber = (numStr: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  // Load logs for the active channel, with polling every 5 seconds
  useEffect(() => {
    if (!accessToken || !activeChannel) return

    const loadLogs = () => {
      fetch(`/api/comms/radio/logs?channelId=${activeChannel.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setRadioLogs(data.data)
          }
        })
        .catch(() => {})
    }

    loadLogs()
    const interval = setInterval(loadLogs, 5000)
    return () => clearInterval(interval)
  }, [accessToken, activeChannel])

  // Audio helper
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    }
  };

  const startStaticNoise = () => {
    try {
      initAudio()
      const ctx = audioCtxRef.current
      if (!ctx || muted) return
      
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        // eslint-disable-next-line react-hooks/purity
        data[i] = Math.random() * 2 - 1
      }
      
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1200
      filter.Q.value = 0.8
      
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.004, ctx.currentTime)
      
      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      source.start()
      noiseSourceRef.current = source
    } catch {}
  }

  const stopStaticNoise = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop()
        noiseSourceRef.current.disconnect()
        noiseSourceRef.current = null
      }
    } catch {}
  }

  const drawWaveform = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const analyser = analyserNodeRef.current
    if (!analyser) return
    
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)
      
      ctx.fillStyle = 'rgba(23, 23, 23, 0.4)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.lineWidth = 2
      ctx.strokeStyle = '#ef4444' // red waveform for transmitting
      ctx.beginPath()
      
      const sliceWidth = canvas.width / bufferLength
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * canvas.height) / 2
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        
        x += sliceWidth
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    
    draw()
  }

  const drawFakeWaveform = (isActiveTransmitting = false) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let phase = 0
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      
      ctx.fillStyle = 'rgba(23, 23, 23, 0.4)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.lineWidth = 1.5
      ctx.strokeStyle = isActiveTransmitting ? '#ef4444' : '#f59e0b' // yellow/amber for receiving
      ctx.beginPath()
      
      const step = 4
      for (let x = 0; x < canvas.width; x += step) {
        // eslint-disable-next-line react-hooks/purity
        const amplitude = isActiveTransmitting ? 12 : 16
        // eslint-disable-next-line react-hooks/purity
        const y = canvas.height / 2 + Math.sin(x * 0.08 + phase) * amplitude * (Math.random() * 0.5 + 0.8)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      phase += 0.2
    }
    draw()
  }

  const playSystemTone = (freq: number, duration: number) => {
    try {
      initAudio()
      const ctx = audioCtxRef.current
      if (!ctx || muted) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {}
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
      // eslint-disable-next-line react-hooks/purity -- Math.random is intentional for white noise generation
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

  const transmitMessage = async (msgText: string) => {
    if (!accessToken || !activeChannel) return
    try {
      const res = await fetch('/api/comms/radio/transmit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          channelId: activeChannel.id,
          message: msgText,
          kind: msgText.includes('توقف اضطراری') || msgText.includes('حادثه') ? 'EMERGENCY' : 'TEXT',
        })
      })
      if (res.ok) {
        const json = await res.json()
        setRadioLogs((prev) => [json.data, ...prev])
      }
    } catch (err) {
      console.error(err)
    }
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
            { sender: 'مرکز فرمان OCC', message: 'سوزن ایستگاه دروازه دولت در وضعیت انحراف دستی قرار گرفت. اعزام قطار ۴۰۲ با احتیاط.', channelKey: 'occ-main' },
            { sender: 'دپو کهریزک', message: 'قطار فنی جهت شستشوی تجهیزات خط به پارکینگ ۱۲ وارد شد. دیسپاچ تمام.', channelKey: 'depot-tech' },
            { sender: 'راهبر رام ۱۰۸', message: 'OCC رام ۱۰۸. سیستم ترمز اضطراری مجدداً تست شد. نقص برطرف شده است.', channelKey: 'occ-main' },
            { sender: 'ایستگاه تجریش', message: 'رئیس ایستگاه تجریش. ازدحام روی سکو بیش از ظرفیت عادی است، لطفاً سرفاصله قطارها را کنترل کنید.', channelKey: 'station-talk' }
          ]
          const selected = randomMessages[Math.floor(Math.random() * randomMessages.length)]
          if (selected.channelKey !== activeChannel?.key) return
          message = selected.message
          sender = selected.sender
        }

        setState('RECEIVING')
        setCurrentTransmittingText(message)
        playStartBeep()
        startStaticNoise()
        
        setTimeout(() => {
          drawFakeWaveform(false)
        }, 180)

        setTimeout(() => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          stopStaticNoise()
          setRadioLogs((prev) => [
            {
              id: Date.now().toString(),
              createdAt: new Date().toISOString(),
              senderName: sender,
              message: message,
              kind: message.includes('اضطراری') ? 'EMERGENCY' : 'TEXT'
            },
            ...prev
          ])
          playSquelch()
          setState('IDLE')
          setCurrentTransmittingText('')
        }, 4500)
      }
    }, intervalTime)

    return () => {
      clearInterval(interval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      stopStaticNoise()
    }
  }, [state, activeChannel, dialedCode, muted, config])

  // Handle Push To Talk (PTT) Press
  const handlePttPress = () => {
    if (state !== 'IDLE') return
    setState('TRANSMITTING')
    playStartBeep()
    startStaticNoise()

    // Request Mic Access and connect to Web Audio API for real oscilloscope
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaStreamRef.current = stream
        initAudio()
        const ctx = audioCtxRef.current
        if (!ctx) return
        
        const source = ctx.createMediaStreamSource(stream)
        sourceNodeRef.current = source
        
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 1500
        filter.Q.value = 1.2
        bandpassFilterRef.current = filter
        
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyserNodeRef.current = analyser
        
        source.connect(filter)
        filter.connect(analyser)
        
        // Connect to destination to hear voice feedback with radio walkie-talkie filter
        analyser.connect(ctx.destination)
        
        drawWaveform()
      }).catch((err) => {
        console.warn('Microphone access denied:', err)
        drawFakeWaveform(true)
      })
    } else {
      drawFakeWaveform(true)
    }
  }

  const handlePttRelease = () => {
    if (state !== 'TRANSMITTING') return
    
    // Stop recording and voice visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }
    if (bandpassFilterRef.current) {
      bandpassFilterRef.current.disconnect()
      bandpassFilterRef.current = null
    }
    
    stopStaticNoise()
    playSquelch()
    setState('IDLE')

    const msgText = dialedCode.length > 0 
      ? `پیام رادیویی با کد اختصاصی فرستنده ${dialedCode} با موفقیت مخابره شد.`
      : `پیام رادیویی با موفقیت در کانال عمومی ${activeChannel?.label || 'اصلی'} ارسال شد.`

    void transmitMessage(msgText)
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
  }, [state, activeChannel, dialedCode])

  useEffect(() => {
    if (state === 'IDLE') {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = 'rgba(23, 23, 23, 0.4)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.lineWidth = 1
          ctx.strokeStyle = '#10b981'
          ctx.beginPath()
          ctx.moveTo(0, canvas.height / 2)
          ctx.lineTo(canvas.width, canvas.height / 2)
          ctx.stroke()
        }
      }
    }
  }, [state])

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
          <div className={`w-full h-48 rounded-lg border p-3 flex flex-col justify-between transition-all duration-300 relative ${
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
                {dialedCode ? `${formatFarsiNumber(dialedCode)}.۰۰ MHz` : activeChannel ? formatFarsiNumber(activeChannel.code) : ''}
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
                {dialedCode ? `باند فرکانس: ${formatFarsiNumber(dialedCode)}` : activeChannel?.label || ''}
              </span>
              <h2 className="text-xs font-bold text-foreground mt-0.5">
                {state === 'TRANSMITTING'
                  ? 'TRANSMITTING...'
                  : state === 'RECEIVING'
                  ? 'RECEIVING...'
                  : 'READY / آماده'}
              </h2>
            </div>

            {/* Live Audio Visualizer Canvas */}
            <div className="w-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-8 bg-neutral-950/60 rounded border border-border-subtle/20 shadow-inner"
                width={260}
                height={32}
              />
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
            <div className="flex gap-1.5 flex-wrap">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    playSystemTone(500, 0.08)
                    setActiveChannel(ch)
                    setDialedCode('') // reset dialed code to use general channels
                  }}
                  className={`flex-grow py-1.5 px-2 text-[9px] font-semibold rounded-md border transition-all cursor-pointer ${
                    activeChannel?.id === ch.id && dialedCode === ''
                      ? 'bg-accent border-accent text-accent-foreground shadow'
                      : 'bg-surface border-border text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                  }`}
                >
                  {ch.label}
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

          {/* Standard Phrases */}
          {phrases.length > 0 && (
            <div className="w-full mt-4 space-y-1.5 border-t border-border pt-3">
              <span className="text-[10px] font-semibold text-foreground-muted block">پیام‌های سریع:</span>
              <div className="flex flex-col gap-1 w-full">
                {phrases.map((p) => (
                  <button
                    key={p.id}
                    onClick={async () => {
                      if (state !== 'IDLE') return
                      setState('TRANSMITTING')
                      playStartBeep()
                      startStaticNoise()
                      setCurrentTransmittingText(p.text)
                      
                      setTimeout(async () => {
                        await transmitMessage(p.text)
                        stopStaticNoise()
                        playSquelch()
                        setState('IDLE')
                        setCurrentTransmittingText('')
                      }, 2000)
                    }}
                    className="w-full text-start py-1.5 px-2.5 bg-surface-container-low border border-border rounded-md text-[10px] font-medium text-foreground hover:bg-surface-hover hover:border-accent/40 active:scale-[0.98] transition-all truncate cursor-pointer"
                  >
                    ⚡ {p.label}: {p.text}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          {radioLogs.map((log) => (
            <div key={log.id} className="p-3 bg-surface rounded-lg border border-border-subtle space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-[10px] font-semibold text-accent">
                <span>{log.senderName}</span>
                <span className="font-mono text-foreground-muted font-medium">
                  {new Date(log.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-foreground font-semibold leading-relaxed">{log.message}</p>
              <div className="flex justify-between items-center text-[10px] text-foreground-muted pt-1.5 border-t border-border-subtle">
                <span>نوع: {log.kind === 'EMERGENCY' ? 'اضطراری 🚨' : 'عادی'}</span>
                <Badge variant="outline" className="text-[9px] border-accent/20 bg-accent/5 text-accent font-semibold">
                  TETRA Sec
                </Badge>
              </div>
            </div>
          ))}
          {radioLogs.length === 0 && (
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

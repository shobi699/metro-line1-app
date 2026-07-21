import { NotificationType } from '@/generated/prisma/client'

export interface PushMessage {
  title: string
  body: string
  link?: string | null
  severity?: 'info' | 'normal' | 'important' | 'critical'
}

export interface DeviceTarget {
  userId: string
  token: string
  platform: string
}

export interface DeliveryReport {
  success: boolean
  error?: string
  driverMessageId?: string
}

export interface DriverHealth {
  status: 'green' | 'yellow' | 'red'
  lastChecked: Date
  errorCount: number
}

export interface PushDriver {
  key: 'pushe' | 'najva' | 'selfhosted'
  registerDevice(userId: string, token: string, platform: string): Promise<void>
  send(msg: PushMessage, targets: DeviceTarget[]): Promise<DeliveryReport>
  healthCheck(): Promise<DriverHealth>
}

export interface SmsMessage {
  text: string
  to: string[]
}

export interface SmsDriver {
  key: 'kavenegar' | 'melipayamak' | 'smsir'
  send(msg: SmsMessage): Promise<DeliveryReport>
  healthCheck(): Promise<DriverHealth>
}

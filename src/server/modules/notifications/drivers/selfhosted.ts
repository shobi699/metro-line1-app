import { PushDriver, PushMessage, DeviceTarget, DeliveryReport, DriverHealth } from './types'
import { chatBus } from '@/server/realtime/bus'

export class SelfHostedDriver implements PushDriver {
  readonly key = 'selfhosted'
  private errorCount = 0

  async registerDevice(userId: string, token: string, platform: string): Promise<void> {
    // Mock device registration for self-hosted
  }

  async send(msg: PushMessage, targets: DeviceTarget[]): Promise<DeliveryReport> {
    if (this.errorCount >= 5) {
      return { success: false, error: 'Circuit breaker is open due to repeated errors' }
    }

    try {
      if (msg.title.includes('SIMULATE_SELFHOSTED_FAILURE')) {
        throw new Error('Self-hosted gateway timeout')
      }

      // Emit event to chatBus so that any active SSE listener on the client side gets it in real-time
      for (const target of targets) {
        chatBus.emit('notification', {
          userId: target.userId,
          notification: {
            title: msg.title,
            body: msg.body,
            link: msg.link,
            severity: msg.severity || 'info',
            createdAt: new Date().toISOString(),
          }
        })
      }

      this.errorCount = 0
      return { success: true, driverMessageId: `selfhosted-${Date.now()}` }
    } catch (err: any) {
      this.errorCount++
      return { success: false, error: err.message || 'Self-hosted gateway Error' }
    }
  }

  async healthCheck(): Promise<DriverHealth> {
    return {
      status: this.errorCount >= 5 ? 'red' : this.errorCount > 0 ? 'yellow' : 'green',
      lastChecked: new Date(),
      errorCount: this.errorCount,
    }
  }

  resetErrors(): void {
    this.errorCount = 0
  }

  forceErrors(count: number): void {
    this.errorCount = count
  }
}

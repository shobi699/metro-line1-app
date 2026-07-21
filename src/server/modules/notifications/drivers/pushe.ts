import { PushDriver, PushMessage, DeviceTarget, DeliveryReport, DriverHealth } from './types'

export class PusheDriver implements PushDriver {
  readonly key = 'pushe'
  private errorCount = 0

  async registerDevice(userId: string, token: string, platform: string): Promise<void> {
    // Mock registering device token in Pushe
  }

  async send(msg: PushMessage, targets: DeviceTarget[]): Promise<DeliveryReport> {
    if (this.errorCount >= 5) {
      return { success: false, error: 'Circuit breaker is open due to repeated errors' }
    }

    try {
      // Simulate failure on special trigger titles for tests and simulation
      if (msg.title.includes('SIMULATE_PUSHE_FAILURE')) {
        throw new Error('Pushe API error (Connection refused)')
      }

      this.errorCount = 0
      return { success: true, driverMessageId: `pushe-${Date.now()}` }
    } catch (err: any) {
      this.errorCount++
      return { success: false, error: err.message || 'Pushe API Error' }
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

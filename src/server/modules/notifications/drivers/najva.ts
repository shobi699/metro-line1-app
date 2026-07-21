import { PushDriver, PushMessage, DeviceTarget, DeliveryReport, DriverHealth } from './types'

export class NajvaDriver implements PushDriver {
  readonly key = 'najva'
  private errorCount = 0

  async registerDevice(userId: string, token: string, platform: string): Promise<void> {
    // Mock registering device token in Najva
  }

  async send(msg: PushMessage, targets: DeviceTarget[]): Promise<DeliveryReport> {
    if (this.errorCount >= 5) {
      return { success: false, error: 'Circuit breaker is open due to repeated errors' }
    }

    try {
      // Simulate failure on special trigger titles
      if (msg.title.includes('SIMULATE_NAJVA_FAILURE')) {
        throw new Error('Najva API error (Internal Server Error)')
      }

      this.errorCount = 0
      return { success: true, driverMessageId: `najva-${Date.now()}` }
    } catch (err: any) {
      this.errorCount++
      return { success: false, error: err.message || 'Najva API Error' }
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

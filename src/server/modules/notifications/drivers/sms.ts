import { SmsDriver, SmsMessage, DeliveryReport, DriverHealth } from './types'

export class KavenegarDriver implements SmsDriver {
  readonly key = 'kavenegar'
  private errorCount = 0

  async send(msg: SmsMessage): Promise<DeliveryReport> {
    if (this.errorCount >= 5) {
      return { success: false, error: 'Circuit breaker is open' }
    }

    try {
      if (msg.text.includes('SIMULATE_KAVENEGAR_FAILURE')) {
        throw new Error('Kavenegar API connection refused')
      }
      this.errorCount = 0
      return { success: true, driverMessageId: `kave-${Date.now()}` }
    } catch (err: any) {
      this.errorCount++
      return { success: false, error: err.message || 'Kavenegar API Error' }
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
}

export class MeliPayamakDriver implements SmsDriver {
  readonly key = 'melipayamak'
  private errorCount = 0

  async send(msg: SmsMessage): Promise<DeliveryReport> {
    if (this.errorCount >= 5) {
      return { success: false, error: 'Circuit breaker is open' }
    }

    try {
      if (msg.text.includes('SIMULATE_MELIPAYAMAK_FAILURE')) {
        throw new Error('MeliPayamak API internal error')
      }
      this.errorCount = 0
      return { success: true, driverMessageId: `meli-${Date.now()}` }
    } catch (err: any) {
      this.errorCount++
      return { success: false, error: err.message || 'MeliPayamak API Error' }
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
}

export class SmsIrDriver implements SmsDriver {
  readonly key = 'smsir'
  private errorCount = 0

  async send(msg: SmsMessage): Promise<DeliveryReport> {
    if (this.errorCount >= 5) {
      return { success: false, error: 'Circuit breaker is open' }
    }

    try {
      if (msg.text.includes('SIMULATE_SMSIR_FAILURE')) {
        throw new Error('SMS.ir API connection timeout')
      }
      this.errorCount = 0
      return { success: true, driverMessageId: `smsir-${Date.now()}` }
    } catch (err: any) {
      this.errorCount++
      return { success: false, error: err.message || 'SMS.ir API Error' }
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
}

import { Platform } from 'react-native'

// آدرس آی‌پی پیش‌فرض برای اتصال به سرور محلی Next.js
// در اندروید از 10.0.2.2 استفاده می‌شود تا به لوکال‌هاست سیستم میزبان متصل شود.
export const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
})
export const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
})

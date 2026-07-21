import type { R2Bucket } from '../cloudflare-types'
import { localStorageDriver } from './local'
import { createR2Driver } from './r2'

export interface StoredFile {
  url: string
  type: string
}

export interface StorageDriver {
  saveFile(buffer: Buffer | ArrayBuffer, originalName: string, mime: string): Promise<StoredFile>
}

/**
 * انتخاب درایور ذخیره‌سازی. در کلودفلر از R2 و در محیط محلی از دیسک.
 */
export function getStorage(): StorageDriver {
  const r2 = (globalThis as unknown as { R2_BUCKET?: R2Bucket }).R2_BUCKET
  const pubUrl = (globalThis as unknown as { R2_PUBLIC_URL?: string }).R2_PUBLIC_URL

  if (r2 && pubUrl) {
    return createR2Driver({ R2_BUCKET: r2, R2_PUBLIC_URL: pubUrl })
  }

  return localStorageDriver
}

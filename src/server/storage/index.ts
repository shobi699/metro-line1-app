import { localStorageDriver } from './local'

export interface StoredFile {
  url: string
  type: string
}

export interface StorageDriver {
  saveFile(buffer: Buffer, originalName: string, mime: string): Promise<StoredFile>
}

/**
 * انتخاب درایور ذخیره‌سازی. فعلاً دیسک محلی؛ با راه‌اندازی MinIO/S3
 * کافی است درایور دیگری برگردانده شود بدون تغییر فراخوان‌ها.
 */
export function getStorage(): StorageDriver {
  return localStorageDriver
}

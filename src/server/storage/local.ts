import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { StorageDriver, StoredFile } from './index'

const UPLOAD_ROOT = path.resolve(process.cwd(), 'public', 'uploads')

function sanitizeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '')
  return ext.length > 1 && ext.length <= 6 ? ext : ''
}

/** درایور ذخیره‌سازی روی دیسک محلی زیر public/uploads. */
export const localStorageDriver: StorageDriver = {
  async saveFile(buffer, originalName, mime): Promise<StoredFile> {
    const now = new Date()
    const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const dir = path.join(UPLOAD_ROOT, folder)
    await mkdir(dir, { recursive: true })

    const fileName = `${crypto.randomUUID()}${sanitizeExt(originalName)}`
    const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
    await writeFile(path.join(dir, fileName), data)

    return {
      url: `/uploads/${folder}/${fileName}`,
      type: mime,
    }
  },
}

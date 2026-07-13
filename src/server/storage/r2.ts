import type { R2Bucket } from '../cloudflare-types'
import type { StorageDriver, StoredFile } from './index'

interface R2Env {
  R2_BUCKET: R2Bucket
  R2_PUBLIC_URL: string
}

export function createR2Driver(env: R2Env): StorageDriver {
  return {
    async saveFile(buffer: ArrayBuffer | Buffer, originalName: string, mime: string): Promise<StoredFile> {
      const ext = (originalName.split('.').pop() ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 6)

      const now = new Date()
      const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const key = `uploads/${folder}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`

      const uploadData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer)

      await env.R2_BUCKET.put(key, uploadData, {
        httpMetadata: { contentType: mime },
      })

      return {
        url: `${env.R2_PUBLIC_URL}/${key}`,
        type: mime,
      }
    },
  }
}

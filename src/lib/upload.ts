export interface UploadOptions {
  file: File;
  token?: string;
  onProgress?: (percent: number) => void;
}

export function uploadFileWithProgress({ file, token, onProgress }: UploadOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.open('POST', '/api/uploads', true)
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        onProgress(percentComplete)
      }
    }

    xhr.onload = () => {
      let data: any = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch (e) {
        // ignore
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (data?.data?.url) {
          resolve(data.data.url)
        } else {
          reject(new Error('پاسخ نامعتبر از سرور'))
        }
      } else {
        reject(new Error(data?.error || `خطا در آپلود فایل (${xhr.status})`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('خطا در اتصال به سرور'))
    }

    xhr.send(formData)
  })
}

import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { API_URL, BASE_URL } from './config'
import { useAuthStore } from '../stores/auth'
import { Platform } from 'react-native'

export interface UploadResult {
  url: string
  type: string
}

export async function pickAndUploadImage(
  useCamera: boolean = false
): Promise<UploadResult | null> {
  let result: ImagePicker.ImagePickerResult

  if (useCamera) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      alert('دسترسی به دوربین داده نشده است.')
      return null
    }
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    })
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      alert('دسترسی به گالری داده نشده است.')
      return null
    }
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    })
  }

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null
  }

  const asset = result.assets[0]
  return uploadAsset(asset.uri, asset.mimeType || 'image/jpeg', asset.fileName || 'upload.jpg')
}

export async function pickAndUploadDocument(): Promise<UploadResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*', 'video/*', 'audio/*'],
    copyToCacheDirectory: true,
  })

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null
  }

  const asset = result.assets[0]
  return uploadAsset(asset.uri, asset.mimeType || 'application/octet-stream', asset.name)
}

async function uploadAsset(uri: string, mimeType: string, fileName: string): Promise<UploadResult | null> {
  const token = useAuthStore.getState().accessToken
  if (!token) {
    alert('شما وارد نشده‌اید.')
    return null
  }

  const formData = new FormData()
  
  if (Platform.OS === 'web') {
    try {
      const res = await fetch(uri)
      const blob = await res.blob()
      formData.append('file', blob, fileName)
    } catch {
      alert('خطا در خواندن فایل')
      return null
    }
  } else {
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as any)
  }

  try {
    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json()
      alert(err.error || 'خطا در آپلود فایل')
      return null
    }

    const json = await response.json()
    const url = json.data.url
    
    // Convert relative URL to absolute if needed
    const finalUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url
    
    return {
      url: finalUrl,
      type: json.data.type || mimeType,
    }
  } catch (err) {
    console.error('Upload Error:', err)
    alert('خطا در اتصال به سرور جهت آپلود')
    return null
  }
}

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// آدرس دامنه پیش‌فرض سرور ریلیز
const DEFAULT_PRODUCTION_URL = 'https://metro.qzz.io'
const LOCAL_PORT = '3000'

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return `http://localhost:${LOCAL_PORT}`
    }
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${LOCAL_PORT}`
    }
    return `http://localhost:${LOCAL_PORT}`
  }
  // در حالت ریلیز، آدرس دامنه رسمی متصل به کلودفلر فراخوانی می‌شود
  return DEFAULT_PRODUCTION_URL
}

export let BASE_URL = getBaseUrl()
export let API_URL = `${BASE_URL}/api`

// تابع لود کردن آدرس ذخیره شده از حافظه
export async function loadSavedConfigUrl() {
  try {
    const saved = await AsyncStorage.getItem('custom_api_url')
    if (saved) {
      BASE_URL = saved
      API_URL = `${saved}/api`
    }
  } catch (e) {
    // خطای خواندن نادیده گرفته می‌شود
  }
}

// تابع به‌روزرسانی زنده آدرس سرور
export async function setApiUrl(newUrl: string) {
  BASE_URL = newUrl
  API_URL = `${newUrl}/api`
  await AsyncStorage.setItem('custom_api_url', newUrl)
}

// لود کردن اولیه به صورت خودکار
void loadSavedConfigUrl()

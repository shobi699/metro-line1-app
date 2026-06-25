import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'

export function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!nationalId || !password) {
      setError('لطفاً تمامی فیلدها را پر کنید.')
      return
    }
    if (nationalId.length !== 10) {
      setError('کد ملی باید ۱۰ رقم باشد.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'خطا در ورود به سیستم')
        return
      }

      if (data.user.status === 'pending') {
        setError('حساب کاربری شما در انتظار تأیید مدیر است.')
        return
      }

      if (data.user.status === 'suspended') {
        setError('حساب کاربری شما مسدود شده است.')
        return
      }

      await setAuth(data.user, data.accessToken, data.refreshToken)
    } catch (err: any) {
      setError('خطا در اتصال به سرور. لطفاً شبکه خود را بررسی کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View className="items-center" style={styles.header}>
          <Text style={styles.title}>مترو تهران</Text>
          <Text style={styles.subtitle}>سیر و حرکت خط یک</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>ورود به سیستم</Text>
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>کد ملی</Text>
            <TextInput
              style={styles.input}
              value={nationalId}
              onChangeText={setNationalId}
              placeholder="مثال: ۰۰۱۲۳۴۵۶۷۸"
              placeholderTextColor="#555860"
              keyboardType="number-pad"
              maxLength={10}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>رمز عبور</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#555860"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>ورود به حساب</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#e53935', // قرمز خط ۱
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#1c1e24',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262930',
  },
  formTitle: {
    fontSize: 18,
    color: '#f2f2f7',
    marginBottom: 20,
    textAlign: 'right',
    fontWeight: '600',
  },
  errorText: {
    color: '#e53935',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'right',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    padding: 10,
    borderRadius: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#a0a3b0',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#13151a',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    color: '#f2f2f7',
    paddingHorizontal: 16,
    textAlign: 'right',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#e53935', // قرمز برند خط ۱
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
export default LoginScreen

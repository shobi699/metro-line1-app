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
  Modal,
  Alert,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { API_URL, BASE_URL, setApiUrl } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'

export function LoginScreen() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [nationalId, setNationalId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [tempUrl, setTempUrl] = useState(BASE_URL)
  const { theme } = useTheme()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      color: theme.colors.primary,
      textAlign: 'center',
      fontFamily: theme.typography.screenTitle.fontFamily,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginTop: 8,
      textAlign: 'center',
      fontWeight: '600',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    formCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.xl,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.level1,
    },
    formTitle: {
      fontSize: 18,
      color: theme.colors.onSurface,
      marginBottom: 20,
      textAlign: 'right',
      fontWeight: '700',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 13,
      marginBottom: 16,
      textAlign: 'right',
      backgroundColor: theme.colors.errorContainer,
      padding: 10,
      borderRadius: theme.borderRadius.md,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      color: theme.colors.secondary,
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'right',
      fontWeight: '600',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    input: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      height: 48,
      color: theme.colors.onSurface,
      paddingHorizontal: 16,
      textAlign: 'right',
      fontSize: 15,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      ...theme.shadows.level1,
    },
    buttonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    settingsButtonContainer: {
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 10,
    },
    settingsButton: {
      padding: 10,
      borderRadius: 99,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.xl,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.level2,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 16,
      textAlign: 'right',
      fontFamily: theme.typography.screenTitle.fontFamily,
    },
    modalLabel: {
      color: theme.colors.secondary,
      fontSize: 14,
      marginBottom: 8,
      textAlign: 'right',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    modalInput: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      height: 48,
      color: theme.colors.onSurface,
      paddingHorizontal: 16,
      textAlign: 'left',
      fontSize: 15,
      fontFamily: theme.typography.bodyMd.fontFamily,
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalBtn: {
      flex: 1,
      height: 48,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBtnSave: {
      backgroundColor: theme.colors.primary,
    },
    modalBtnCancel: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalBtnText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 15,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    modalBtnTextCancel: {
      color: theme.colors.text,
      fontWeight: 'bold',
      fontSize: 15,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
  })

  async function handleSaveSettings() {
    await setApiUrl(tempUrl)
    setShowSettings(false)
    Alert.alert('تغییر سرور', `آدرس سرور با موفقیت به ${tempUrl} تغییر یافت.`)
  }

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
      {/* دکمه تنظیمات سرور */}
      <View style={styles.settingsButtonContainer}>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton} activeOpacity={0.7}>
          <MaterialIcons name="settings" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
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
              placeholderTextColor={theme.colors.secondary}
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
              placeholderTextColor={theme.colors.secondary}
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
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>ورود به حساب</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* مودال تنظیمات آدرس سرور */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تنظیمات آدرس سرور (API)</Text>
            <Text style={styles.modalLabel}>آدرس کامل سرور:</Text>
            <TextInput
              style={styles.modalInput}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder="http://10.140.176.26:3000"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveSettings} activeOpacity={0.8}>
                <Text style={styles.modalBtnText}>ذخیره</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowSettings(false)} activeOpacity={0.8}>
                <Text style={styles.modalBtnTextCancel}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

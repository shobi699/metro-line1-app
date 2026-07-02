import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { Bot, Send, HelpCircle } from 'lucide-react-native'

interface Message {
  id: number
  text: string
  isUser: boolean
}

import { useTheme } from '../shared/ThemeProvider'

import { ScreenWrapper } from '../shared/ScreenWrapper'

export function AIAssistantScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'سلام! من دستیار هوشمند عملیاتی خط ۱ مترو تهران هستم. چطور می‌توانم در عیب‌یابی قطار یا مقررات سیر و حرکت به شما کمک کنم؟\n\nمی‌توانید کدهای خطا مانند E102 (درب‌ها)، E205 (موتور)، V301 (تهویه) یا ATP (سیگنالینگ) را وارد کنید.',
      isUser: false,
    },
  ])
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()

  async function handleSend() {
    if (!inputText.trim() || loading) return

    const userText = inputText.trim()
    const userMsg: Message = {
      id: Date.now(),
      text: userText,
      isUser: true,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ prompt: userText }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.data.reply,
            isUser: false,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: 'متأسفانه خطایی رخ داد. مجدداً تلاش نمایید.',
            isUser: false,
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'خطا در ارتباط با سرور. لطفاً اتصال شبکه خود را بررسی نمایید.',
          isUser: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    messagesList: {
      padding: 16,
      paddingBottom: 24,
    },
    messageBubble: {
      maxWidth: '85%',
      padding: 14,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 16,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.surfaceContainer,
      borderBottomRightRadius: 2,
    },
    botBubble: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: 2,
      ...theme.shadows.level1,
    },
    botBadge: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      alignSelf: 'flex-end',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginBottom: 8,
    },
    botBadgeText: {
      fontSize: 10,
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    messageText: {
      color: theme.colors.onSurface,
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    loadingBubble: {
      width: 60,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
    },
    inputBar: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    messageInput: {
      flex: 1,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 20,
      height: 40,
      paddingHorizontal: 16,
      fontSize: 14,
      marginRight: 8,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
      ...theme.shadows.level1,
    },
    sendIconFlipped: {
      transform: [{ scaleX: -1 }],
    },
  })

  return (
    <ScreenWrapper title="دستیار هوشمند قوانین و عیب‌یابی" navigation={navigation}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.messagesList}
          ref={(ref) => ref?.scrollToEnd({ animated: true })}
        >
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageBubble,
                item.isUser ? styles.userBubble : styles.botBubble,
              ]}
            >
              {!item.isUser && (
                <View style={styles.botBadge}>
                  <Bot size={12} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                  <Text style={styles.botBadgeText}>هوش مصنوعی</Text>
                </View>
              )}
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          ))}
          {loading && (
            <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </ScrollView>

        {/* باکس ارسال پیام */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="شرح عیب یا کد خطا را وارد کنید..."
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
            <Send size={18} color={theme.colors.onPrimary} style={styles.sendIconFlipped} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default AIAssistantScreen

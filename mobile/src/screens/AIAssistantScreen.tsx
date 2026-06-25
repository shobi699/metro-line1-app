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

export function AIAssistantScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'سلام! من دستیار هوشمند عملیاتی خط ۱ مترو تهران هستم. چطور می‌توانم در عیب‌یابی قطار یا مقررات سیر و حرکت به شما کمک کنم؟\n\nمی‌توانید کدهای خطا مانند **E102** (درب‌ها)، **E205** (موتور)، **V301** (تهویه) یا **ATP** (سیگنالینگ) را وارد کنید.',
      isUser: false,
    },
  ])
  const [loading, setLoading] = useState(false)

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      <View style={styles.header}>
        <Bot size={24} color="#e53935" />
        <Text style={styles.headerTitle}>دستیار هوشمند قوانین و عیب‌یابی</Text>
      </View>

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
                <Bot size={12} color="#ffffff" style={{ marginLeft: 4 }} />
                <Text style={styles.botBadgeText}>هوش مصنوعی</Text>
              </View>
            )}
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#e53935" />
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
          placeholderTextColor="#555860"
          textAlign="right"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          <Send size={18} color="#ffffff" style={styles.sendIconFlipped} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
  },
  header: {
    height: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    gap: 8,
    backgroundColor: '#1c1e24',
  },
  headerTitle: {
    fontSize: 15,
    color: '#f2f2f7',
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3a3f4d',
    borderBottomRightRadius: 2,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1c1e24',
    borderWidth: 1,
    borderColor: '#262930',
    borderBottomLeftRadius: 2,
  },
  botBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#e53935',
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  botBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  messageText: {
    color: '#f2f2f7',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
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
    borderTopColor: '#262930',
    backgroundColor: '#1c1e24',
  },
  messageInput: {
    flex: 1,
    color: '#f2f2f7',
    backgroundColor: '#13151a',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 16,
    fontSize: 14,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sendIconFlipped: {
    transform: [{ scaleX: -1 }],
  },
})
export default AIAssistantScreen

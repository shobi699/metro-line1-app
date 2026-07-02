import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  SafeAreaView
} from 'react-native'
import { useTheme } from '../shared/ThemeProvider'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { DynamicRenderer, ComponentSchema } from '../shared/DynamicRenderer'
import { AlertTriangle } from 'lucide-react-native'
import { handleDynamicNavigation } from '../shared/navigation-helper'

export function CustomPageScreen({ route, navigation }: any) {
  const { slug } = route.params || {}
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pageData, setPageData] = useState<{ title: string; components: ComponentSchema[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadPageSchema = async () => {
    if (!slug) return
    try {
      const headers: Record<string, string> = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      const res = await fetch(`${API_URL}/ui/pages/${slug}`, { headers })
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات صفحه')
      const json = await res.json()
      setPageData(json.data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری صفحه')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    loadPageSchema()
  }, [slug, accessToken])

  useEffect(() => {
    if (!navigation) return
    const unsubscribe = navigation.addListener('focus', () => {
      void loadPageSchema()
    })
    return unsubscribe
  }, [navigation, slug])

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    errorText: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.error, marginTop: 8 },
  })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (error || !pageData) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={40} color={theme.colors.error} />
        <Text style={styles.errorText}>{error || 'صفحه یافت نشد'}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void loadPageSchema()
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <DynamicRenderer
          components={pageData.components}
          onAction={(action) => {
            if (action?.type === 'navigate') {
              handleDynamicNavigation(navigation, action.target)
            }
          }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

export default CustomPageScreen

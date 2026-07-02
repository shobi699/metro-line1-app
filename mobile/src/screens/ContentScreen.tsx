import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Newspaper, BookOpen, GraduationCap } from 'lucide-react-native'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { API_URL } from '../shared/config'

interface Post {
  id: string
  title: string
  excerpt: string
  type: string
  createdAt: string
}

export function ContentScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  const TYPE_ICONS: Record<string, React.ReactNode> = {
    news: <Newspaper size={16} color={theme.colors.primary} />,
    training: <GraduationCap size={16} color={theme.colors.info} />,
    circular: <BookOpen size={16} color={theme.colors.warning} />,
  }

  useEffect(() => {
    if (!accessToken) return
    fetch(`${API_URL}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((json) => {
        setPosts(json?.data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [accessToken])

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    title: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary, fontFamily: theme.typography.screenTitle.fontFamily },
    list: { padding: 16, paddingTop: 12 },
    card: { 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderRadius: theme.borderRadius.xl, 
      padding: 16, 
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.level1,
    },
    cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 8 },
    cardType: { fontSize: 11, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '700' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.onSurface, marginBottom: 4, textAlign: 'right', fontFamily: theme.typography.cardTitle.fontFamily },
    cardExcerpt: { fontSize: 13, color: theme.colors.secondary, lineHeight: 20, textAlign: 'right', fontFamily: theme.typography.bodyMd.fontFamily },
    emptyText: { fontSize: 14, color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily },
  })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Newspaper size={24} color={theme.colors.primary} />
        <Text style={styles.title}>محتوا و اخبار</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              {TYPE_ICONS[item.type] || TYPE_ICONS.news}
              <Text style={styles.cardType}>{item.type === 'news' ? 'اخبار' : item.type === 'training' ? 'آموزش' : 'بخشنامه'}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>محتوایی موجود نیست</Text>
          </View>
        }
      />
    </View>
  )
}

export default ContentScreen

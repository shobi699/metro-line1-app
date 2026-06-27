import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { Newspaper, BookOpen, GraduationCap } from 'lucide-react-native'
import { useAuthStore } from '../stores/auth'
import { Theme } from '../shared/theme'
import { API_URL } from '../shared/config'

interface Post {
  id: string
  title: string
  excerpt: string
  type: string
  createdAt: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  news: <Newspaper size={16} color={Theme.colors.accent} />,
  training: <GraduationCap size={16} color={Theme.colors.info} />,
  circular: <BookOpen size={16} color={Theme.colors.warning} />,
}

export function ContentScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Newspaper size={24} color={Theme.colors.accent} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Theme.spacing.lg },
  title: { fontSize: Theme.fontSize.xl, fontWeight: 'bold', color: Theme.colors.text },
  list: { padding: Theme.spacing.lg, paddingTop: 0 },
  card: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardType: { fontSize: Theme.fontSize.xs, color: Theme.colors.textMuted },
  cardTitle: { fontSize: Theme.fontSize.lg, fontWeight: 'bold', color: Theme.colors.text, marginBottom: 4 },
  cardExcerpt: { fontSize: Theme.fontSize.sm, color: Theme.colors.textSecondary, lineHeight: 20 },
  emptyText: { fontSize: Theme.fontSize.md, color: Theme.colors.textMuted },
})

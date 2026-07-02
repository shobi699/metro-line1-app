import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  RefreshControl
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { API_URL } from '../shared/config'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface Post {
  id: string
  title: string
  body: string
  excerpt: string
  type: string // 'news' | 'training' | 'circular'
  category?: string
  createdAt: string
  mandatory?: boolean
}

export function ContentScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { theme } = useTheme()

  // Selected article detail state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    void loadPosts()
  }, [accessToken])

  const loadPosts = async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setPosts(json?.data ?? [])
      }
    } catch (err) {
      console.error('Error fetching posts:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    void loadPosts()
  }

  const mapTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return 'newspaper'
      case 'training': return 'school'
      case 'circular': return 'assignment'
      default: return 'article'
    }
  }

  const mapTypeLabel = (type: string) => {
    switch (type) {
      case 'news': return 'اخبار و رویدادها'
      case 'training': return 'محتوای آموزشی'
      case 'circular': return 'بخشنامه‌های ابلاغی'
      default: return 'سند اداری'
    }
  }

  const mapTypeColor = (type: string) => {
    switch (type) {
      case 'news': return theme.colors.primary
      case 'training': return '#166534'
      case 'circular': return '#d97706'
      default: return theme.colors.secondary
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    list: {
      padding: 16,
      paddingTop: 12,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.xl,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    cardHeaderRight: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    cardType: {
      fontSize: 11,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '700',
    },
    mandatoryBadge: {
      backgroundColor: theme.colors.errorContainer + '40',
      borderColor: theme.colors.error,
      borderWidth: 0.5,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    mandatoryText: {
      fontSize: 9.5,
      color: theme.colors.error,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    cardTitle: {
      fontSize: 14.5,
      fontWeight: '800',
      color: theme.colors.onSurface,
      marginBottom: 6,
      textAlign: 'right',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    cardExcerpt: {
      fontSize: 12.5,
      color: theme.colors.secondary,
      lineHeight: 20,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 100,
    },
    emptyText: {
      fontSize: 13,
      color: theme.colors.secondary,
      fontFamily: theme.typography.bodyMd.fontFamily,
      marginTop: 8,
    },
    // Modal Detail Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    modalDismiss: {
      flex: 1,
    },
    modalContent: {
      maxHeight: Dimensions.get('window').height * 0.85,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl * 1.5,
      borderTopRightRadius: theme.borderRadius.xl * 1.5,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    modalIndicator: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    modalHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'right',
      flex: 1,
      marginLeft: 12,
    },
    modalCloseBtn: {
      padding: 6,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    metaRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
      paddingBottom: 12,
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.secondary,
    },
    bodyScroll: {
      marginVertical: 4,
    },
    modalBody: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13.5,
      color: theme.colors.onSurface,
      lineHeight: 24,
      textAlign: 'right',
    },
    confirmBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    confirmBtnText: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    }
  })

  return (
    <ScreenWrapper title="محتوا و اخبار خط ۱" navigation={navigation}>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 100 }} />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
            renderItem={({ item }) => {
              const typeColor = mapTypeColor(item.type)
              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => setSelectedPost(item)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderRight}>
                      <MaterialIcons name={mapTypeIcon(item.type) as any} size={15} color={typeColor} />
                      <Text style={[styles.cardType, { color: typeColor }]}>{mapTypeLabel(item.type)}</Text>
                    </View>
                    {item.mandatory && (
                      <View style={styles.mandatoryBadge}>
                        <Text style={styles.mandatoryText}>ابلاغیه ایمنی</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={styles.center}>
                <MaterialIcons name="article" size={48} color={theme.colors.secondary + '75'} />
                <Text style={styles.emptyText}>محتوایی موجود نیست</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Article Detail Slide-Up Modal */}
      <Modal
        visible={selectedPost !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setSelectedPost(null)} />
          <View style={styles.modalContent}>
            <View style={styles.modalIndicator} />
            
            {selectedPost && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedPost(null)}>
                    <MaterialIcons name="close" size={20} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="label" size={13} color={mapTypeColor(selectedPost.type)} />
                    <Text style={[styles.metaText, { color: mapTypeColor(selectedPost.type), fontWeight: '700' }]}>
                      {mapTypeLabel(selectedPost.type)}
                    </Text>
                  </View>
                  {selectedPost.category && (
                    <View style={styles.metaItem}>
                      <MaterialIcons name="folder" size={13} color={theme.colors.secondary} />
                      <Text style={styles.metaText}>{selectedPost.category}</Text>
                    </View>
                  )}
                  <View style={styles.metaItem}>
                    <MaterialIcons name="event" size={13} color={theme.colors.secondary} />
                    <Text style={styles.metaText}>
                      {new Date(selectedPost.createdAt).toLocaleDateString('fa-IR')}
                    </Text>
                  </View>
                </View>

                <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalBody}>{selectedPost.body || selectedPost.excerpt}</Text>
                </ScrollView>

                <TouchableOpacity style={styles.confirmBtn} onPress={() => setSelectedPost(null)}>
                  <Text style={styles.confirmBtnText}>بستن و بازگشت</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default ContentScreen

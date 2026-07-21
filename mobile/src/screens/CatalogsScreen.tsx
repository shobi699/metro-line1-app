import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { Book, ChevronLeft, Search, FileText } from 'lucide-react-native'
import { WebView } from 'react-native-webview'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { useTheme } from '../shared/ThemeProvider'

export function CatalogsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCatalog, setSelectedCatalog] = useState<any>(null)

  useEffect(() => {
    fetchCatalogs()
  }, [])

  async function fetchCatalogs() {
    if (!accessToken) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/catalogs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCatalogs(data.data || [])
      }
    } catch (e) {
      console.warn('Failed to fetch catalogs', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = catalogs.filter(c => 
    c.title.includes(search) || 
    (c.description && c.description.includes(search)) ||
    (c.tags && c.tags.some((t: string) => t.includes(search)))
  )

  const mermaidHtml = selectedCatalog ? `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body { 
          background: transparent; 
          margin: 0; 
          padding: 10px; 
          display: flex; 
          justify-content: center; 
          color: white;
          font-family: 'Vazirmatn', Tahoma, sans-serif;
        }
        .mermaid { font-family: 'Vazirmatn', Tahoma, sans-serif; }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
      <script>
        mermaid.initialize({ 
          startOnLoad: true,
          theme: 'dark',
          flowchart: {
            curve: 'monotoneX',
            nodeSpacing: 50,
            rankSpacing: 50,
            htmlLabels: true
          },
          fontFamily: "'Vazirmatn', Tahoma, sans-serif"
        });
      </script>
    </head>
    <body>
      <div class="mermaid">
        ${selectedCatalog.content}
      </div>
    </body>
    </html>
  ` : ''

  if (selectedCatalog) {
    return (
      <ScreenWrapper title={selectedCatalog.title} navigation={navigation}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSelectedCatalog(null)} style={styles.backBtn}>
            <Text style={{ color: theme.colors.primary, fontFamily: 'Vazirmatn_700Bold' }}>← بازگشت به لیست</Text>
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: mermaidHtml }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          scalesPageToFit={false}
        />
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper title="کاتالوگ فنی و راهنما" navigation={navigation}>
      <View style={styles.container}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
          placeholder="جستجو در کاتالوگ‌ها (مثلاً: درب، حریق...)"
          placeholderTextColor={theme.colors.surfaceVariant}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {filtered.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.card, { backgroundColor: theme.colors.card }]}
                onPress={() => setSelectedCatalog(cat)}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{cat.title}</Text>
                  {cat.source === 'ai_generated' && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                {cat.description && (
                  <Text style={[styles.cardDesc, { color: theme.colors.surfaceVariant }]}>{cat.description}</Text>
                )}
                <View style={styles.tagsRow}>
                  {cat.tags && cat.tags.map((tag: string, idx: number) => (
                    <View key={idx} style={[styles.tag, { backgroundColor: theme.colors.background }]}>
                      <Book size={18} color={theme.colors.outline} />
                      <Text style={[styles.tagText, { color: theme.colors.surfaceVariant }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <Text style={[styles.emptyText, { color: theme.colors.surfaceVariant }]}>کاتالوگی یافت نشد.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'flex-start',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  searchInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Vazirmatn_400Regular',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 16,
    flex: 1,
  },
  aiBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  aiBadgeText: {
    color: '#eab308',
    fontSize: 10,
    fontFamily: 'Vazirmatn_700Bold',
  },
  cardDesc: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 11,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Vazirmatn_400Regular',
  },
})

import React, { useState, useCallback, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
  Animated,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface SearchResult {
  id: string
  name: string
  phone: string | null
  email: string | null
  role: { name: string; key: string }
  customFields: Record<string, unknown> | null
}

/** Parse a flat carPlate string "12 ب 345 ایران 11" into parts */
function parsePlateString(plate: string): { num1: string; letter: string; num2: string; city: string } | null {
  const parts = plate.trim().split(/\s+/)
  if (parts.length >= 5) {
    return { num1: parts[0], letter: parts[1], num2: parts[2], city: parts[4] }
  }
  // Try compact format
  const cleaned = plate.replace(/\s+/g, '').replace('ایران', '')
  const match = cleaned.match(/^(\d{2})([آ-ی]+)(\d{3})(\d{2})$/)
  if (match) {
    return { num1: match[1], letter: match[2], num2: match[3], city: match[4] }
  }
  return null
}

export function PlateSearchScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [searchText, setSearchText] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim() || !accessToken) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(
        `${API_URL}/users?plate=${encodeURIComponent(query.trim())}&pageSize=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      if (res.ok) {
        const json = await res.json()
        setResults(json.data?.users || [])
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const handleSearchChange = (text: string) => {
    setSearchText(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(text), 400)
  }

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`)
  }

  // Render a graphical plate component (read-only display)
  function renderPlate(plateStr: string) {
    const parsed = parsePlateString(plateStr)
    if (!parsed) {
      return (
        <View style={s.plateFallback}>
          <Text style={s.plateFallbackText}>{plateStr}</Text>
        </View>
      )
    }

    return (
      <View style={s.plate}>
        {/* Blue bar with flag */}
        <View style={s.plateBlue}>
          <View style={s.plateFlag}>
            <View style={{ height: 2, backgroundColor: '#4CAF50', width: 10 }} />
            <View style={{ height: 2, backgroundColor: '#FFFFFF', width: 10 }} />
            <View style={{ height: 2, backgroundColor: '#F44336', width: 10 }} />
          </View>
          <Text style={s.plateIR}>I.R.</Text>
          <Text style={s.plateIR}>IRAN</Text>
        </View>

        {/* Numbers + Letter */}
        <Text style={s.plateDigit}>{parsed.num1}</Text>
        <View style={s.plateLetterBox}>
          <Text style={s.plateLetterChar}>{parsed.letter}</Text>
        </View>
        <Text style={[s.plateDigit, { width: 36 }]}>{parsed.num2}</Text>

        {/* Divider */}
        <View style={s.plateSep} />

        {/* City code */}
        <View style={s.plateCity}>
          <Text style={s.plateCityLabel}>ایران</Text>
          <Text style={s.plateCityNum}>{parsed.city}</Text>
        </View>
      </View>
    )
  }

  function renderResultItem({ item }: { item: SearchResult }) {
    const cf = item.customFields || {} as Record<string, unknown>
    const carPlate = (cf.carPlate as string) || ''
    const carType = (cf.carType as string) || ''
    const carColor = (cf.carColor as string) || ''
    const personnelNo = (cf.personnelNo as string) || ''

    return (
      <View style={s.card}>
        {/* Top row: name + role */}
        <View style={s.cardHeader}>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{item.role.name}</Text>
          </View>
          <Text style={s.nameText}>{item.name}</Text>
        </View>

        {/* Graphical plate */}
        {carPlate ? (
          <View style={s.plateRow}>
            {renderPlate(carPlate)}
          </View>
        ) : null}

        {/* Vehicle details */}
        <View style={s.detailsBlock}>
          {carType ? (
            <View style={s.detailRow}>
              <Text style={s.detailVal}>{carType}</Text>
              <View style={s.detailLabelRow}>
                <MaterialIcons name="directions-car" size={14} color={theme.colors.secondary} />
                <Text style={s.detailLabel}>نوع خودرو</Text>
              </View>
            </View>
          ) : null}
          {carColor ? (
            <View style={s.detailRow}>
              <Text style={s.detailVal}>{carColor}</Text>
              <View style={s.detailLabelRow}>
                <MaterialIcons name="palette" size={14} color={theme.colors.secondary} />
                <Text style={s.detailLabel}>رنگ</Text>
              </View>
            </View>
          ) : null}
          {personnelNo ? (
            <View style={s.detailRow}>
              <Text style={s.detailVal}>{personnelNo}</Text>
              <View style={s.detailLabelRow}>
                <MaterialIcons name="badge" size={14} color={theme.colors.secondary} />
                <Text style={s.detailLabel}>شماره پرسنلی</Text>
              </View>
            </View>
          ) : null}
          {item.phone ? (
            <View style={[s.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={[s.detailVal, { color: theme.colors.primary }]}>{item.phone}</Text>
              <View style={s.detailLabelRow}>
                <MaterialIcons name="phone" size={14} color={theme.colors.secondary} />
                <Text style={s.detailLabel}>شماره تماس</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Action buttons */}
        {item.phone ? (
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: theme.colors.success }]}
              onPress={() => handleCall(item.phone!)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="phone" size={16} color="#ffffff" />
              <Text style={s.actionText}>تماس مستقیم</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('چت', { dm: item.id })}
              activeOpacity={0.7}
            >
              <MaterialIcons name="chat" size={16} color="#ffffff" />
              <Text style={s.actionText}>ارسال پیام</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    )
  }

  const s = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.containerMargin,
    },

    // Hero header
    heroSection: {
      alignItems: 'center',
      paddingVertical: 20,
      marginBottom: 8,
    },
    heroIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      ...theme.shadows.level1,
    },
    heroTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 4,
    },
    heroDesc: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 12,
      color: theme.colors.secondary,
      textAlign: 'center',
    },

    // Search bar
    searchContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1.5,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.xl,
      paddingHorizontal: 14,
      height: 52,
      marginBottom: 20,
      ...theme.shadows.level1,
    },
    searchContainerFocused: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    searchIcon: {
      marginLeft: 8,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
      height: '100%',
      textAlign: 'right',
    },
    clearBtn: {
      padding: 4,
      marginRight: 4,
    },

    // Hint box
    hintBox: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.xl,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    hintTitle: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    hintText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12,
      color: theme.colors.secondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    hintPlateDemo: {
      marginTop: 16,
      marginBottom: 8,
    },

    // Stats badge
    statsBadge: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 12,
      alignSelf: 'flex-end',
    },
    statsText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '700',
    },

    // Result cards
    card: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.xl,
      padding: 16,
      marginBottom: 12,
      ...theme.shadows.level1,
    },
    cardHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    roleBadge: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    roleText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      fontWeight: 'bold',
    },
    nameText: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    plateRow: {
      alignItems: 'center',
      marginBottom: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.md,
    },
    detailsBlock: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
      paddingTop: 8,
    },
    detailRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    detailLabelRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
    },
    detailLabel: {
      color: theme.colors.secondary,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12,
    },
    detailVal: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      height: 40,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.level1,
    },
    actionText: {
      color: '#ffffff',
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 12,
      fontWeight: 'bold',
    },

    // Graphical plate styles
    plate: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderColor: '#000000',
      borderRadius: 5,
      height: 36,
      overflow: 'hidden',
    },
    plateFallback: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    plateFallbackText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000000',
      fontFamily: 'Vazirmatn',
    },
    plateBlue: {
      width: 18,
      height: '100%',
      backgroundColor: '#062B90',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 1,
    },
    plateFlag: {
      flexDirection: 'column',
      gap: 1,
      marginBottom: 2,
    },
    plateIR: {
      color: '#ffffff',
      fontSize: 5,
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
    plateDigit: {
      width: 28,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000000',
      fontFamily: 'Vazirmatn',
    },
    plateLetterBox: {
      width: 32,
      height: '100%',
      backgroundColor: '#f1f5f9',
      borderLeftWidth: 0.5,
      borderRightWidth: 0.5,
      borderColor: '#cbd5e1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    plateLetterChar: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#000000',
      fontFamily: 'Vazirmatn',
    },
    plateSep: {
      width: 1,
      height: '100%',
      backgroundColor: '#000000',
    },
    plateCity: {
      width: 34,
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
    },
    plateCityLabel: {
      fontSize: 5,
      fontWeight: '700',
      color: '#475569',
      fontFamily: 'Vazirmatn',
    },
    plateCityNum: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#000000',
      fontFamily: 'Vazirmatn',
    },

    // Loader + empty
    centerBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.errorContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    emptyDesc: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 12,
      color: theme.colors.secondary,
      textAlign: 'center',
    },
    listContent: {
      paddingBottom: 30,
    },
  })

  const [isFocused, setIsFocused] = useState(false)

  return (
    <ScreenWrapper title="جستجوی پلاک خودرو" navigation={navigation}>
      <View style={s.container}>
        {/* Hero */}
        <View style={s.heroSection}>
          <View style={s.heroIconContainer}>
            <MaterialIcons name="directions-car" size={30} color={theme.colors.primary} />
          </View>
          <Text style={s.heroTitle}>جستجوی شماره پلاک خودرو</Text>
          <Text style={s.heroDesc}>بخشی از شماره پلاک را وارد کنید تا مالک و شماره تماس پیدا شود</Text>
        </View>

        {/* Search bar */}
        <View style={[s.searchContainer, isFocused && s.searchContainerFocused]}>
          <MaterialIcons name="search" size={22} color={isFocused ? theme.colors.primary : theme.colors.secondary} style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            value={searchText}
            onChangeText={handleSearchChange}
            placeholder="شماره پلاک، حرف یا کد شهر..."
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(searchText)}
          />
          {searchText ? (
            <TouchableOpacity style={s.clearBtn} onPress={() => { setSearchText(''); setResults([]); setSearched(false) }}>
              <MaterialIcons name="close" size={18} color={theme.colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Content */}
        {!searched && !loading ? (
          /* Hint box when no search yet */
          <View style={s.hintBox}>
            <MaterialIcons name="info-outline" size={24} color={theme.colors.primary} />
            <Text style={s.hintTitle}>راهنمای جستجو</Text>
            <Text style={s.hintText}>
              {'می‌توانید بخشی از شماره پلاک خودرو را وارد کنید.\nمثلاً ۲ رقم ابتدایی، حرف پلاک یا کد شهر.\nسیستم نتایج منطبق را نمایش می‌دهد.'}
            </Text>

            {/* Demo plate */}
            <View style={s.hintPlateDemo}>
              {renderPlate('12 ب 345 ایران 11')}
            </View>
            <Text style={s.hintText}>نمونه پلاک ملی ایران</Text>
          </View>
        ) : loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[s.emptyDesc, { marginTop: 12 }]}>در حال جستجو...</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={s.centerBox}>
            <View style={s.emptyIcon}>
              <MaterialIcons name="search-off" size={28} color={theme.colors.error} />
            </View>
            <Text style={s.emptyTitle}>نتیجه‌ای یافت نشد</Text>
            <Text style={s.emptyDesc}>هیچ خودرویی با پلاک «{searchText}» ثبت نشده است.</Text>
          </View>
        ) : (
          <>
            <View style={s.statsBadge}>
              <MaterialIcons name="check-circle" size={14} color={theme.colors.primary} />
              <Text style={s.statsText}>{results.length} نتیجه یافت شد</Text>
            </View>

            <FlatList
              data={results}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  )
}

export default PlateSearchScreen

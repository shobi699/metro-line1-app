import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from 'react-native'
import { Search, X, SlidersHorizontal, FilterX } from 'lucide-react-native'
import { useTheme } from '../../shared/ThemeProvider'

export type MobileFilterState = {
  query: string
  direction: 'ALL' | 'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'
  onlyAmended: boolean
  onlyConflicts: boolean
}

interface SearchFilterBarMobileProps {
  filters: MobileFilterState
  onFilterChange: (newFilters: MobileFilterState) => void
  resultCount?: number
}

export function SearchFilterBarMobile({ filters, onFilterChange, resultCount }: SearchFilterBarMobileProps) {
  const { theme } = useTheme()
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const updateFilter = (updates: Partial<MobileFilterState>) => {
    onFilterChange({ ...filters, ...updates })
  }

  const activeFilterCount = (filters.direction !== 'ALL' ? 1 : 0) + (filters.onlyAmended ? 1 : 0) + (filters.onlyConflicts ? 1 : 0)

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Search size={18} color={theme.colors.secondary} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="جستجوی قطار، ساعت، اسم..."
          placeholderTextColor={theme.colors.secondary}
          value={filters.query}
          onChangeText={(val) => updateFilter({ query: val })}
        />
        {filters.query ? (
          <TouchableOpacity onPress={() => updateFilter({ query: '' })}>
            <X size={18} color={theme.colors.text} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          style={styles.filterTrigger} 
          onPress={() => setShowFiltersModal(true)}
        >
          <SlidersHorizontal size={18} color={activeFilterCount > 0 ? theme.colors.primary : theme.colors.text} />
          {activeFilterCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Quick Chips Horizontal Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        <View style={styles.chipsContainer}>
          {filters.onlyAmended && (
            <TouchableOpacity 
              style={[styles.chip, styles.chipActiveOrange]} 
              onPress={() => updateFilter({ onlyAmended: false })}
            >
              <Text style={styles.chipTextWhite}>▲ فقط تغییرکرده</Text>
            </TouchableOpacity>
          )}
          {filters.direction !== 'ALL' && (
            <TouchableOpacity 
              style={[styles.chip, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}
              onPress={() => updateFilter({ direction: 'ALL' })}
            >
              <Text style={styles.chipTextWhite}>
                {filters.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری ← تجریش' : 'تجریش ← شهرری'}
              </Text>
            </TouchableOpacity>
          )}
          {filters.onlyConflicts && (
            <TouchableOpacity 
              style={[styles.chip, styles.chipActiveRed]} 
              onPress={() => updateFilter({ onlyConflicts: false })}
            >
              <Text style={styles.chipTextWhite}>⚠️ فقط مشکل‌دار</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Result Count */}
      {resultCount !== undefined && (
        <Text style={[styles.resultCount, { color: theme.colors.secondary }]}>
          {resultCount} نتیجه یافت شد
        </Text>
      )}

      {/* Filter Bottom Sheet (Modal for simplicity here) */}
      <Modal visible={showFiltersModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>فیلترها</Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>بستن</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>مسیر</Text>
              <View style={styles.rowGrid}>
                {['ALL', 'SHAHRREY_TO_TAJRISH', 'TAJRISH_TO_SHAHRREY'].map((dir) => (
                  <TouchableOpacity
                    key={dir}
                    style={[
                      styles.filterBtn, 
                      { borderColor: theme.colors.border },
                      filters.direction === dir ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : {}
                    ]}
                    onPress={() => updateFilter({ direction: dir as any })}
                  >
                    <Text style={[
                      styles.filterBtnText, 
                      { color: filters.direction === dir ? '#fff' : theme.colors.text }
                    ]}>
                      {dir === 'ALL' ? 'همه' : dir === 'SHAHRREY_TO_TAJRISH' ? 'شهرری به تجریش' : 'تجریش به شهرری'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>وضعیت سفر</Text>
              <TouchableOpacity
                style={[
                  styles.filterBtn, 
                  { borderColor: theme.colors.border },
                  filters.onlyAmended ? { backgroundColor: '#f97316', borderColor: '#f97316' } : {}
                ]}
                onPress={() => updateFilter({ onlyAmended: !filters.onlyAmended })}
              >
                <Text style={[
                  styles.filterBtnText, 
                  { color: filters.onlyAmended ? '#fff' : theme.colors.text }
                ]}>
                  ▲ دارای اصلاحیه
                </Text>
              </TouchableOpacity>

              {activeFilterCount > 0 && (
                <TouchableOpacity 
                  style={styles.clearBtn}
                  onPress={() => updateFilter({ direction: 'ALL', onlyAmended: false, onlyConflicts: false })}
                >
                  <FilterX size={16} color="#ef4444" />
                  <Text style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: 6 }}>پاک‌کردن فیلترها</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: 'Vazirmatn',
    textAlign: 'right',
    marginHorizontal: 8,
    fontSize: 14,
  },
  filterTrigger: {
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
    marginLeft: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipTextWhite: {
    color: '#fff',
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    fontWeight: '600',
  },
  chipActiveOrange: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  chipActiveRed: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  resultCount: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 18,
  },
  modalBody: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'right',
  },
  rowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  filterBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  }
})

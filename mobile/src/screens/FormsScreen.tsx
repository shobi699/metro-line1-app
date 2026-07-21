import React, { useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, ListTodo, FileText } from 'lucide-react-native'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper as ScreenLayout } from '../shared/ScreenWrapper'
import { useFormsStore, FormTemplate } from '../stores/forms'

export function FormsScreen() {
  const { theme } = useTheme()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  
  const { templates, templatesLoading, fetchTemplates } = useFormsStore()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const renderFormCard = ({ item }: { item: FormTemplate }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('FormSubmitScreen', { formKey: item.key })}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
        <FileText color={theme.colors.primary} size={24} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
        {item.description ? (
          <Text style={[styles.cardDesc, { color: theme.colors.secondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: theme.colors.border }]}>
            <Text style={[styles.badgeText, { color: theme.colors.text }]}>{item.category || 'عمومی'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionIcon}>
        <Plus color={theme.colors.primary} size={20} />
      </View>
    </TouchableOpacity>
  )

  return (
    <ScreenLayout title="فرم‌های سازمانی">
      <View style={styles.container}>
        <TouchableOpacity 
          style={[styles.myFormsBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('MyFormsScreen')}
        >
          <ListTodo color={theme.colors.primary} size={20} />
          <Text style={[styles.myFormsText, { color: theme.colors.text }]}>فرم‌های من (پیگیری)</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>ارسال درخواست جدید</Text>

        {templatesLoading && templates.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>در حال دریافت فرم‌ها...</Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={item => item.id}
            renderItem={renderFormCard}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={templatesLoading} onRefresh={fetchTemplates} colors={[theme.colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: theme.colors.secondary, fontFamily: 'Vazirmatn' }}>هیچ فرمی برای شما یافت نشد.</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  myFormsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  myFormsText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  cardTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Vazirmatn',
    fontSize: 10,
  },
  actionIcon: {
    padding: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Vazirmatn',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  }
})

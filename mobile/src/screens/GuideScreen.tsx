import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { 
  BookOpen, 
  Search, 
  ChevronLeft, 
  ChevronDown, 
  Info,
  Smartphone,
  Globe,
  Sliders,
  HelpCircle
} from 'lucide-react-native'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface GuideItem {
  id: string
  title: string
  category: string
  description: string
  steps: string[]
  rules: string[]
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    id: 'dashboard',
    title: 'داشبورد و میانبرها',
    category: 'عمومی',
    description: 'آشنایی با پیشخوان کاربری و دسترسی سریع به بخش‌های برنامه.',
    steps: [
      'کارت شیفت امروز در بالای داشبورد قرار دارد و مشخص می‌کند امروز شیفت هستید یا خیر.',
      'شبکه ۱۲تایی پایین صفحه به عنوان دسترسی سریع به کارهای روزانه طراحی شده است.',
      'در صورت انتشار بنر مهم از طرف مدیریت، بنر در بالای داشبورد نمایش داده می‌شود.'
    ],
    rules: [
      'آیکون‌ها بر اساس نیاز کاری رنگ‌بندی شده‌اند (مثلا SOS با رنگ قرمز جلب توجه می‌کند).'
    ]
  },
  {
    id: 'shifts',
    title: 'لوحه شیفت کاری',
    category: 'شیفت‌ها',
    description: 'مشاهده برنامه زمانی کار و ساعت‌های حضور روزانه.',
    steps: [
      'وارد بخش «لوحه شیفت» شوید تا تقویم شمسی ماه جاری را مشاهده کنید.',
      'روزهای دارای شیفت با دایره رنگی (نظیر زرد برای روزکار، آبی برای شب‌کار) متمایز شده‌اند.',
      'با لمس هر روز، جزییات شیفت، زمان خروج قطار و واگن نمایش داده می‌شود.'
    ],
    rules: [
      'شیفت روزکار: ۰۷:۰۰ الی ۱۹:۰۰',
      'شیفت شب‌کار: ۱۹:۰۰ الی ۰۷:۰۰ روز بعد'
    ]
  },
  {
    id: 'swap',
    title: 'درخواست تعویض شیفت',
    category: 'شیفت‌ها',
    description: 'جابجا کردن شیفت کاری با همکاران بر اساس قوانین ایمنی.',
    steps: [
      'در صفحه «تبادل شیفت»، دکمه «ثبت درخواست جدید» را لمس کنید.',
      'تاریخ شیفت خودتان و همکار جایگزین را مشخص کرده و درخواست را ارسال کنید.',
      'همکار شما باید درخواست را در صندوق ورودی خود تایید کند.',
      'تایید نهایی توسط سرپرست خط انجام خواهد شد.'
    ],
    rules: [
      'باید حداقل ۱۲ ساعت بین پایان یک شیفت تا شروع شیفت بعدی فاصله باشد (قانون استراحت).',
      'کاربران باید دارای رتبه و پایه فنی هم‌تراز باشند.'
    ]
  },
  {
    id: 'attendance',
    title: 'حضور و غیاب (GPS)',
    category: 'عملیات',
    description: 'ثبت ورود و خروج بر اساس محدوده جغرافیایی ایستگاه.',
    steps: [
      'صفحه «حضور و غیاب» را باز کرده و اجازه دسترسی به GPS را به برنامه بدهید.',
      'وقتی در شعاع ۵۰ متری ایستگاه قرار بگیرید، دکمه «ثبت ورود» سبز و فعال می‌شود.',
      'برای خروج نیز باید در همان محدوده دکمه «ثبت خروج» را لمس کنید.'
    ],
    rules: [
      'ثبت ورود تا ۱۵ دقیقه تاخیر بدون جریمه است؛ پس از آن تاخیر محسوب می‌شود.'
    ]
  },
  {
    id: 'checklists',
    title: 'چک‌لیست حرکت قطار',
    category: 'عملیات',
    description: 'بررسی سلامت فنی قطار پیش از خروج از پایانه.',
    steps: [
      'به بخش «چک‌لیست‌ها» بروید.',
      'تمام گزینه‌های فنی (سیستم ترمز، تهویه، درب‌ها و رادیو) را با دقت بررسی و علامت بزنید.',
      'در صورت خرابی، تصویر آن را آپلود کنید.',
      'دکمه «تایید نهایی» را لمس کنید تا به OCC مخابره شود.'
    ],
    rules: [
      'تکمیل چک‌لیست قبل از حرکت قطار الزامی است و مسئولیت حقوقی دارد.'
    ]
  },
  {
    id: 'tickets',
    title: 'ثبت خرابی و تیکتینگ',
    category: 'عملیات',
    description: 'گزارش عیوب قطار و ایستگاه‌ها به همراه عکس.',
    steps: [
      'بخش «تیکت‌ها» یا «اعلام خرابی» را باز کنید.',
      'دسته خرابی (فنی، سیگنالینگ، ایستگاه) را مشخص کنید.',
      'یک عکس واضح از عیب با دوربین گوشی گرفته یا از گالری آپلود کنید.',
      'شدت خرابی (عادی، مهم، بحرانی) را تعیین کرده و دکمه ثبت را بزنید.'
    ],
    rules: [
      'تیکت‌های بحرانی سریعاً در اتاق کنترل (OCC) آلارم صوتی ایجاد می‌کنند.'
    ]
  },
  {
    id: 'bulletins',
    title: 'بخشنامه‌های ایمنی',
    category: 'آموزش',
    description: 'ابلاغیه‌های مهم که مطالعه آن‌ها اجباری است.',
    steps: [
      'بخشنامه‌های ایمنی جدید بلافاصله پس از ورود به برنامه قفل می‌شوند.',
      'متن را تا انتها اسکرول کرده و بخوانید.',
      'دکمه «مطالعه کردم و متعهد می‌شوم» را لمس کنید تا امضا ثبت شود.'
    ],
    rules: [
      'تا زمان عدم امضا و تایید بخشنامه، بقیه بخش‌های اپلیکیشن قفل خواهند ماند.'
    ]
  },
  {
    id: 'comms',
    title: 'بی‌سیم تترا و ارتباط صوتی',
    category: 'ارتباطات',
    description: 'شبیه‌ساز ارتباط رادیویی تترا و کنفرانس صوتی.',
    steps: [
      'شبیه‌ساز تترا: با فشردن دکمه PTT (فشار برای صحبت) صحبت کنید و با رها کردن آن منتظر پاسخ باشید.',
      'کنفرانس صوتی: پیوستن به تماس صوتی زنده با سرپرستان در شرایط اضطراری.'
    ],
    rules: [
      'بی‌سیم راهبری فقط برای هماهنگی‌های کاری است و صحبت‌های متفرقه در آن ممنوع است.'
    ]
  },
  {
    id: 'ai',
    title: 'دستیار هوشمند (AI)',
    category: 'آموزش',
    description: 'چت و سوال از هوش مصنوعی آیین‌نامه.',
    steps: [
      'به بخش «دستیار AI» بروید.',
      'سوالات خود را در مورد کدهای خطا، فواصل ایمنی یا قوانین به صورت متنی بپرسید.',
      'دستیار با ارجاع به بندهای کتابچه پاسخ شما را خواهد داد.'
    ],
    rules: [
      'در حین حرکت قطار از کار با دستیار خودداری کنید؛ اولویت با دستورات رادیویی OCC است.'
    ]
  }
]

export function GuideScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('همه')
  const [expandedId, setExpandedId] = useState<string | null>('dashboard')

  const categories = ['همه', 'عمومی', 'شیفت‌ها', 'عملیات', 'آموزش', 'ارتباطات']

  const filteredGuides = GUIDE_ITEMS.filter(item => {
    const matchesSearch = item.title.includes(search) || item.description.includes(search)
    const matchesCategory = category === 'همه' || item.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <ScreenWrapper title="راهنما">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]} >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>راهنمای کاربری و آموزش</Text>
            <Text style={styles.headerSubtitle}>آموزش جامع استفاده از امکانات سوپراپ</Text>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceContainerLow }]}>
          <Search size={18} color="#a1a1aa" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="جستجو در سرفصل‌های راهنما..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>

        {/* Categories scroll */}
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryBadge,
                  category === cat ? { backgroundColor: theme.colors.accent } : { backgroundColor: theme.colors.surfaceContainerLow }
                ]}
              >
                <Text style={[styles.categoryText, category === cat ? styles.categoryTextActive : { color: theme.colors.onSurfaceVariant }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main List */}
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {filteredGuides.map(item => {
            const isExpanded = expandedId === item.id
            return (
              <View 
                key={item.id} 
                style={[
                  styles.card, 
                  { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.borderSubtle }
                ]}
              >
                <TouchableOpacity
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  style={styles.cardHeader}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTitleRow}>
                    <BookOpen size={16} color={theme.colors.accent} style={styles.titleIcon} />
                    <View style={styles.cardTitleText}>
                      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{item.title}</Text>
                      <Text style={styles.cardBadge}>{item.category}</Text>
                    </View>
                  </View>
                  <ChevronDown size={18} color="#71717a" style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.cardBody}>
                    <Text style={styles.description}>{item.description}</Text>

                    {/* Steps */}
                    <Text style={[styles.sectionHeading, { color: theme.colors.onSurface }]}>مراحل و راهنما:</Text>
                    {item.steps.map((step, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <View style={[styles.bulletNumber, { backgroundColor: theme.colors.accent }]} />
                        <Text style={[styles.bulletText, { color: theme.colors.onSurfaceVariant }]}>{step}</Text>
                      </View>
                    ))}

                    {/* Rules */}
                    <View style={[styles.rulesContainer, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
                      <View style={styles.rulesTitleRow}>
                        <Info size={14} color={theme.colors.accent} style={{ marginLeft: 6 }} />
                        <Text style={[styles.rulesTitle, { color: theme.colors.onSurface }]}>نکته عملیاتی</Text>
                      </View>
                      {item.rules.map((rule, idx) => (
                        <Text key={idx} style={styles.ruleText}>• {rule}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 6,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  headerTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 16,
  },
  headerSubtitle: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 10,
    color: '#a1a1aa',
    marginTop: 2,
  },
  searchContainer: {
    margin: 16,
    borderRadius: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  categoriesWrapper: {
    height: 40,
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 11,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  titleIcon: {
    marginLeft: 12,
  },
  cardTitleText: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 13,
  },
  cardBadge: {
    fontSize: 9,
    fontFamily: 'Vazirmatn_700Bold',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#a1a1aa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 12,
  },
  description: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 20,
    textAlign: 'right',
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 11,
    textAlign: 'right',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 6,
  },
  bulletNumber: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 10,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 11.5,
    lineHeight: 18,
    textAlign: 'right',
  },
  rulesContainer: {
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  rulesTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 6,
  },
  rulesTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 10.5,
  },
  ruleText: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 10,
    color: '#a1a1aa',
    textAlign: 'right',
    lineHeight: 16,
    marginTop: 4,
  }
})

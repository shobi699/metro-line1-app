import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts, Vazirmatn_400Regular, Vazirmatn_700Bold } from '@expo-google-fonts/vazirmatn'
import { Text, TextInput } from 'react-native'
import { useAuthStore } from './src/stores/auth'
import { useConfigStore } from './src/stores/config'
import { LoginScreen } from './src/screens/LoginScreen'
import { useUIBuilderStore } from './src/stores/ui-builder'
import { HomeScreen } from './src/screens/HomeScreen'
import { DirectoryScreen } from './src/screens/DirectoryScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { CalendarScreen } from './src/screens/CalendarScreen'
import { SOSScreen } from './src/screens/SOSScreen'
import { AIAssistantScreen } from './src/screens/AIAssistantScreen'
import { NotificationsScreen } from './src/screens/NotificationsScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { AttendanceScreen } from './src/screens/AttendanceScreen'
import { FeedbackScreen } from './src/screens/FeedbackScreen'
import { TicketsScreen } from './src/screens/TicketsScreen'
import { BulletinsScreen } from './src/screens/BulletinsScreen'
import { ChecklistsScreen } from './src/screens/ChecklistsScreen'
import { VoiceConferenceScreen } from './src/screens/VoiceConferenceScreen'
import { RadioSimulatorScreen } from './src/screens/RadioSimulatorScreen'
import { PerformanceScreen } from './src/screens/PerformanceScreen'
import { ContentScreen } from './src/screens/ContentScreen'
import { RosterScreen } from './src/screens/RosterScreen'
import { UIBuilderScreen } from './src/screens/UIBuilderScreen'
import { CustomPageScreen } from './src/screens/CustomPageScreen'
import { OfflineBanner } from './src/shared/OfflineBanner'
import { BulletinGuard } from './src/shared/BulletinGuard'
import { CustomTabBar } from './src/shared/CustomTabBar'
import { ThemeProvider, useTheme } from './src/shared/ThemeProvider'
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Bell,
  User,
} from 'lucide-react-native'

export type RootStackParamList = {
  MainTabs: undefined
  HomeScreen: undefined
  'دفتر تلفن': undefined
  'حضور و غیاب': undefined
  'بازخورد': undefined
  'SOS': undefined
  'دستیار AI': undefined
  'تیکت‌ها': undefined
  'بخشنامه‌ها': undefined
  'چک‌لیست‌ها': undefined
  'کنفرانس صوتی': undefined
  'بی‌سیم راهبری': undefined
  'عملکرد': undefined
  'محتوا': undefined
  'لوحه': undefined
  UIBuilder: undefined
  CustomPage: { slug: string }
}

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<RootStackParamList>()

// MetroTheme is now defined dynamically inside AppContent

function HomeStackScreen() {
  const { theme } = useTheme()
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="دفتر تلفن" component={DirectoryScreen} />
      <Stack.Screen name="حضور و غیاب" component={AttendanceScreen} />
      <Stack.Screen name="بازخورد" component={FeedbackScreen} />
      <Stack.Screen name="SOS" component={SOSScreen} />
      <Stack.Screen name="دستیار AI" component={AIAssistantScreen} />
      <Stack.Screen name="تیکت‌ها" component={TicketsScreen} />
      <Stack.Screen name="بخشنامه‌ها" component={BulletinsScreen} />
      <Stack.Screen name="چک‌لیست‌ها" component={ChecklistsScreen} />
      <Stack.Screen name="کنفرانس صوتی" component={VoiceConferenceScreen} />
      <Stack.Screen name="بی‌سیم راهبری" component={RadioSimulatorScreen} />
      <Stack.Screen name="عملکرد" component={PerformanceScreen} />
      <Stack.Screen name="محتوا" component={ContentScreen} />
      <Stack.Screen name="لوحه" component={RosterScreen} />
      <Stack.Screen name="UIBuilder" component={UIBuilderScreen} />
      <Stack.Screen name="CustomPage" component={CustomPageScreen} />
    </Stack.Navigator>
  )
}

function getComponentForRoute(route: string) {
  switch (route) {
    case 'HomeScreen':
    case 'Home':
      return HomeStackScreen
    case 'CalendarScreen':
    case 'Calendar':
    case 'RosterScreen':
    case 'Roster':
      return CalendarScreen
    case 'NotificationsScreen':
    case 'Notifications':
    case 'FicationsScreen':
      return NotificationsScreen
    case 'ChatScreen':
    case 'Chat':
      return ChatScreen
    case 'ProfileScreen':
    case 'Profile':
      return ProfileScreen
    case 'DirectoryScreen':
    case 'Directory':
      return DirectoryScreen
    case 'SOSScreen':
    case 'SOS':
      return SOSScreen
    case 'AIAssistantScreen':
    case 'AIAssistant':
      return AIAssistantScreen
    case 'AttendanceScreen':
    case 'Attendance':
      return AttendanceScreen
    case 'FeedbackScreen':
    case 'Feedback':
      return FeedbackScreen
    case 'TicketsScreen':
    case 'Tickets':
      return TicketsScreen
    case 'BulletinsScreen':
    case 'Bulletins':
      return BulletinsScreen
    case 'ChecklistsScreen':
    case 'Checklists':
      return ChecklistsScreen
    case 'VoiceConferenceScreen':
    case 'VoiceConference':
      return VoiceConferenceScreen
    case 'RadioSimulatorScreen':
    case 'RadioSimulator':
    case 'Radio':
      return RadioSimulatorScreen
    case 'PerformanceScreen':
    case 'Performance':
      return PerformanceScreen
    case 'ContentScreen':
    case 'Content':
      return ContentScreen
    case 'UIBuilderScreen':
    case 'UIBuilder':
      return UIBuilderScreen
    default:
      return HomeStackScreen
  }
}

function MainTabs() {
  const menuItems = useUIBuilderStore((s) => s.menuItems)

  const tabsToRender = menuItems.length > 0
    ? menuItems.filter(item => item.isVisible)
    : [
        { label: 'پروفایل', route: 'ProfileScreen' },
        { label: 'گفتگو', route: 'ChatScreen' },
        { label: 'اعلان‌ها', route: 'NotificationsScreen' },
        { label: 'شیفت‌ها', route: 'CalendarScreen' },
        { label: 'داشبورد', route: 'HomeScreen' },
      ]

  const key = tabsToRender.map(t => `${t.route}-${t.label}`).join(',')

  const BUILT_IN_ROUTES = [
    'HomeScreen', 'Home', 'CalendarScreen', 'Calendar', 
    'NotificationsScreen', 'Notifications', 'FicationsScreen', 
    'ChatScreen', 'Chat', 'ProfileScreen', 'Profile',
    'DirectoryScreen', 'Directory', 'SOSScreen', 'SOS', 
    'AIAssistantScreen', 'AIAssistant', 'AttendanceScreen', 'Attendance', 
    'FeedbackScreen', 'Feedback', 'TicketsScreen', 'Tickets', 
    'BulletinsScreen', 'Bulletins', 'ChecklistsScreen', 'Checklists', 
    'VoiceConferenceScreen', 'VoiceConference', 'RadioSimulatorScreen', 'RadioSimulator', 'Radio', 
    'PerformanceScreen', 'Performance', 'ContentScreen', 'Content', 'UIBuilderScreen', 'UIBuilder'
  ]

  return (
    <Tab.Navigator
      key={key}
      initialRouteName="داشبورد"
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabsToRender.map((tab) => {
        const isBuiltIn = BUILT_IN_ROUTES.includes(tab.route)
        return (
          <Tab.Screen 
            key={tab.route} 
            name={tab.label} 
            component={isBuiltIn ? getComponentForRoute(tab.route) : CustomPageScreen} 
            initialParams={{ slug: tab.route }}
          />
        )
      })}
    </Tab.Navigator>
  )
}

export function AppContent() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const loadPersistedAuth = useAuthStore((s) => s.loadPersistedAuth)
  const fetchConfig = useConfigStore((s) => s.fetchConfig)
  const loadPersistedConfig = useConfigStore((s) => s.loadPersistedConfig)
  const { theme } = useTheme()

  let [fontsLoaded] = useFonts({
    Vazirmatn: Vazirmatn_400Regular,
    'Vazirmatn-Bold': Vazirmatn_700Bold,
  })

  useEffect(() => {
    loadPersistedConfig().then(() => {
      fetchConfig()
    })
    loadPersistedAuth()
  }, [])

  if (isLoading || !fontsLoaded) return null
  if (!user) return <LoginScreen />

  const MetroTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      border: theme.colors.border,
      primary: theme.colors.primary,
      text: theme.colors.onSurface,
    },
  }

  return (
    <NavigationContainer theme={MetroTheme}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <OfflineBanner />
        <BulletinGuard>
          <MainTabs />
        </BulletinGuard>
      </View>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="dark" />
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}


import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts, Vazirmatn_400Regular, Vazirmatn_700Bold } from '@expo-google-fonts/vazirmatn'
import { Text, TextInput } from 'react-native'
import { useAuthStore } from './src/stores/auth'
import { useConfigStore } from './src/stores/config'
import { LoginScreen } from './src/screens/LoginScreen'
import { API_URL } from './src/shared/config'
import { useUIBuilderStore } from './src/stores/ui-builder'
import { HomeScreen } from './src/screens/HomeScreen'
import { DirectoryScreen } from './src/screens/DirectoryScreen'
import { ChatScreen } from './src/screens/ChatScreen'
import { CalendarScreen } from './src/screens/CalendarScreen'
import { LifeCalendarScreen } from './src/screens/LifeCalendarScreen'
import { SOSScreen } from './src/screens/SOSScreen'
import { AIAssistantScreen } from './src/screens/AIAssistantScreen'
import { NotificationsScreen } from './src/screens/NotificationsScreen'
import { ProfileScreen } from './src/screens/ProfileScreen'
import { AttendanceScreen } from './src/screens/AttendanceScreen'
import { FeedbackScreen } from './src/screens/FeedbackScreen'
import { TicketsScreen } from './src/screens/TicketsScreen'
import { BulletinsScreen } from './src/screens/BulletinsScreen'
import ChecklistsScreen from './src/screens/ChecklistsScreen'
import { LeaveReportScreen } from './src/screens/LeaveReportScreen'
import { VoiceConferenceScreen } from './src/screens/VoiceConferenceScreen'
import { RadioSimulatorScreen } from './src/screens/RadioSimulatorScreen'
import PerformanceScreen from './src/screens/PerformanceScreen'
import { ContentScreen } from './src/screens/ContentScreen'
import { RosterScreen } from './src/screens/RosterScreen'
import { UIBuilderScreen } from './src/screens/UIBuilderScreen'
import { CustomPageScreen } from './src/screens/CustomPageScreen'
import { LearningScreen } from './src/screens/LearningScreen'
import { GuideScreen } from './src/screens/GuideScreen'
import { MeetingsScreen } from './src/screens/MeetingsScreen'
import { PollsScreen } from './src/screens/PollsScreen'
import { PlateSearchScreen } from './src/screens/PlateSearchScreen'
import { FormsScreen } from './src/screens/FormsScreen'
import { FormSubmitScreen } from './src/screens/FormSubmitScreen'
import { MyFormsScreen } from './src/screens/MyFormsScreen'
import { FormsInboxScreen } from './src/screens/FormsInboxScreen'
import { FormReviewScreen } from './src/screens/FormReviewScreen'
import { SubmitRequestScreen } from './src/screens/requests/SubmitRequestScreen'
import { MonthlyReportScreen } from './src/screens/requests/MonthlyReportScreen'
import { CabinModeScreen } from './src/screens/CabinModeScreen'
import FatigueScreen from './src/screens/FatigueScreen'
import LeaderboardScreen from './src/screens/LeaderboardScreen'
import EquipmentScreen from './src/screens/EquipmentScreen'
import SwapScreen from './src/screens/SwapScreen'
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
  'آموزش': undefined
  UIBuilder: undefined
  CustomPage: { slug: string }
  MeetingsScreen: undefined
  PollsScreen: undefined
  ProfileScreen: undefined
  SubmitRequestScreen: undefined
  MonthlyReportScreen: undefined
  CalendarScreen: undefined
  LifeCalendarScreen: undefined
  LeaveReportScreen: undefined
  PlateSearch: undefined
  Forms: undefined
  FormSubmit: { formKey: string }
  MyForms: undefined
  FormsInbox: undefined
  FormReview: { submissionId: string }
  'راهنمای کاربری': undefined
  DirectoryScreen: undefined
  ChecklistsScreen: undefined
  CabinMode: undefined
  Fatigue: undefined
  Leaderboard: undefined
  Equipment: undefined
  Swap: undefined
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
      <Stack.Screen name="آموزش" component={LearningScreen} />
      <Stack.Screen name="UIBuilder" component={UIBuilderScreen} />
      <Stack.Screen name="CustomPage" component={CustomPageScreen} />
      <Stack.Screen name="MeetingsScreen" component={MeetingsScreen} />
      <Stack.Screen name="PollsScreen" component={PollsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SubmitRequestScreen" component={SubmitRequestScreen} />
      <Stack.Screen name="MonthlyReportScreen" component={MonthlyReportScreen} />
      <Stack.Screen name="CalendarScreen" component={CalendarScreen} />
      <Stack.Screen name="LifeCalendarScreen" component={LifeCalendarScreen} />
      <Stack.Screen name="LeaveReportScreen" component={LeaveReportScreen} />
      <Stack.Screen name="PlateSearch" component={PlateSearchScreen} />
      <Stack.Screen name="Forms" component={FormsScreen} />
      <Stack.Screen name="FormSubmit" component={FormSubmitScreen} />
      <Stack.Screen name="MyForms" component={MyFormsScreen} />
      <Stack.Screen name="FormsInbox" component={FormsInboxScreen} />
      <Stack.Screen name="FormReview" component={FormReviewScreen} />
      <Stack.Screen name="راهنمای کاربری" component={GuideScreen} />
      <Stack.Screen name="DirectoryScreen" component={DirectoryScreen} />
      <Stack.Screen name="ChecklistsScreen" component={ChecklistsScreen} />
      <Stack.Screen name="CabinMode" component={CabinModeScreen} />
      <Stack.Screen name="Fatigue" component={FatigueScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Equipment" component={EquipmentScreen} />
      <Stack.Screen name="Swap" component={SwapScreen} />
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
      return CalendarScreen
    case 'RosterScreen':
    case 'Roster':
      return RosterScreen
    case 'LifeCalendarScreen':
    case 'LifeCalendar':
      return LifeCalendarScreen
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
    case 'PollsScreen':
    case 'Polls':
      return PollsScreen
    case 'FormsScreen':
    case 'Forms':
      return FormsScreen
    case 'MyFormsScreen':
    case 'MyForms':
      return MyFormsScreen
    case 'FormsInboxScreen':
    case 'FormsInbox':
      return FormsInboxScreen
    case 'FormReviewScreen':
    case 'FormReview':
      return FormReviewScreen
    case 'CabinModeScreen':
    case 'CabinMode':
      return CabinModeScreen
    case 'LearningScreen':
    case 'Learning':
      return LearningScreen
    case 'LeaveReportScreen':
    case 'LeaveReport':
      return LeaveReportScreen
    case 'MeetingsScreen':
    case 'Meetings':
      return MeetingsScreen
    case 'PlateSearchScreen':
    case 'PlateSearch':
      return PlateSearchScreen
    case 'GuideScreen':
    case 'Guide':
      return GuideScreen
    case 'MonthlyReportScreen':
    case 'MonthlyReport':
      return MonthlyReportScreen
    case 'SubmitRequestScreen':
    case 'SubmitRequest':
      return SubmitRequestScreen
    case 'FatigueScreen':
    case 'Fatigue':
      return FatigueScreen
    case 'LeaderboardScreen':
    case 'Leaderboard':
      return LeaderboardScreen
    case 'EquipmentScreen':
    case 'Equipment':
      return EquipmentScreen
    case 'SwapScreen':
    case 'Swap':
      return SwapScreen
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
    'PerformanceScreen', 'Performance', 'ContentScreen', 'Content', 'UIBuilderScreen', 'UIBuilder',
    'PollsScreen', 'Polls', 'FormsScreen', 'Forms', 'MyFormsScreen', 'MyForms',
    'FormsInboxScreen', 'FormsInbox', 'FormReviewScreen', 'FormReview',
    'CabinModeScreen', 'CabinMode', 'LearningScreen', 'Learning', 'LeaveReportScreen', 'LeaveReport',
    'MeetingsScreen', 'Meetings', 'PlateSearchScreen', 'PlateSearch', 'GuideScreen', 'Guide',
    'MonthlyReportScreen', 'MonthlyReport', 'SubmitRequestScreen', 'SubmitRequest',
    'RosterScreen', 'Roster',
    'FatigueScreen', 'Fatigue', 'LeaderboardScreen', 'Leaderboard', 'EquipmentScreen', 'Equipment',
    'SwapScreen', 'Swap'
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
  const { theme, isDark } = useTheme()

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

  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    const registerDevice = async () => {
      if (!accessToken || !user) return
      try {
        let token = await AsyncStorage.getItem('@device_token')
        if (!token) {
          token = 'dev-' + Math.random().toString(36).substring(2, 15)
          await AsyncStorage.setItem('@device_token', token)
        }

        const platform = Platform.OS === 'ios' ? 'ios_pwa' : 'android'
        await fetch(`${API_URL}/notifications/devices/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            platform,
            driver: 'selfhosted',
            token,
            deviceName: `${Platform.OS} Device`,
          }),
        })
      } catch (err) {
        console.error('Error registering device token:', err)
      }
    }

    if (user && accessToken) {
      void registerDevice()
    }
  }, [user, accessToken])

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
      <StatusBar style={isDark ? "light" : "dark"} />
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
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}


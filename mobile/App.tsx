import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from './src/stores/auth'
import { useConfigStore } from './src/stores/config'
import { LoginScreen } from './src/screens/LoginScreen'
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
import { OfflineBanner } from './src/shared/OfflineBanner'
import { BulletinGuard } from './src/shared/BulletinGuard'
import { Theme } from './src/shared/theme'
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Bell,
  User,
} from 'lucide-react-native'

export type RootStackParamList = {
  MainTabs: undefined
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
}

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<RootStackParamList>()

const MetroTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Theme.colors.background,
    card: Theme.colors.surface,
    border: Theme.colors.border,
    primary: Theme.colors.accent,
    text: Theme.colors.text,
  },
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.accent,
        tabBarInactiveTintColor: Theme.colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Theme.colors.surface,
          borderTopColor: Theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="خانه"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="چت"
        component={ChatScreen}
        options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
      />
      <Tab.Screen
        name="شیفت"
        component={CalendarScreen}
        options={{ tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
      />
      <Tab.Screen
        name="اعلانات"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }}
      />
      <Tab.Screen
        name="پروفایل"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}

export function AppContent() {
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const loadPersistedAuth = useAuthStore((s) => s.loadPersistedAuth)
  const fetchConfig = useConfigStore((s) => s.fetchConfig)
  const loadPersistedConfig = useConfigStore((s) => s.loadPersistedConfig)

  useEffect(() => {
    loadPersistedConfig().then(() => {
      fetchConfig()
    })
    loadPersistedAuth()
  }, [])

  if (isLoading) return null
  if (!user) return <LoginScreen />

  return (
    <NavigationContainer theme={MetroTheme}>
      <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <OfflineBanner />
        <BulletinGuard>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabs} />
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
          </Stack.Navigator>
        </BulletinGuard>
      </View>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppContent />
    </SafeAreaProvider>
  )
}

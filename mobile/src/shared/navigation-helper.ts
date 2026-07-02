export function handleDynamicNavigation(navigation: any, target: string) {
  if (!target) return

  const routeMap: Record<string, string> = {
    HomeScreen: 'HomeScreen',
    Home: 'HomeScreen',
    CalendarScreen: 'شیفت‌ها',
    Calendar: 'شیفت‌ها',
    NotificationsScreen: 'اعلان‌ها',
    Notifications: 'اعلان‌ها',
    FicationsScreen: 'اعلان‌ها',
    ChatScreen: 'گفتگو',
    Chat: 'گفتگو',
    ProfileScreen: 'پروفایل',
    Profile: 'پروفایل',
    DirectoryScreen: 'دفتر تلفن',
    Directory: 'دفتر تلفن',
    SOSScreen: 'SOS',
    SOS: 'SOS',
    AIAssistantScreen: 'دستیار AI',
    AIAssistant: 'دستیار AI',
    AttendanceScreen: 'حضور و غیاب',
    Attendance: 'حضور و غیاب',
    FeedbackScreen: 'بازخورد',
    Feedback: 'بازخورد',
    TicketsScreen: 'تیکت‌ها',
    Tickets: 'تیکت‌ها',
    BulletinsScreen: 'بخشنامه‌ها',
    Bulletins: 'بخشنامه‌ها',
    ChecklistsScreen: 'چک‌لیست‌ها',
    Checklists: 'چک‌لیست‌ها',
    VoiceConferenceScreen: 'کنفرانس صوتی',
    VoiceConference: 'کنفرانس صوتی',
    RadioSimulatorScreen: 'بی‌سیم راهبری',
    RadioSimulator: 'بی‌سیم راهبری',
    Radio: 'بی‌سیم راهبری',
    PerformanceScreen: 'عملکرد',
    Performance: 'عملکرد',
    ContentScreen: 'محتوا',
    Content: 'محتوا',
    RosterScreen: 'لوحه',
    Roster: 'لوحه',
    UIBuilderScreen: 'UIBuilder',
    UIBuilder: 'UIBuilder'
  }

  const mappedRoute = routeMap[target]
  if (mappedRoute) {
    navigation.navigate(mappedRoute)
  } else {
    // Navigate to the dynamic custom page screen and pass the slug
    navigation.navigate('CustomPage', { slug: target })
  }
}

import { registerRootComponent } from 'expo'
import { Platform } from 'react-native'
import App from './App'

// ثبت هندلر ویجت اندروید قبل از ثبت اپ (Headless JS)
if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget')
    const { widgetTaskHandler } = require('./src/widgets/widget-task-handler')
    registerWidgetTaskHandler(widgetTaskHandler)
  } catch (e) {
    // در Expo Go ماژول native ویجت موجود نیست — اپ عادی بالا می‌آید
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App)

import React from 'react'
import type { WidgetTaskHandlerProps } from 'react-native-android-widget'
import { SmallShiftWidget, WeekShiftWidget, MonthShiftWidget } from './ShiftWidgets'
import { loadWidgetBundle } from './widget-data'

/**
 * هندلر ویجت اندروید — در Headless JS اجرا می‌شود.
 * داده از Shared Storage (AsyncStorage) خوانده می‌شود؛ پس ویجت بدون اینترنت هم درست است.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo
  const bundle = await loadWidgetBundle()

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      switch (widgetInfo.widgetName) {
        case 'ShiftSmall':
          props.renderWidget(<SmallShiftWidget bundle={bundle} />)
          break
        case 'ShiftWeek':
          props.renderWidget(<WeekShiftWidget bundle={bundle} />)
          break
        case 'ShiftMonth':
          props.renderWidget(<MonthShiftWidget bundle={bundle} />)
          break
      }
      break
    default:
      // WIDGET_DELETED / WIDGET_CLICK (کلیک ریشه = OPEN_APP، نیازی به کار اضافه نیست)
      break
  }
}

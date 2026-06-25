import { NextResponse } from 'next/server'
import { getSettingValue } from '@/server/modules/settings/service'

export async function GET() {
  try {
    const appName = await getSettingValue('general.appName', 'سیر و حرکت خط یک مترو')
    const brandColor = await getSettingValue('general.brandColor', '#e53935')
    const maintenanceMode = await getSettingValue('general.maintenanceMode', false)
    const systemNotice = await getSettingValue('general.systemNotice', 'کلیه راهبران خط ۱ با توجه به برودت هوا موظف به رعایت سرعت مطمئنه در بخش روباز ریل هستند.')
    const occPhone = await getSettingValue('general.occPhone', '02155001122')
    const maxLoginAttempts = await getSettingValue('general.maxLoginAttempts', 5)
    const sessionTimeout = await getSettingValue('general.sessionTimeout', 120)
    const allowRegistration = await getSettingValue('general.allowRegistration', true)
    const passwordPolicyMinLength = await getSettingValue('general.passwordPolicyMinLength', 8)

    const chatMaxMessageLength = await getSettingValue('chat.maxMessageLength', 1000)
    const chatEnableFileSharing = await getSettingValue('chat.enableFileSharing', true)

    const allowNoWagon = await getSettingValue('tickets.allowNoWagon', true)
    const requireImage = await getSettingValue('tickets.requireImage', false)

    const minRestHours = await getSettingValue('shifts.minRestHours', 12)
    const maxConsecutiveDays = await getSettingValue('shifts.maxConsecutiveDays', 6)
    const allowSwapRequests = await getSettingValue('shifts.allowSwapRequests', true)

    // Mobile settings
    const enableSos = await getSettingValue('mobile.enableSos', true)
    const geofencingEnabled = await getSettingValue('mobile.geofencingEnabled', true)
    const geofencingRadius = await getSettingValue('mobile.geofencingRadius', 100)
    const offlineCacheEnabled = await getSettingValue('mobile.offlineCacheEnabled', true)
    const sosRecipientPhone = await getSettingValue('mobile.sosRecipientPhone', '09120000000')
    const activeTheme = await getSettingValue('mobile.activeTheme', 'dark')
    const forceUpdate = await getSettingValue('mobile.forceUpdate', false)
    const locationTrackingInterval = await getSettingValue('mobile.locationTrackingInterval', 30)

    // Comms settings
    const voiceChatEnabled = await getSettingValue('comms.voiceChatEnabled', true)
    const maxRecordingTime = await getSettingValue('comms.maxRecordingTime', 60)
    const conferenceEnabled = await getSettingValue('comms.conferenceEnabled', true)
    const maxConferenceParticipants = await getSettingValue('comms.maxConferenceParticipants', 15)
    const radioEnabled = await getSettingValue('comms.radioEnabled', true)
    const radioDefaultChannel = await getSettingValue('comms.radioDefaultChannel', 'OCC MAIN')
    const radioTransmissionInterval = await getSettingValue('comms.radioTransmissionInterval', 10)
    const radioVibrationEnabled = await getSettingValue('comms.radioVibrationEnabled', true)
    const audioBitrate = await getSettingValue('comms.audioBitrate', '32kbps')

    return NextResponse.json({
      data: {
        appName,
        brandColor,
        maintenanceMode,
        systemNotice,
        occPhone,
        maxLoginAttempts,
        sessionTimeout,
        allowRegistration,
        passwordPolicyMinLength,
        chatMaxMessageLength,
        enableFileSharing: chatEnableFileSharing,
        allowNoWagon,
        tickets: {
          allowNoWagon,
          requireImage,
        },
        shifts: {
          minRestHours,
          maxConsecutiveDays,
          allowSwapRequests,
        },
        mobile: {
          enableSos,
          geofencingEnabled,
          geofencingRadius,
          offlineCacheEnabled,
          sosRecipientPhone,
          activeTheme,
          forceUpdate,
          locationTrackingInterval,
        },
        comms: {
          voiceChatEnabled,
          maxRecordingTime,
          conferenceEnabled,
          maxConferenceParticipants,
          radioEnabled,
          radioDefaultChannel,
          radioTransmissionInterval,
          radioVibrationEnabled,
          audioBitrate,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching public config:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت پیکربندی عمومی' },
      { status: 500 }
    )
  }
}

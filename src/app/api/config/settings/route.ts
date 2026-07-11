import { NextResponse } from 'next/server'
import { getSettingValue } from '@/server/modules/settings/service'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const occPhone = await getSettingValue('general.occPhone', '02155001122')
    const maxLoginAttempts = await getSettingValue('general.maxLoginAttempts', 5)
    const sessionTimeout = await getSettingValue('general.sessionTimeout', 120)

    const chatMaxMessageLength = await getSettingValue('chat.maxMessageLength', 1000)
    const chatEnableFileSharing = await getSettingValue('chat.enableFileSharing', true)

    const allowNoWagon = await getSettingValue('tickets.allowNoWagon', true)
    const requireImage = await getSettingValue('tickets.requireImage', false)

    const minRestHours = await getSettingValue('shifts.minRestHours', 12)
    const maxConsecutiveDays = await getSettingValue('shifts.maxConsecutiveDays', 6)
    const allowSwapRequests = await getSettingValue('shifts.allowSwapRequests', true)

    const enableSos = await getSettingValue('mobile.enableSos', true)
    const geofencingEnabled = await getSettingValue('mobile.geofencingEnabled', true)
    const geofencingRadius = await getSettingValue('mobile.geofencingRadius', 100)
    const offlineCacheEnabled = await getSettingValue('mobile.offlineCacheEnabled', true)
    const sosRecipientPhone = await getSettingValue('mobile.sosRecipientPhone', '09120000000')
    const activeTheme = await getSettingValue('mobile.activeTheme', 'dark')
    const forceUpdate = await getSettingValue('mobile.forceUpdate', false)
    const locationTrackingInterval = await getSettingValue('mobile.locationTrackingInterval', 30)

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
        occPhone,
        maxLoginAttempts,
        sessionTimeout,
        chatMaxMessageLength,
        enableFileSharing: chatEnableFileSharing,
        allowNoWagon,
        requireImage,
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
  } catch {
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

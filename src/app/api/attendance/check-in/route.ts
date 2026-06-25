import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { checkIn, checkOut, getTodayAttendance } from '@/server/modules/attendance/service'
import { METRO_STATIONS, getDistanceInMeters } from '@/config/stations'
import { getSettingValue } from '@/server/modules/settings/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { action, stationId, geoLocation } = body

  // Geofencing verification helper
  const verifyGeofence = async (coordsStr?: string, targetStationId?: string) => {
    const isGeofencingEnabled = await getSettingValue('mobile.geofencingEnabled', true)
    const configuredRadius = await getSettingValue('mobile.geofencingRadius', 100)

    if (!isGeofencingEnabled) {
      const station = targetStationId 
        ? METRO_STATIONS.find(s => s.id === targetStationId) 
        : METRO_STATIONS[0]
      return { valid: true, station }
    }

    if (!coordsStr) return { valid: false, error: 'موقعیت مکانی دستگاه ارسال نشده است' }
    
    const parts = coordsStr.split(',')
    if (parts.length !== 2) return { valid: false, error: 'فرمت موقعیت مکانی نامعتبر است' }

    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])

    if (isNaN(lat) || isNaN(lng)) return { valid: false, error: 'مختصات جغرافیایی نامعتبر است' }

    // If target station is specified, check against that specific station
    if (targetStationId) {
      const station = METRO_STATIONS.find(s => s.id === targetStationId)
      if (!station) return { valid: false, error: 'ایستگاه مورد نظر در سیستم یافت نشد' }
      
      const distance = getDistanceInMeters(lat, lng, station.lat, station.lng)
      const radius = configuredRadius ?? station.radius
      if (distance <= radius) {
        return { valid: true, station }
      }
      return { 
        valid: false, 
        error: `شما در محدوده مجاز ${station.name} قرار ندارید. فاصله فعلی شما ${Math.round(distance)} متر است.` 
      }
    }

    // Otherwise, check if user is within ANY station's geofence
    for (const station of METRO_STATIONS) {
      const distance = getDistanceInMeters(lat, lng, station.lat, station.lng)
      const radius = configuredRadius ?? station.radius
      if (distance <= radius) {
        return { valid: true, station }
      }
    }

    return { valid: false, error: 'شما در محدوده جغرافیایی هیچ‌کدام از ایستگاه‌ها یا دپوهای خط ۱ حضور ندارید' }
  }

  if (action === 'checkIn') {
    const geoCheck = await verifyGeofence(geoLocation, stationId)
    if (!geoCheck.valid) {
      return NextResponse.json(
        { error: geoCheck.error },
        { status: 400 }
      )
    }

    const record = await checkIn({
      userId: user.id,
      stationId: geoCheck.station?.id || stationId,
      geoLocation,
      method: 'gps_geofence',
    })
    return NextResponse.json({ data: record }, { status: 201 })
  }

  if (action === 'checkOut') {
    // For checkout, we also verify location if provided, to ensure they didn't leave without recording properly
    if (geoLocation) {
      const geoCheck = await verifyGeofence(geoLocation)
      if (!geoCheck.valid) {
        return NextResponse.json(
          { error: geoCheck.error },
          { status: 400 }
        )
      }
    }

    await checkOut(user.id, geoLocation)
    return NextResponse.json({ data: { success: true } })
  }

  return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 })
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const record = await getTodayAttendance(user.id)
  return NextResponse.json({ data: record })
}


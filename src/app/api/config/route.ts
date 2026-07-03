import { NextResponse } from 'next/server'
import { getSettingValue } from '@/server/modules/settings/service'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  try {
    const appName = await getSettingValue('general.appName', 'سیر و حرکت خط یک مترو')
    const brandColor = await getSettingValue('general.brandColor', '#e53935')
    const maintenanceMode = await getSettingValue('general.maintenanceMode', false)
    const systemNotice = await getSettingValue('general.systemNotice', 'کلیه راهبران خط ۱ با توجه به برودت هوا موظف به رعایت سرعت مطمئنه در بخش روباز ریل هستند.')
    const allowRegistration = await getSettingValue('general.allowRegistration', true)
    const passwordPolicyMinLength = await getSettingValue('general.passwordPolicyMinLength', 8)
    const directoryVisibleFields = await getSettingValue('directory.visible_fields', 'phone,email,personnelNo,post,shift,shiftType,group,startLocation,vehicles')
    
    // Shifts settings
    const showHolidays = await getSettingValue('shifts.show_holidays', true)

    // New mobile branding settings
    const appVersion = await getSettingValue('general.appVersion', 'نسخه ۱.۵.۰')
    const webVersion = await getSettingValue('general.webVersion', 'v0.1.1')
    const developerText = await getSettingValue('general.developerText', 'توسعه داده شده توسط بخش فناوری سیر و حرکت')
    const socialLinksRaw = await getSettingValue('general.socialLinks', '[]')
    let socialLinks = []
    try {
      socialLinks = JSON.parse(socialLinksRaw)
    } catch {
      socialLinks = []
    }

    // Leave types dynamically fetched
    const leaveTypeSettings = await prisma.setting.findMany({
      where: { key: { startsWith: 'leave.type.' }, isEnabled: true }
    })
    
    const leaveTypes = leaveTypeSettings.map(s => {
      let maxDaysPerMonth = 0
      let requiresApproval = false
      try {
        const parsed = JSON.parse(s.value)
        maxDaysPerMonth = parsed.maxDaysPerMonth || 0
        requiresApproval = parsed.requiresApproval ?? false
      } catch {
        // ignore parse errors
      }
      return {
        label: s.label,
        value: s.key.replace('leave.type.', ''),
        maxDaysPerMonth,
        requiresApproval
      }
    })

    // If no leave types exist, fallback to defaults
    if (leaveTypes.length === 0) {
      leaveTypes.push(
        { label: 'استحقاقی', value: 'annual', maxDaysPerMonth: 0, requiresApproval: false },
        { label: 'استعلاجی', value: 'sick', maxDaysPerMonth: 0, requiresApproval: false },
        { label: 'مأموریت', value: 'mission', maxDaysPerMonth: 0, requiresApproval: false },
        { label: 'اضافه کار', value: 'overtime', maxDaysPerMonth: 0, requiresApproval: false },
        { label: 'کشیک', value: 'oncall', maxDaysPerMonth: 0, requiresApproval: false }
      )
    }

    // Mobile banner settings
    const bannerEnabled = await getSettingValue('mobile.dashboard.banner.enabled', true)
    let bannerUrl = await getSettingValue('mobile.dashboard.banner.url', 'https://picsum.photos/id/1050/800/250')
    const bannerLink = await getSettingValue('mobile.dashboard.banner.link', 'https://metro.tehran.ir')

    // App Download settings
    const downloadTitle = await getSettingValue('download.title', 'دانلود اپلیکیشن پرسنلی خط ۱')
    const downloadDescription = await getSettingValue('download.description', 'نسخه‌های رسمی اندروید، آیفون و وب‌اپلیکیشن برای استفاده پرسنل و راهبران خط یک متروی تهران')
    const downloadAndroidType = await getSettingValue('download.android.type', 'url')
    let downloadAndroidValue = await getSettingValue('download.android.value', 'https://metro.tehran.ir')
    const downloadIosType = await getSettingValue('download.ios.type', 'url')
    let downloadIosValue = await getSettingValue('download.ios.value', 'https://metro.tehran.ir')
    const downloadWebUrl = await getSettingValue('download.web.url', 'https://metro.tehran.ir')

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    // Convert relative URL to absolute
    if (bannerUrl.startsWith('/')) {
      bannerUrl = `${baseUrl}${bannerUrl}`
    }
    if (downloadAndroidValue.startsWith('/')) {
      downloadAndroidValue = `${baseUrl}${downloadAndroidValue}`
    }
    if (downloadIosValue.startsWith('/')) {
      downloadIosValue = `${baseUrl}${downloadIosValue}`
    }

    return NextResponse.json({
      data: {
        appName,
        brandColor,
        maintenanceMode,
        systemNotice,
        allowRegistration,
        passwordPolicyMinLength,
        directory: {
          visibleFields: directoryVisibleFields,
        },
        shifts: {
          showHolidays,
        },
        appVersion,
        webVersion,
        developerText,
        socialLinks,
        leaveTypes,
        mobile: {
          dashboardBanner: {
            enabled: bannerEnabled,
            url: bannerUrl,
            link: bannerLink
          }
        },
        download: {
          title: downloadTitle,
          description: downloadDescription,
          androidType: downloadAndroidType,
          androidValue: downloadAndroidValue,
          iosType: downloadIosType,
          iosValue: downloadIosValue,
          webUrl: downloadWebUrl
        }
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در دریافت پیکربندی عمومی' },
      { status: 500 }
    )
  }
}

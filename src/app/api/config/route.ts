import { NextResponse } from 'next/server'
import { getSettingValue } from '@/server/modules/settings/service'

export async function GET() {
  try {
    const appName = await getSettingValue('general.appName', 'سیر و حرکت خط یک مترو')
    const brandColor = await getSettingValue('general.brandColor', '#e53935')
    const maintenanceMode = await getSettingValue('general.maintenanceMode', false)
    const systemNotice = await getSettingValue('general.systemNotice', 'کلیه راهبران خط ۱ با توجه به برودت هوا موظف به رعایت سرعت مطمئنه در بخش روباز ریل هستند.')
    const allowRegistration = await getSettingValue('general.allowRegistration', true)
    const passwordPolicyMinLength = await getSettingValue('general.passwordPolicyMinLength', 8)
    const directoryVisibleFields = await getSettingValue('directory.visible_fields', 'phone,email,personnelNo,post,shift,shiftType,group,startLocation,vehicles')

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
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'خطا در دریافت پیکربندی عمومی' },
      { status: 500 }
    )
  }
}

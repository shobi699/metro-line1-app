import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:read')
  if (permErr) return authErrorResponse(permErr)

  try {
    const theme = await prisma.uiTheme.findFirst() || {
      primaryColor: '#ae0011',
      accentColor: '#575e70',
      radius: 12,
      fontSize: 'md',
      darkModeDefault: false,
      logoUrl: '',
      apiBaseUrl: 'https://metro.qzz.io',
    }
    return NextResponse.json({ data: theme })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const { primaryColor, accentColor, radius, fontSize, logoUrl, apiBaseUrl } = body

    let theme = await prisma.uiTheme.findFirst()

    const before = theme ? { ...theme } : null

    if (theme) {
      theme = await prisma.uiTheme.update({
        where: { id: theme.id },
        data: {
          primaryColor: primaryColor ?? theme.primaryColor,
          accentColor: accentColor ?? theme.accentColor,
          radius: typeof radius === 'number' ? radius : theme.radius,
          fontSize: fontSize ?? theme.fontSize,
          logoUrl: logoUrl ?? theme.logoUrl,
          apiBaseUrl: apiBaseUrl ?? theme.apiBaseUrl,
        },
      })
    } else {
      theme = await prisma.uiTheme.create({
        data: {
          primaryColor: primaryColor ?? '#ae0011',
          accentColor: accentColor ?? '#575e70',
          radius: typeof radius === 'number' ? radius : 12,
          fontSize: fontSize ?? 'md',
          logoUrl: logoUrl ?? '',
          apiBaseUrl: apiBaseUrl ?? 'https://metro.qzz.io',
        },
      })
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'UiTheme',
        entityId: theme.id,
        action: 'update',
        before: before ? (before as any) : undefined,
        after: theme as any,
        reason: 'تغییر رنگ‌ها و تنظیمات تم موبایل',
      },
    })

    return NextResponse.json({
      message: 'تنظیمات تم با موفقیت بروزرسانی شد',
      data: theme,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

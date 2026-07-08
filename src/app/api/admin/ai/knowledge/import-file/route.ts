import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import mammoth from 'mammoth'

// Polyfill DOMMatrix for pdfjs-dist running in Node environment
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: any) {
      if (Array.isArray(init)) {
        this.a = init[0]; this.b = init[1]; this.c = init[2]; this.d = init[3]; this.e = init[4]; this.f = init[5];
      }
    }
  };
}

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let extractedText = ''

    if (fileName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      extractedText = result.value || ''
    } else if (fileName.endsWith('.pdf')) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse')
      const parser = new PDFParse(new Uint8Array(fileBuffer))
      const result = await parser.getText()
      extractedText = result.text || ''
    } else {
      return NextResponse.json({ 
        error: 'فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل PDF یا Word (.docx) انتخاب کنید.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      data: {
        text: extractedText.trim(),
        title: file.name.replace(/\.(pdf|docx)$/i, '').trim()
      } 
    })
  } catch (error: any) {
    console.error('[POST /api/admin/ai/knowledge/import-file] Error:', error)
    return NextResponse.json(
      { error: error.message || 'خطا در پردازش و استخراج متن فایل' },
      { status: 500 }
    )
  }
}

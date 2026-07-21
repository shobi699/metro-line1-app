import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { AIGateway } from '@/server/modules/ai/gateway'
import { verifyAccessToken } from '@/server/auth/jwt'
import mammoth from 'mammoth'

// Polyfill DOMMatrix for pdfjs-dist running in Node environment (required by pdf-parse)
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

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = (await verifyAccessToken(token)) as any
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const rawText = formData.get('text') as string | null

    let contentToAnalyze = ''
    if (file) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name.toLowerCase()

      if (fileName.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        contentToAnalyze += (result.value || '') + '\n'
      } else if (fileName.endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PDFParse } = require('pdf-parse')
        const parser = new PDFParse(new Uint8Array(fileBuffer))
        const result = await parser.getText()
        contentToAnalyze += (result.text || '') + '\n'
      } else if (fileName.endsWith('.txt')) {
        contentToAnalyze += fileBuffer.toString('utf-8') + '\n'
      } else {
        return NextResponse.json({ 
          error: 'فرمت فایل پشتیبانی نمی‌شود. لطفا فایل PDF، Word (.docx) یا متنی (.txt) انتخاب کنید.' 
        }, { status: 400 })
      }
    }

    if (rawText) {
      contentToAnalyze += rawText + '\n'
    }

    contentToAnalyze = contentToAnalyze.trim()
    if (!contentToAnalyze) {
      return NextResponse.json({ error: 'هیچ متن یا فایلی برای تحلیل ارسال نشده است' }, { status: 400 })
    }

    const systemPrompt = `
You are an advanced AI technical operations assistant for the Tehran Metro.
Your job is to analyze the provided operations manuals, troubleshooting procedures, or reports, extract any troubleshooting procedures, state-machines, or flowcharts, and represent them as structured Mermaid flowcharts.
Return the output as a valid JSON object matching the JSON schema below.

Output Schema:
{
  "catalogs": [
    {
      "title": "A descriptive Persian/Farsi title for this troubleshooting flowchart",
      "category": "A Persian/Farsi category for grouping (e.g., 'AC', 'DC', 'عمومی', 'سیستم ترمز', 'پنوماتیک')",
      "content": "Valid Mermaid.js TD/LR flowchart content representing the procedure"
    }
  ]
}

STRICT MERMAID RULES:
1. Every catalog content must start with 'flowchart TD' or 'flowchart LR'. Do NOT enclose inside markdown blocks (e.g. do NOT use \`\`\`mermaid).
2. Every node in the flowchart MUST have an alphanumeric English ID (A, B, C, N1, N2).
3. All Persian/Farsi text in nodes must be wrapped in double quotes. (e.g., A["متن شروع"])
4. For arrows with text, you must use EXACTLY this syntax: NodeID1 -->|"متن روی یال"| NodeID2
5. FORBIDDEN: Do NOT use \`-- متن --\` or \`--متن--\`. This will crash the system. Only use \`-->|"متن"|\`.
6. Properly close all braces, brackets, and quotes. Example: B{"آیا شیر ترمز باز است؟"}
7. Do not return any other text, only return the JSON object.
`

    const response = await AIGateway.routeRequest(systemPrompt + '\n\n' + contentToAnalyze)
    let jsonText = response.text.trim()
    
    // Clean up potential markdown formatting
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7, jsonText.lastIndexOf('```')).trim()
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3, jsonText.lastIndexOf('```')).trim()
    }

    let parsed: { catalogs?: Array<{ title: string; category: string; content: string }> }
    try {
      parsed = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse AI JSON output:', jsonText, parseError)
      return NextResponse.json({ error: 'خروجی هوش مصنوعی قالب معتبر JSON ندارد. مجدداً تلاش کنید.' }, { status: 500 })
    }

    if (!parsed.catalogs || !Array.isArray(parsed.catalogs)) {
      return NextResponse.json({ error: 'هیچ کاتالوگ معتبری از سند استخراج نشد' }, { status: 500 })
    }

    const createdCatalogs = []
    for (const item of parsed.catalogs) {
      if (!item.title || !item.content) continue

      // Clean up potential markdown formatting from individual content
      let cleanMermaid = item.content.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim()
      if (cleanMermaid.startsWith('mermaid')) {
        cleanMermaid = cleanMermaid.substring(7).trim()
      }

      const newCatalog = await prisma.technicalCatalog.create({
        data: {
          title: item.title.trim(),
          category: (item.category || 'عمومی').trim(),
          content: cleanMermaid,
          authorId: decoded.id
        }
      })

      // Write Audit Log
      await prisma.auditLog.create({
        data: {
          actorId: decoded.id,
          entity: 'TechnicalCatalog',
          entityId: newCatalog.id,
          action: 'create',
          after: { title: newCatalog.title, category: newCatalog.category, source: 'ai_document_agent' }
        }
      })

      createdCatalogs.push(newCatalog)
    }

    return NextResponse.json({ catalogs: createdCatalogs })
  } catch (error: any) {
    console.error('[POST /api/ai/catalogs/analyze-doc] Error:', error)
    return NextResponse.json(
      { error: error.message || 'خطا در تحلیل سند و ساخت کاتالوگ' },
      { status: 500 }
    )
  }
}

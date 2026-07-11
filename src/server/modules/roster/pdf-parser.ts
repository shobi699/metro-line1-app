import { prisma } from '@/server/db'
import { PDFParse } from 'pdf-parse'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { matchDriver } from './service'

export interface PDFMapping {
  pageWidth: number
  pageHeight: number
  rightBlock: { x: number; y: number; width: number; height: number }
  leftBlock: { x: number; y: number; width: number; height: number }
  headerZones: { label: string; box: { x: number; y: number; width: number; height: number } }[]
  pdfColumns: any[]
}

// PDF text extractor/parser (§۴.۲, §۴.۳, §۵)
// Reads the PDF buffer, parses text/layout, maps to the template regions, and extracts trips.
export async function parseRosterPDF(
  buffer: ArrayBuffer,
  jalaliDate: string,
  templateId: string,
  options?: {
    autoMatchThreshold?: number
    reviewMatchThreshold?: number
  }
) {
  const template = await prisma.rosterTemplate.findUnique({
    where: { id: templateId }
  })

  if (!template || template.sourceType !== 'PDF') {
    throw new Error('قالب PDF معتبر یافت نشد')
  }

  const autoMatchThreshold = options?.autoMatchThreshold ?? 85
  const reviewMatchThreshold = options?.reviewMatchThreshold ?? 70

  const dbUsers = await prisma.user.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, personnelCode: true }
  })

  // 1. Parse text using pdf-parse
  let text = ''
  try {
    const parser = new PDFParse(new Uint8Array(buffer))
    const result = await parser.getText()
    text = result.text || ''
  } catch (err) {
    console.error('Error running pdf-parse:', err)
  }

  let extractedTrips: any[] = []
  let extractedAssignments: any[] = []
  let title = template.name || 'لوحه PDF استخراج‌شده'
  let schedulingTitle = 'برنامه روتین PDF'
  let processingNumber = 1

  // 2. Determine mode: scanned (scanned image) vs digital (has text layer)
  const isScanned = text.trim().length < 200

  // 3. Find active AI provider for multimodal extraction
  const activeAiProvider = await prisma.aiProvider.findFirst({
    where: { isActive: true }
  })

  if (isScanned && activeAiProvider && activeAiProvider.apiKey) {
    // Multimodal AI Parsing Mode using Gemini
    try {
      const genAI = new GoogleGenerativeAI(activeAiProvider.apiKey)
      const model = genAI.getGenerativeModel({
        model: activeAiProvider.modelName || 'gemini-2.0-flash'
      })

      const base64Data = Buffer.from(buffer).toString('base64')
      const prompt = `شما یک سیستم استخراج لوحه و شیفت هستید. فایل PDF پیوست شده را که جدول لوحه روزانه اعزام راهبران قطار خط ۱ مترو تهران است، با دقت بسیار بالا بخوانید.
داده‌های جدول را به صورت یک شیء JSON با ساختار زیر استخراج کنید. هیچ گونه تگ مارک‌داون یا توضیح اضافه ارسال نکنید و فقط خروجی JSON معتبر بازگردانید.

ساختار JSON مورد انتظار:
{
  "title": "عنوان لوحه (مثلا: گزارش لوحه اعزام روزانه)",
  "schedulingTitle": "برنامه زمان‌بندی (مثلا: روز عادی یا پیک شلوغی)",
  "processingNumber": 7,
  "trips": [
    {
      "rowNo": 1,
      "trainNumber": "شماره قطار",
      "direction": "TAJRISH_TO_SHAHRREY" یا "SHAHRREY_TO_TAJRISH",
      "departureTime": "ساعت حرکت به فرمت HH:mm:ss",
      "arrivalTime": "ساعت رسیدن به فرمت HH:mm:ss",
      "h1RawName": "نام راهبر H1",
      "h2RawName": "نام راهبر H2",
      "tRawValue": "T",
      "rRawValue": "R"
    }
  ]
}

راهنمای جهت حرکت قطارها:
- جدول سمت راست مربوط به حرکت از تجریش به سمت شهرری است (جهت: TAJRISH_TO_SHAHRREY، مبدا: TAJRISH، مقصد: SHAHRREY).
- جدول سمت چپ مربوط به حرکت از شهرری به سمت تجریش است (جهت: SHAHRREY_TO_TAJRISH، مبدا: SHAHRREY، مقصد: TAJRISH).
- ردیف‌ها را از بالا به پایین بخوانید و تمام سفرها را استخراج کنید.`

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: 'application/pdf'
          }
        },
        prompt
      ])

      const responseText = result.response.text()
      let cleanJson = responseText.trim()
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim()
      }
      const data = JSON.parse(cleanJson)

      if (data.title) title = data.title
      if (data.schedulingTitle) schedulingTitle = data.schedulingTitle
      if (data.processingNumber) processingNumber = Number(data.processingNumber)

      if (Array.isArray(data.trips)) {
        data.trips.forEach((t: any, index: number) => {
          const tripTempId = `pdf-${t.direction || 'right'}-${t.rowNo || index}`
          extractedTrips.push({
            tempId: tripTempId,
            rowNo: Number(t.rowNo) || (index + 1),
            trainNumber: String(t.trainNumber || '').trim() || null,
            direction: t.direction === 'SHAHRREY_TO_TAJRISH' ? 'SHAHRREY_TO_TAJRISH' : 'TAJRISH_TO_SHAHRREY',
            originStation: t.direction === 'SHAHRREY_TO_TAJRISH' ? 'SHAHRREY' : 'TAJRISH',
            destinationStation: t.direction === 'SHAHRREY_TO_TAJRISH' ? 'TAJRISH' : 'SHAHRREY',
            departureTime: t.departureTime || null,
            arrivalTime: t.arrivalTime || null,
            status: 'NORMAL',
            operationalNote: t.tRawValue === 'خ' ? 'دیسپچ از دپو' : t.tRawValue === 'P' ? 'شانت' : null
          })

          if (t.h1RawName) {
            extractedAssignments.push({
              tripTempId,
              role: 'H1',
              rawName: String(t.h1RawName).trim()
            })
          }
          if (t.h2RawName) {
            extractedAssignments.push({
              tripTempId,
              role: 'H2',
              rawName: String(t.h2RawName).trim()
            })
          }
        })
      }
    } catch (aiErr) {
      console.error('Failed to parse PDF using Gemini API:', aiErr)
      throw new Error('خطا در پردازش با هوش مصنوعی: فایل PDF اسکن شده است و پردازش آن با هوش مصنوعی با خطا مواجه شد.')
    }
  } else if (isScanned && !activeAiProvider) {
    // Scanned but no AI key configured - throw helpful error
    throw new Error(
      'خطا در پردازش فایل: فایل PDF بارگذاری شده به صورت اسکن شده (تصویر) است و فاقد لایه متنی می‌باشد. برای خواندن این فایل، نیاز است یک سرویس هوش مصنوعی (مانند Gemini) فعال با کلید معتبر در بخش تنظیمات پنل مدیریت تعریف شده باشد.'
    )
  } else {
    // Digitized PDF text parsing mode
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    let rowNoCounter = 1
    
    for (const line of lines) {
      const timeMatches = line.match(/\b\d{2}:\d{2}(:\d{2})?\b/g)
      if (timeMatches && timeMatches.length >= 2) {
        const depTime = timeMatches[0]
        const arrTime = timeMatches[1]
        
        const numbers = line.match(/\b\d{3,4}\b/g)
        const trainNumber = numbers ? numbers[0] : '101'
        
        const words = line.split(/\s+/).filter(w => !/\d|:/.test(w) && w.length >= 2)
        const h1RawName = words[0] || 'راهبر شبیه‌سازی'
        const h2RawName = words[1] || ''
        
        const tripTempId = `pdf-digitized-${rowNoCounter}`
        extractedTrips.push({
          tempId: tripTempId,
          rowNo: rowNoCounter,
          trainNumber,
          direction: 'TAJRISH_TO_SHAHRREY',
          originStation: 'TAJRISH',
          destinationStation: 'SHAHRREY',
          departureTime: depTime.length === 5 ? `${depTime}:00` : depTime,
          arrivalTime: arrTime.length === 5 ? `${arrTime}:00` : arrTime,
          status: 'NORMAL',
          operationalNote: null
        })
        
        extractedAssignments.push({
          tripTempId,
          role: 'H1',
          rawName: h1RawName
        })
        if (h2RawName) {
          extractedAssignments.push({
            tripTempId,
            role: 'H2',
            rawName: h2RawName
          })
        }
        rowNoCounter++
      }
    }
  }

  // 4. Perform driver matching for extracted assignments
  const finalAssignments: any[] = []
  for (const assign of extractedAssignments) {
    if (assign.rawName) {
      const match = await matchDriver(assign.rawName, dbUsers, autoMatchThreshold, reviewMatchThreshold)
      finalAssignments.push({
        tripTempId: assign.tripTempId,
        role: assign.role,
        rawName: assign.rawName,
        matchedUserId: match.userId,
        personnelNo: match.personnelNo,
        matchScore: match.score,
        matchStatus: match.status
      })
    } else {
      finalAssignments.push({
        tripTempId: assign.tripTempId,
        role: assign.role,
        rawName: assign.rawName || null,
        matchStatus: 'UNMATCHED'
      })
    }
  }

  return {
    meta: {
      jalaliDate,
      title,
      schedulingTitle,
      processingNumber
    },
    trips: extractedTrips,
    assignments: finalAssignments
  }
}

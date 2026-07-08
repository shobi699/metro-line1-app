import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission } from '@/server/rbac/guard'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'

export const dynamic = 'force-dynamic'

// Helper function to parse questions from raw text (for docx and pdf)
function parseTextToQuestions(text: string): any[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const questions: any[] = []
  let currentQuestion: any = null

  // Question patterns: "1. ...", "1- ...", "1) ...", "سوال 1: ...", "سؤال 1 ...", or lines ending with "؟" or "?"
  const questionRegex = /^(?:سوال|سؤال|question)?\s*(\d+)[\.\-\:\)]\s*(.+)$/i

  // Option patterns: "الف) ...", "ب) ...", "ج) ...", "د) ...", "1) ...", "2) ...", "3) ...", "4) ..."
  const optionRegex = /^(?:([الفبجد]|\d|[abcd]))[\)\-\.\:\s]\s*(.+)$/i

  // Answer patterns: "پاسخ: ...", "جواب: ...", "کلید: ...", "correct: ..."
  const answerRegex = /^(?:پاسخ|جواب|کلید|گزینه صحیح|answer|correct)\s*[\:\-\=]?\s*(.+)$/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 1. Check if it's a new question
    const qMatch = line.match(questionRegex)
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        questions.push(currentQuestion)
      }
      currentQuestion = {
        text: qMatch[2],
        options: [],
        answer: 1
      }
      continue
    }

    // Fallback: If line ends with a question mark and we don't have an active question, treat it as a question text
    if ((line.endsWith('؟') || line.endsWith('?')) && !currentQuestion) {
      currentQuestion = {
        text: line,
        options: [],
        answer: 1
      }
      continue
    }

    // 2. Check if it's an option
    const oMatch = line.match(optionRegex)
    if (oMatch && currentQuestion && currentQuestion.options.length < 4) {
      const optionText = oMatch[2]
      currentQuestion.options.push(optionText)
      
      // If option is marked with an asterisk or "(صحیح)", set as correct answer
      if (line.includes('*') || line.includes('(صحیح)') || line.includes('✔')) {
        currentQuestion.answer = currentQuestion.options.length
        // Clean asterisk or indicator from option text
        currentQuestion.options[currentQuestion.options.length - 1] = optionText
          .replace(/\*|\(صحیح\)|\(صحیح\)|✔/g, '')
          .trim()
      }
      continue
    }

    // 3. Check if it's an answer indicator
    const aMatch = line.match(answerRegex)
    if (aMatch && currentQuestion) {
      const ansVal = aMatch[1].trim()
      
      // If it's a number (1-4)
      if (['1', '2', '3', '4', '۱', '۲', '۳', '۴'].includes(ansVal)) {
        const numMap: Record<string, number> = {
          '1': 1, '2': 2, '3': 3, '4': 4,
          '۱': 1, '۲': 2, '۳': 3, '۴': 4
        }
        currentQuestion.answer = numMap[ansVal]
      } else if (['الف', 'ب', 'ج', 'د'].includes(ansVal)) {
        const letterMap: Record<string, number> = { 'الف': 1, 'ب': 2, 'ج': 3, 'د': 4 }
        currentQuestion.answer = letterMap[ansVal]
      } else if (['a', 'b', 'c', 'd'].includes(ansVal.toLowerCase())) {
        const letterMap: Record<string, number> = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 }
        currentQuestion.answer = letterMap[ansVal.toLowerCase()]
      } else {
        // If it's text, try to find matching option
        const matchedIndex = currentQuestion.options.findIndex((opt: string) => opt === ansVal || ansVal.includes(opt) || opt.includes(ansVal))
        if (matchedIndex !== -1) {
          currentQuestion.answer = matchedIndex + 1
        }
      }
      continue
    }

    // If it's not a question, option, or answer, but we are inside a question and it has less than 4 options,
    // and it doesn't look like a question, let's treat it as a fallback option if it matches common separators
    if (currentQuestion && currentQuestion.options.length < 4 && line.length > 0 && !line.startsWith('سوال') && !line.startsWith('سؤال')) {
      // If it looks like a clean option line
      if (currentQuestion.options.length === 0 || line.length < 100) {
        currentQuestion.options.push(line)
      }
    }
  }

  // Push last question if valid
  if (currentQuestion && currentQuestion.options.length >= 2) {
    questions.push(currentQuestion)
  }

  return questions
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })
    const err = requirePermission(user, 'learning-admin:manage')
    if (err) return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: { message: 'فایلی ارسال نشده است' } }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let parsedQuestions: any[] = []

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // ── Parse Excel ──
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)

      parsedQuestions = rows.map((row: any, index: number) => {
        // Find question text column
        const text = row.question || row.text || row['صورت سوال'] || row['سؤال'] || row['عنوان'] || row['متن'] || Object.values(row)[0]
        
        // Find options columns
        const op1 = row.option1 || row.opt1 || row.op1 || row['گزینه ۱'] || row['گزینه 1'] || row['پاسخ ۱']
        const op2 = row.option2 || row.opt2 || row.op2 || row['گزینه ۲'] || row['گزینه 2'] || row['پاسخ ۲']
        const op3 = row.option3 || row.opt3 || row.op3 || row['گزینه ۳'] || row['گزینه 3'] || row['پاسخ ۳']
        const op4 = row.option4 || row.opt4 || row.op4 || row['گزینه ۴'] || row['گزینه 4'] || row['پاسخ ۴']

        // Find answer column
        const answerRaw = row.answer || row.correct || row.correctanswer || row['پاسخ صحیح'] || row['کلید'] || row['جواب']
        let answer = 1

        const options = [String(op1 || ''), String(op2 || ''), String(op3 || ''), String(op4 || '')].filter(Boolean)

        if (answerRaw) {
          const ansStr = String(answerRaw).trim()
          if (['1', '2', '3', '4'].includes(ansStr)) {
            answer = parseInt(ansStr)
          } else if (['الف', 'ب', 'ج', 'د'].includes(ansStr)) {
            const letterMap: Record<string, number> = { 'الف': 1, 'ب': 2, 'ج': 3, 'د': 4 }
            answer = letterMap[ansStr]
          } else {
            // Find option text matching answer
            const optIndex = options.findIndex(opt => opt === ansStr || opt.includes(ansStr) || ansStr.includes(opt))
            if (optIndex !== -1) {
              answer = optIndex + 1
            }
          }
        }

        return {
          id: `excel-q-${index}-${Date.now()}`,
          text: String(text || '').trim(),
          options: options.length >= 2 ? options : ['گزینه ۱', 'گزینه ۲', 'گزینه ۳', 'گزینه ۴'],
          answer
        }
      }).filter(q => q.text.length > 0)

    } else if (fileName.endsWith('.docx')) {
      // ── Parse Word ──
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      const text = result.value || ''
      parsedQuestions = parseTextToQuestions(text)

    } else if (fileName.endsWith('.pdf')) {
      // ── Parse PDF ──
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse')
      const parser = new PDFParse(new Uint8Array(fileBuffer))
      const result = await parser.getText()
      const text = result.text || ''
      parsedQuestions = parseTextToQuestions(text)

    } else {
      return NextResponse.json({ error: { message: 'فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل اکسل، ورد (docx) یا PDF انتخاب کنید.' } }, { status: 400 })
    }

    // Ensure options always has 4 options
    const formattedQuestions = parsedQuestions.map((q, idx) => {
      const opts = [...q.options]
      while (opts.length < 4) {
        opts.push(`گزینه ${opts.length + 1}`)
      }
      return {
        id: q.id || `imported-q-${idx}-${Date.now()}`,
        text: q.text,
        options: opts.slice(0, 4),
        answer: q.answer >= 1 && q.answer <= 4 ? q.answer : 1
      }
    })

    return NextResponse.json({ data: formattedQuestions })
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message || 'خطا در پردازش فایل' } }, { status: 500 })
  }
}

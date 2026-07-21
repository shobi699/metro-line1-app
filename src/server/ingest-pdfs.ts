import fs from 'node:fs'
import path from 'node:path'
import { prisma } from './db'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse')

function isArabicPersian(str: string): boolean {
  return /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str)
}

function fixVisualLine(line: string): string {
  const normalized = line.normalize('NFKC')
  const tokenRegex = /([A-Za-z0-9_\-]+)|([^\sA-Za-z0-9_\-]+)|(\s+)/g
  const matches = normalized.match(tokenRegex) || []
  
  const processedTokens = matches.map(token => {
    if (isArabicPersian(token)) {
      return Array.from(token).reverse().join('')
    }
    return token
  })

  return processedTokens.reverse().join('')
}

function fixTextIfReversed(text: string): string {
  let standardCount = 0
  let presentationCount = 0

  for (const c of text) {
    const code = c.charCodeAt(0)
    if (code >= 0x0600 && code <= 0x06FF) {
      standardCount++
    } else if ((code >= 0xFB50 && code <= 0xFDFF) || (code >= 0xFE70 && code <= 0xFEFF)) {
      presentationCount++
    }
  }

  const total = standardCount + presentationCount
  if (total > 0 && (presentationCount / total) > 0.1) {
    return text
      .split('\n')
      .map(line => fixVisualLine(line))
      .join('\n')
  }

  return text.normalize('NFKC')
}

// Ingest PDFs from lohe/ and lohe/docs/
async function main() {
  console.log('🚀 Ingestion process started...')
  
  // Find a suitable authorId (super_admin or admin)
  const author = await prisma.user.findFirst({
    where: {
      role: {
        key: { in: ['super_admin', 'admin'] }
      }
    }
  })

  if (!author) {
    console.error('❌ Error: No admin or super_admin user found to assign as author.')
    process.exit(1)
  }
  console.log(`👤 Author assigned: ${author.name} (${author.personnelCode})`)

  const directories = [
    path.resolve(process.cwd(), 'lohe'),
    path.resolve(process.cwd(), 'lohe', 'docs')
  ]

  let totalPdfs = 0
  let totalChunks = 0

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️ Directory does not exist: ${dir}`)
      continue
    }

    console.log(`📁 Scanning directory: ${dir}`)
    const files = fs.readdirSync(dir)
    const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'))
    
    for (const file of pdfFiles) {
      const filePath = path.join(dir, file)
      console.log(`📄 Processing PDF: ${file} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`)
      totalPdfs++

      try {
        const parser = new PDFParse({ url: filePath })
        const result = await parser.getText()
        const rawText = result.text.trim()
        const fullText = fixTextIfReversed(rawText)

        if (!fullText) {
          console.log(`⚠️ Warning: No text content extracted from ${file}. Skipping.`)
          continue
        }

        // Chunking the text to avoid database size limits and improve RAG retrieval accuracy
        // Chunk size: ~1200 characters, overlap: ~150 characters
        const chunkSize = 1200
        const overlap = 150
        const chunks: string[] = []

        let i = 0
        while (i < fullText.length) {
          const chunk = fullText.substring(i, i + chunkSize)
          if (chunk.trim()) {
            chunks.push(chunk.trim())
          }
          i += chunkSize - overlap
        }

        console.log(`📦 Split ${file} into ${chunks.length} chunks. Ingesting to DB...`)

        const fileSlugBase = encodeURIComponent(
          file
            .replace(/\.pdf$/i, '')
            .replace(/\s+/g, '-')
            .substring(0, 50)
        )

        for (let idx = 0; idx < chunks.length; idx++) {
          const chunkText = chunks[idx]
          const chunkSlug = `${fileSlugBase}-chunk-${idx}`
          const chunkTitle = `${file.replace(/\.pdf$/i, '')} - بخش ${idx + 1}`

          await prisma.knowledgeArticle.upsert({
            where: { slug: chunkSlug },
            update: {
              title: chunkTitle,
              body: chunkText,
              authorId: author.id,
              category: 'rulebook',
              tags: 'pdf-ingestion,' + file.replace(/\.pdf$/i, '').replace(/\s+/g, ','),
            },
            create: {
              title: chunkTitle,
              slug: chunkSlug,
              body: chunkText,
              authorId: author.id,
              category: 'rulebook',
              tags: 'pdf-ingestion,' + file.replace(/\.pdf$/i, '').replace(/\s+/g, ','),
            }
          })
          totalChunks++
        }
        console.log(`✅ Successfully ingested all chunks for ${file}`)
      } catch (err: any) {
        console.error(`❌ Failed to parse/ingest ${file}: ${err.message}`)
      }
    }
  }

  console.log(`\n🎉 Ingestion finished. Total PDFs processed: ${totalPdfs}. Total knowledge chunks inserted: ${totalChunks}.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...resolvedParams.path)
    
    // Security check: prevent directory traversal attacks
    const resolvedPath = path.resolve(filePath)
    const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads')
    if (!resolvedPath.startsWith(uploadsRoot)) {
      return new Response('Access Denied', { status: 403 })
    }

    const fileBuffer = await fs.readFile(resolvedPath)
    
    // Determine content type based on extension
    const ext = path.extname(resolvedPath).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.webp') contentType = 'image/webp'
    else if (ext === '.gif') contentType = 'image/gif'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.apk') contentType = 'application/vnd.android.package-archive'
    else if (ext === '.ipa') contentType = 'application/octet-stream'
    else if (ext === '.plist') contentType = 'application/xml'

    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    return new Response('File Not Found', { status: 404 })
  }
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Forbidden: This temporary database reset endpoint has been disabled.' },
    { status: 403 }
  )
}

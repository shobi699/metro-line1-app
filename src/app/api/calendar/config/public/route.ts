import { NextResponse } from 'next/server'
import { getCalendarConfig } from '@/server/modules/calendar/admin-service'

export async function GET() {
  const config = await getCalendarConfig()
  
  // Only expose public/safe configuration options
  return NextResponse.json({ 
    data: {
      dayStatusRules: config.dayStatusRules
    } 
  })
}

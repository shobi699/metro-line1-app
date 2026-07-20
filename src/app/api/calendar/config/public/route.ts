import { NextResponse } from 'next/server'
import { getCalendarConfig } from '@/server/modules/calendar/admin-service'

export async function GET() {
  const config = await getCalendarConfig()
  
  // Expose safe public configuration options for Life Calendar client
  return NextResponse.json({ 
    data: {
      shiftHours: config.shiftHours,
      movazafiRules: config.movazafiRules,
      userDayOverrideAllowed: config.userDayOverrideAllowed ?? false,
      dayStatusRules: config.dayStatusRules,
    } 
  })
}

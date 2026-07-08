import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { TripCardProps } from './TripCard'
import { MapPin, Clock, ArrowLeftRight, Phone, MessageSquare, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './ui/StatusBadge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface TripDetailsSheetProps {
  trip: TripCardProps | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function TripDetailsSheet({ trip, isOpen, onOpenChange }: TripDetailsSheetProps) {
  if (!trip) return null

  const origin = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری' : 'تجریش'
  const dest = trip.direction === 'SHAHRREY_TO_TAJRISH' ? 'تجریش' : 'شهرری'

  const handleCall = (name: string) => {
    toast.success(`تماس با ${name} در حال انجام است (شبیه‌سازی)`)
  }

  const handleMessage = (name: string) => {
    toast.success(`ارسال پیام به ${name} (شبیه‌سازی)`)
  }

  const handleReport = () => {
    toast.info('باز شدن فرم گزارش سریع برای این سفر (شبیه‌سازی)')
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-xl">جزئیات سفر</SheetTitle>
            <div className="flex items-center gap-2">
              {trip.isAmended && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  <AlertTriangle className="w-3 h-3 me-1" />
                  اصلاحیه {trip.amendmentNumber || ''}
                </Badge>
              )}
              {trip.status !== 'NORMAL' && (
                <StatusBadge status={trip.status} />
              )}
            </div>
          </div>
          <SheetDescription>
            مشاهده کامل اطلاعات و افراد مرتبط با این اعزام.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Route & Times Info */}
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm font-medium bg-background px-3 py-1.5 rounded-md border shadow-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{origin}</span>
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground mx-1" />
                  <span>{dest}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-mono bg-background px-3 py-1.5 rounded-md border shadow-sm">
                <span className="text-muted-foreground">قطار</span>
                <span className="font-bold text-base">{trip.trainNumber || '—'}</span>
              </div>
            </div>

            <div className="flex items-center justify-around py-2 border-t border-border/50 mt-2 pt-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> حرکت
                </div>
                <div className="font-mono text-xl font-bold">{trip.departureTime || '—'}</div>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> ورود
                </div>
                <div className="font-mono text-xl font-bold">{trip.arrivalTime || '—'}</div>
              </div>
            </div>
          </div>

          {/* Operational Note */}
          {trip.operationalNote && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/50 flex gap-3">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                <span className="font-bold block mb-1">توضیحات عملیاتی:</span>
                {trip.operationalNote}
              </div>
            </div>
          )}

          {/* Coworkers */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground">همکاران حاضر در این سفر</h3>
            <div className="space-y-2">
              {trip.assignments && trip.assignments.length > 0 ? (
                trip.assignments.map(assign => {
                  const isMe = assign.role === trip.myRole
                  return (
                    <div 
                      key={assign.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        isMe ? "bg-primary/5 border-primary/20" : "bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-8 justify-center font-mono">{assign.role}</Badge>
                          <span className="font-medium text-sm">{assign.name}</span>
                          {isMe && <Badge variant="default" className="scale-75 origin-right">شما</Badge>}
                        </div>
                        {assign.personnelNo && (
                          <span className="text-xs text-muted-foreground ms-10">پرسنلی: {assign.personnelNo}</span>
                        )}
                      </div>

                      {!isMe && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleMessage(assign.name)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-600/10" onClick={() => handleCall(assign.name)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground text-sm">
                  هنوز فردی برای این سفر تخصیص نیافته است.
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8 pt-4 border-t border-border/50 sm:justify-start">
          <Button variant="destructive" className="w-full" onClick={handleReport}>
            <AlertTriangle className="w-4 h-4 me-2" />
            گزارش سریع (تاخیر/خرابی)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

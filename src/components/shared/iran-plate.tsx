'use client'

import { cn } from '@/lib/utils'

interface IranPlateProps {
  /** Two-digit left number, e.g. "12" */
  num1: string
  /** Persian letter, e.g. "ب" */
  letter: string
  /** Three-digit right number, e.g. "345" */
  num2: string
  /** Two-digit city code, e.g. "22" (Tehran) */
  city: string
  /** Extra classes on root */
  className?: string
  /** Size variant */
  size?: 'sm' | 'md'
}

/**
 * Renders an Iranian vehicle license plate with realistic CSS styling.
 * Layout (RTL): [Iran flag + city code] | [num2 - letter - num1]
 *
 * The plate is white background with a blue zone on the left containing
 * the Iranian flag and city code, matching the real Iranian plate format.
 */
export function IranPlate({
  num1,
  letter,
  num2,
  city,
  className,
  size = 'sm',
}: IranPlateProps) {
  const isSm = size === 'sm'

  return (
    <div
      dir="ltr"
      className={cn(
        'inline-flex items-stretch rounded-[4px] border-2 border-neutral-700 bg-white overflow-hidden select-none',
        isSm ? 'h-7' : 'h-9',
        className,
      )}
    >
      {/* Blue zone — Iran flag + city code */}
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-[#003DA5] text-white shrink-0',
          isSm ? 'w-6 gap-0' : 'w-8 gap-0.5',
        )}
      >
        {/* Iran flag stripes */}
        <div className="flex flex-col items-center w-full">
          <div className={cn('w-3 bg-[#239F40]', isSm ? 'h-[2px]' : 'h-[3px]')} />
          <div className={cn('w-3 bg-white', isSm ? 'h-[2px]' : 'h-[3px]')} />
          <div className={cn('w-3 bg-[#DA0000]', isSm ? 'h-[2px]' : 'h-[3px]')} />
        </div>
        <span className={cn('font-bold leading-none', isSm ? 'text-[7px]' : 'text-[9px]')}>
          ایران
        </span>
        <span className={cn('font-bold font-mono leading-none', isSm ? 'text-[8px]' : 'text-[10px]')}>
          {city}
        </span>
      </div>

      {/* Plate number section */}
      <div
        className={cn(
          'flex items-center font-bold text-black font-mono tracking-wide',
          isSm ? 'px-1.5 gap-1 text-[11px]' : 'px-2.5 gap-1.5 text-sm',
        )}
      >
        <span>{num2}</span>
        <span className={cn('text-red-600 font-bold', isSm ? 'text-[10px]' : 'text-xs')}>
          {letter}
        </span>
        <span>{num1}</span>
      </div>
    </div>
  )
}

/**
 * Parse a vehicle object from customFields and render plate.
 * Vehicle shape: { plateNum1, plateLetter, plateNum2, plateCity, carType, carPlate }
 */
export function VehiclePlateFromData({
  vehicle,
  className,
  size = 'sm',
}: {
  vehicle: Record<string, unknown>
  className?: string
  size?: 'sm' | 'md'
}) {
  const num1 = String(vehicle.plateNum1 || '')
  const letter = String(vehicle.plateLetter || '')
  const num2 = String(vehicle.plateNum2 || '')
  const city = String(vehicle.plateCity || '')

  // If no plate data, don't render
  if (!num1 && !letter && !num2 && !city) return null

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <IranPlate num1={num1} letter={letter} num2={num2} city={city} size={size} />
      {typeof vehicle.carType === 'string' && vehicle.carType && (
        <span className="text-[10px] text-foreground-muted">{vehicle.carType}</span>
      )}
    </div>
  )
}

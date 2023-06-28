import React from 'react'

type FormatProp = 'numeric' | 'short' | 'long'
type Props = { time?: number; date?: Date; variant?: FormatProp }

export const timeOptions: ILookup<Intl.DateTimeFormatOptions, FormatProp> = {
  numeric: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  },
  short: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  long: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
}

export const Timestamp: React.FC<Props> = ({ time: startTime, date: startDate, variant = 'numeric' }) => {
  startDate = startDate || (startTime ? new Date(startTime) : undefined)
  if (!startDate) return null
  const display = !isNaN(startDate.getTime()) && startDate.toLocaleDateString(navigator.language, timeOptions[variant])
  return <>{display || '-'}</>
}

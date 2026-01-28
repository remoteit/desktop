import React from 'react'

type FormatProp = 'numeric' | 'minutes' | 'short' | 'long'
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
  minutes: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
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
  const display = !isNaN(startDate.getTime()) && startDate.toLocaleString(navigator.language, timeOptions[variant])
  return <>{display || '-'}</>
}

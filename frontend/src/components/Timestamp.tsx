import React from 'react'

export const timeOptions: ILookup<Intl.DateTimeFormatOptions> = {
  numeric: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  },
  long: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  },
}

type Props = { startTime?: number; startDate?: Date; format?: 'numeric' | 'long' }

export const Timestamp: React.FC<Props> = ({ startTime, startDate, format = 'numeric' }) => {
  startDate = startDate || (startTime ? new Date(startTime) : undefined)
  if (!startDate) return null
  const display = !isNaN(startDate.getTime()) && startDate.toLocaleDateString(navigator.language, timeOptions[format])
  return <>{display || '-'}</>
}

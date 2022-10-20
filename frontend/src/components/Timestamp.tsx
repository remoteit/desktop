import React from 'react'

export const timeOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

type Props = { startTime?: number; startDate?: Date }

export const Timestamp: React.FC<Props> = ({ startTime, startDate }) => {
  startDate = startDate || (startTime ? new Date(startTime) : undefined)
  if (!startDate) return null
  const display = !isNaN(startDate.getTime()) && startDate.toLocaleDateString(navigator.language, timeOptions)
  return <>{display || '-'}</>
}

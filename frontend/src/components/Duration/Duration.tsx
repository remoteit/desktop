import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'
import humanize, { HumanizerOptions } from 'humanize-duration'

export const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

type Props = {
  startTime?: number
  endTime?: number
  startDate?: Date
  endDate?: Date
  ago?: boolean
  humanizeOptions?: HumanizerOptions
}

export const Duration: React.FC<Props> = ({
  startTime,
  endTime,
  startDate,
  endDate,
  ago = false,
  humanizeOptions = { largest: 2 },
}) => {
  startTime = startTime || startDate?.getTime()
  endTime = endTime || endDate?.getTime()
  const [now, setNow] = useState<number>(endTime || Date.now())
  const aDay = 1000 * 60 * 60 * 24

  useInterval(() => {
    if (startTime && !endTime) setNow(Date.now())
  }, 1000)

  if (!startTime) return null

  const duration = Math.round((now - startTime) / 1000) * 1000
  const display =
    duration > aDay
      ? new Date(startTime).toLocaleString(navigator.language, dateOptions)
      : humanize(duration, humanizeOptions) + (ago ? ' ago' : '')

  return <>{display || '-'}</>
}

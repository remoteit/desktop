import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'
import humanize from 'humanize-duration'

export const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

export const Duration: React.FC<{ startTime?: number; endTime?: number; ago?: boolean }> = ({
  startTime,
  endTime = Date.now(),
  ago = false,
}) => {
  const [now, setNow] = useState<number>(endTime)
  const aDay = 1000 * 60 * 60 * 24

  useInterval(() => {
    if (startTime) setNow(endTime)
  }, 1000)

  if (!startTime) return null
  const duration = Math.round((now - startTime) / 1000) * 1000
  const display =
    duration > aDay
      ? new Date(startTime).toLocaleString(undefined, dateOptions)
      : humanize(duration, { largest: 2 }) + (ago ? ' ago' : '')
  return <>{display || '-'}</>
}

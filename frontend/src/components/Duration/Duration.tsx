import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'
import humanize, { HumanizerOptions } from 'humanize-duration'

export const dateDefaults: Intl.DateTimeFormatOptions = {
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
  dateOptions?: Intl.DateTimeFormatOptions
  tiered?: boolean
}

export const Duration: React.FC<Props> = ({
  startTime,
  endTime,
  startDate,
  endDate,
  ago = false,
  humanizeOptions = { largest: 2 },
  dateOptions = dateDefaults,
  tiered = false,
}) => {
  startTime = startTime || startDate?.getTime()
  endTime = endTime || endDate?.getTime()
  const [now, setNow] = useState<number>(endTime || Date.now())

  const anHour = 1000 * 60 * 60
  const aDay = anHour * 24
  const aMonth = aDay * 30
  const aYear = aDay * 365

  useInterval(() => {
    if (startTime && !endTime) setNow(Date.now())
  }, 1000)

  if (!startTime) return null

  const duration = Math.round((now - startTime) / 1000) * 1000

  let display: string
  if (tiered) {
    const locale = navigator.language
    const date = new Date(startTime)
    if (duration < aDay) {
      // hour:min — "3 hours, 25 minutes" (controlled by humanizeOptions)
      display = humanize(duration, humanizeOptions) + (ago ? ' ago' : '')
    } else if (duration < aMonth) {
      // day:hour — "5 days, 3 hours"
      display = humanize(duration, { largest: 2, units: ['d', 'h'], round: true }) + (ago ? ' ago' : '')
    } else if (duration < aYear) {
      // month:day — "Feb 17"
      display = date.toLocaleString(locale, { month: 'short', day: 'numeric' })
    } else {
      // month:year — "Feb 2025"
      display = date.toLocaleString(locale, { month: 'short', year: 'numeric' })
    }
  } else {
    display =
      duration > aDay
        ? new Date(startTime).toLocaleString(navigator.language, dateOptions)
        : humanize(duration, humanizeOptions) + (ago ? ' ago' : '')
  }

  return <>{display || '-'}</>
}

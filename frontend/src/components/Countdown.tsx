import React, { useState } from 'react'
import { useInterval } from '../hooks/useInterval'
import humanize from 'humanize-duration'

type Props = {
  endTime?: number
  endDate?: Date
}

export const Countdown: React.FC<Props> = ({ endTime, endDate }) => {
  endTime = endTime || endDate?.getTime()
  const [now, setNow] = useState<number>(endTime || Date.now())

  useInterval(() => {
    if (endTime) setNow(Date.now())
  }, 1000)

  if (!endTime) return null
  const duration = Math.round((endTime - now) / 1000) * 1000
  if (duration < 0) return null
  const display = humanize(duration, { largest: 2 })
  return <>{display || '-'}</>
}

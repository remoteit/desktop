import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'
import humanize from 'humanize-duration'

export const Duration: React.FC<{ startTime?: number; ago?: boolean }> = ({ startTime, ago = false }) => {
  const [now, setNow] = useState(Date.now())
  const aDay = 1000 * 60 * 60 * 24

  useInterval(() => {
    if (startTime) setNow(Date.now)
  }, 1000)

  if (!startTime) return null
  const duration = Math.round((now - startTime) / 1000) * 1000

  return <>{duration > aDay ? new Date(startTime).toLocaleString() : humanize(duration) + (ago && ' ago')}</>
}

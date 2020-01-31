import React, { useState } from 'react'
import { useInterval } from '../../hooks/useInterval'
import humanize from 'humanize-duration'

export const Duration: React.FC<{ startTime?: number }> = ({ startTime }) => {
  const [now, setNow] = useState(Date.now())

  useInterval(() => {
    setNow(Date.now)
  }, 1000)

  if (!startTime) return null

  return <>{humanize(Math.round((now - startTime) / 1000) * 1000)}</>
}

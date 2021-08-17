import React from 'react'

export const Percent: React.FC<{ value: number }> = ({ value }) => {
  return value ? <>{Math.round(value)}%</> : null
}

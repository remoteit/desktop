import React from 'react'

export const Round: React.FC<{ value: number }> = ({ value }) => {
  return <>{Math.round(value * 10) / 10}</>
}

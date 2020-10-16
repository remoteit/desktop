import React from 'react'

type Props = { count: number }

export const LicensingTitle: React.FC<Props> = ({ count }) => {
  if (count < 1) return <>You are not licensed for any services.</>
  if (count === 1) return <>You are only licensed for one service.</>
  return <>You are only licensed for {count} services.</>
}

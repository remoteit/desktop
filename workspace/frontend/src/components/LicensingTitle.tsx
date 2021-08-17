import React from 'react'

type Props = { count: number }

export const LicensingTitle: React.FC<Props> = ({ count }) => {
  if (count < 1) return <>does not include services.</>
  if (count === 1) return <>is for one service.</>
  return <>is for {count} services.</>
}

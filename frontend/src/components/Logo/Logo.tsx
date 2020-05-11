import React from 'react'
import logoColor from './logo.svg'
import logoWhite from './logo-white.svg'
import logomarkWhite from './logomark-white.svg'

interface Props {
  mark?: boolean
  white?: boolean
  width?: number
  className?: string
}

export const Logo: React.FC<Props> = ({ white = false, mark = false, width = 140, className, ...props }) => {
  let logo = logoColor

  if (white && mark) logo = logomarkWhite
  if (white && !mark) logo = logoWhite

  return <img src={logo} alt="remote.it" width={String(width)} className={className} {...props} />
}

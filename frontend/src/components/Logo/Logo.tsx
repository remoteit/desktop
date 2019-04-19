import React from 'react'
import logoColor from './logo-color.png'
import logoWhite from './logo-white.svg'
import logomarkWhite from './logomark-white.svg'

export interface Props extends React.HTMLProps<HTMLAnchorElement> {
  mark?: boolean
  white?: boolean
  width?: number
}

export function Logo({
  white = false,
  mark = false,
  width = 150,
  ...props
}: Props) {
  let logo = logoColor
  // TODO: add color mark
  if (white && mark) logo = logomarkWhite
  if (white && !mark) logo = logoWhite

  return (
    <a href="/web/" {...props}>
      <img src={logo} alt="remote.it" width={`${width}`} />
    </a>
  )
}

import React from 'react'
import logoColor from '../../jump/assets/logo.svg'
import logoWhite from './logo-white.svg'
import logomarkWhite from './logomark-white.svg'

export interface LogoProps {
  mark?: boolean
  white?: boolean
  width?: number
}

export function Logo({
  white = false,
  mark = false,
  width = 125,
}: LogoProps & React.HTMLProps<HTMLAnchorElement>) {
  let logo = logoColor

  if (white && mark) logo = logomarkWhite
  if (white && !mark) logo = logoWhite

  return <img src={logo} alt="remote.it" width={String(width)} />
}

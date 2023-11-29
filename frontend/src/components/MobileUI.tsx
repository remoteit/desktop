import React from 'react'
import { useMediaQuery } from '@mui/material'
import { MOBILE_WIDTH } from '../constants'

export const MobileUI: React.FC<{ hide?: boolean; children?: React.ReactNode }> = ({ hide, children }) => {
  let mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)

  if (hide) mobile = !mobile

  return mobile ? <>{children}</> : null
}

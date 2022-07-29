// import { fab } from '@fortawesome/free-brands-svg-icons'
import { fal, IconName } from '@fortawesome/pro-light-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Box } from '@mui/material'
import { colors, spacing, BrandColor } from '../../styles/variables'

library.add(fal)

export type IconProps = Omit<FontAwesomeIconProps, 'icon'> & {
  color?: BrandColor
  inline?: boolean
  name: string
  // scale?: FontSize
}

export function Icon({
  color,
  name,
  inline,
  // scale = 'md',
  // weight = 'light',
  ...props
}: IconProps): JSX.Element {
  return (
    <Box color={color && colors[color]} component="span">
      <FontAwesomeIcon
        style={{ marginLeft: inline ? spacing.sm : 0, ...props.style }}
        icon={['fal', name as IconName]}
        {...props}
      />
    </Box>
  )
}

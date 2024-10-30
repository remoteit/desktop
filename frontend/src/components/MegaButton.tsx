import React from 'react'
import { Typography, ButtonBase } from '@mui/material'
import { Link, LinkProps } from './Link'

type OptionProps = LinkProps & {
  icon: React.ReactNode
  title: string
  description?: React.ReactNode
  width?: number
}

export const MegaButton: React.FC<OptionProps> = ({ icon, title, description, width = 250, ...props }) => {
  return (
    <Link color="inherit" {...props} noUnderline>
      <ButtonBase
        sx={{
          padding: 3,
          width,
          minWidth: width,
          flexDirection: 'column',
          '&:hover': { bgcolor: 'primaryBackground.main' },
        }}
      >
        {icon}
        <Typography variant="body1" marginTop={2} marginBottom={1} width="100%">
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" lineHeight="1.5em">
            {description}
          </Typography>
        )}
      </ButtonBase>
    </Link>
  )
}

import React from 'react'
import { ListItem, Theme, Typography } from '@mui/material'
import { spacing } from '../styling'

export const fieldSx = (theme: Theme) => ({
  paddingRight: `${spacing.lg}px`,
  paddingLeft: `${spacing.md}px`,
  alignItems: 'flex-start',
  '& > *': {
    width: '50%',
    maxWidth: 400,
  },
  '& > span.MuiTypography-root': {
    width: `calc(50% - ${spacing.lg}px)`,
    marginLeft: `${spacing.lg}px`,
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    '& > *': { width: '100%' },
    '& > span.MuiTypography-root': { margin: `${spacing.xs}px`, width: '100%', marginBottom: `${spacing.md}px` },
  },
})

type Props = {
  help?: React.ReactNode
  children?: React.ReactNode
}

export const FormField: React.FC<Props> = ({ help, children }) => (
  <ListItem component="div" sx={fieldSx}>
    {children}
    {help && <Typography variant="caption">{help}</Typography>}
  </ListItem>
)

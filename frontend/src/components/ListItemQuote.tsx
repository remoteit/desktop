import React from 'react'
import { List, ListItem } from '@mui/material'
import { spacing } from '../styling'
import { Quote } from './Quote'

type Props = {
  children?: React.ReactNode
}

export const ListItemQuote: React.FC<Props> = ({ children }) => {
  return (
    <ListItem sx={{ marginBottom: `${spacing.sm}px` }} dense disablePadding>
      <Quote margin={null} noInset indent="listItem">
        <List sx={{ marginRight: `${-spacing.md}px`, marginTop: `${spacing.xs}px` }} disablePadding>
          {children}
        </List>
      </Quote>
    </ListItem>
  )
}

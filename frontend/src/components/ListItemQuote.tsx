import React from 'react'
import { makeStyles } from '@mui/styles'
import { List, ListItem } from '@mui/material'
import { spacing } from '../styling'
import { Quote } from './Quote'

type Props = {
  children: React.ReactNode
}

export const ListItemQuote: React.FC<Props> = ({ children }) => {
  const css = useStyles()
  return (
    <ListItem className={css.group} dense disablePadding>
      <Quote margin={null} noInset indent="listItem">
        <List className={css.indent} disablePadding>
          {children}
        </List>
      </Quote>
    </ListItem>
  )
}

const useStyles = makeStyles({
  indent: { marginRight: -spacing.lg, marginTop: -spacing.xs },
  group: { marginBottom: spacing.sm },
})

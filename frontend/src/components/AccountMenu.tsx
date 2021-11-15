import React from 'react'
import { makeStyles, ListItem } from '@material-ui/core'
import { isElectron, isMac } from '../services/Browser'
import { AccountSelect } from './AccountSelect'
import { Quote } from './Quote'
import { spacing, fontSizes } from '../styling'

export const AccountMenu: React.FC = () => {
  const addSpace = isMac() && isElectron()
  const css = useStyles(addSpace)()

  return (
    <ListItem className={css.select} dense>
      <AccountSelect fullWidth hiddenLabel />
    </ListItem>
  )
}

const useStyles = addSpace =>
  makeStyles({
    select: {},
  })

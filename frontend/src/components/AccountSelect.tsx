import React, { useState } from 'react'
import { makeStyles, Divider, Typography, TextField, List, ListItem, MenuItem, Button } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { spacing } from '../styling'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const { accounts } = useDispatch<Dispatch>()
  const { fetching, options, active } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching,
    active: state.accounts.active || state.auth.user?.email,
    options: [...state.accounts.member, state.auth.user],
  }))

  if (options.length < 2) return null

  return (
    <TextField
      select
      className={css.field}
      SelectProps={{ disableUnderline: true }}
      label="Device lists"
      value={active}
      disabled={fetching}
      variant="filled"
      onChange={event => {
        accounts.setActive(event.target.value.toString())
      }}
    >
      {options.map(
        user =>
          !!user && (
            <MenuItem value={user.email} key={user.email}>
              {user.email}
            </MenuItem>
          )
      )}
    </TextField>
  )
}

const useStyles = makeStyles({
  field: { width: 300, marginRight: spacing.sm },
})

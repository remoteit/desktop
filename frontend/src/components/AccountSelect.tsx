import React from 'react'
import { makeStyles, TextField, MenuItem } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getAccountId, getDevices } from '../models/accounts'
import { Avatar } from './Avatar'
import { spacing } from '../styling'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const { accounts, devices } = useDispatch<Dispatch>()
  const { fetching, options, activeId } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching,
    activeId: getAccountId(state),
    options: [...state.accounts.member, state.auth.user],
  }))

  if (options.length < 2) return null

  return (
    <TextField
      select
      className={css.field}
      SelectProps={{ disableUnderline: true }}
      label="Device lists"
      value={activeId}
      disabled={fetching}
      variant="filled"
      onChange={async event => {
        await accounts.setActive(event.target.value.toString())
        devices.fetch()
      }}
    >
      {options.map(
        user =>
          !!user && (
            <MenuItem value={user.id} key={user.id}>
              {/* <Avatar email={user.email} size={24} label /> */}
              {user.email}
            </MenuItem>
          )
      )}
    </TextField>
  )
}

const useStyles = makeStyles({
  field: {
    width: 300,
    marginRight: spacing.sm,
    '& .MuiButtonBase-root': {},
    '& .MuiSelect-root': { whiteSpace: 'nowrap' },
  },
})

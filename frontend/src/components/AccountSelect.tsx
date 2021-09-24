import React from 'react'
import { makeStyles, TextField, MenuItem, Divider } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { getActiveAccountId } from '../models/accounts'
import { spacing, colors } from '../styling'
import classnames from 'classnames'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { accounts, devices } = useDispatch<Dispatch>()
  const { signedInUser, fetching, options, activeId } = useSelector((state: ApplicationState) => ({
    signedInUser: state.auth.user,
    fetching: state.devices.fetching,
    activeId: getActiveAccountId(state),
    options: [state.auth.user, ...state.accounts.member].sort(),
  }))

  if (options.length < 2) return null

  return (
    <TextField
      select
      fullWidth
      className={css.field}
      label="Device lists"
      value={activeId}
      disabled={fetching}
      variant="filled"
      onChange={async event => {
        const id = event.target.value
        if (id) {
          await accounts.setActive(id.toString())
          devices.set({ query: '', searched: false, from: 0 })
          devices.fetch()
        }
      }}
    >
      {options.map(
        user =>
          !!user && (
            <MenuItem className={classnames(user.id === signedInUser?.id && css.primary)} value={user.id} key={user.id}>
              {user.email}
            </MenuItem>
          )
      )}
      <Divider className={css.divider} />
      <MenuItem onClick={() => history.push('/devices/membership')}>Manage Lists...</MenuItem>
    </TextField>
  )
}

const useStyles = makeStyles({
  field: { '& .MuiListItemSecondaryAction-root': { display: 'none' } },
  primary: { color: colors.primary },
  divider: { marginTop: spacing.xxs, marginBottom: spacing.xxs },
  action: { right: spacing.xs, marginLeft: spacing.sm },
})

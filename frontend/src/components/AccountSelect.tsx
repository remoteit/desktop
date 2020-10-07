import React from 'react'
import { makeStyles, TextField, MenuItem, Divider } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { getAccountId } from '../models/accounts'
import { spacing, colors } from '../styling'
import { Avatar } from './Avatar'
import classnames from 'classnames'

export const AccountSelect: React.FC = () => {
  const css = useStyles()
  const history = useHistory()
  const { accounts, devices } = useDispatch<Dispatch>()
  const { signedInUser, fetching, options, activeId } = useSelector((state: ApplicationState) => ({
    signedInUser: state.auth.user,
    fetching: state.devices.fetching,
    activeId: getAccountId(state),
    options: [state.auth.user, ...state.accounts.member].sort(),
  }))

  if (options.length < 2) return null

  const leave = (email: string) =>
    window.confirm(`Are you sure you wish to leave the linked account ${email}?`) && accounts.leaveMembership(email)

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
        const id = event.target.value
        if (id) {
          await accounts.setActive(id.toString())
          devices.fetch()
        }
      }}
    >
      {options.map(
        user =>
          !!user && (
            <MenuItem
              className={classnames(css.menu, user.id === signedInUser?.id && css.primary)}
              value={user.id}
              key={user.id}
            >
              {/* <Avatar email={user.email} size={24} label /> */}
              {user.email}
            </MenuItem>
          )
      )}
      <Divider className={css.divider} />
      <MenuItem className={css.menu} onClick={() => history.push('/devices/membership')}>
        Manage Lists...
      </MenuItem>
    </TextField>
  )
}

const useStyles = makeStyles({
  field: { width: 300, marginRight: spacing.sm, '& .MuiListItemSecondaryAction-root': { display: 'none' } },
  menu: { color: colors.grayDarkest, paddingLeft: spacing.md },
  primary: { color: colors.primary },
  divider: { marginTop: spacing.xxs, marginBottom: spacing.xxs },
  action: { right: spacing.xs, marginLeft: spacing.sm },
})

import React from 'react'
import { makeStyles, TextField, MenuItem, Divider, TextFieldProps } from '@material-ui/core'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { spacing, colors, fontSizes } from '../styling'
import { getActiveAccountId } from '../models/accounts'
import { useHistory } from 'react-router-dom'
import classnames from 'classnames'

export const AccountSelect: React.FC<TextFieldProps> = props => {
  const css = useStyles()
  const history = useHistory()
  const { accounts, devices } = useDispatch<Dispatch>()
  const { user, fetching, options, activeId } = useSelector((state: ApplicationState) => ({
    user: state.auth.user || { id: '', email: '' },
    fetching: state.devices.fetching,
    activeId: getActiveAccountId(state),
    options: state.accounts.membership.map(m => ({ id: m.organization.id, name: m.organization.name })),
  }))

  options.sort((a, b) => (a.name > b.name ? 1 : -1))
  options.unshift({ id: user.id, name: user.email })
  if (options.length < 2) return null

  return (
    <TextField
      {...props}
      select
      variant="filled"
      className={css.field}
      value={activeId}
      disabled={fetching}
      onChange={async event => {
        const id = event.target.value
        if (id) {
          await accounts.setActive(id.toString())
          devices.set({ query: '', searched: false, from: 0 })
          devices.fetch()
          history.push('/devices')
        }
      }}
    >
      {options.map(option => (
        <MenuItem className={classnames(option.id === user?.id && css.primary)} value={option.id} key={option.id}>
          {option.name}
        </MenuItem>
      ))}
      <Divider className={css.divider} />
      <MenuItem onClick={() => history.push('/devices/membership')}>Manage memberships...</MenuItem>
    </TextField>
  )
}

const useStyles = makeStyles({
  field: {
    '& .MuiListItemSecondaryAction-root': { display: 'none' },
    '& .MuiInputBase-root': {
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      fontSize: fontSizes.base,
    },
  },
  primary: { color: colors.primary },
  divider: { marginTop: spacing.xxs, marginBottom: spacing.xxs },
  action: { right: spacing.xs, marginLeft: spacing.sm },
})

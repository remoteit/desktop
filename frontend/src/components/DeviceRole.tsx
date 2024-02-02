import React from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { selectOrganization } from '../selectors/organizations'
import { selectMembership, selectActiveAccountId } from '../selectors/accounts'
import { Chip } from '@mui/material'

type Props = { device?: IDevice }

export const DeviceRole: React.FC<Props> = ({ device }) => {
  const accountId = useSelector((state: State) => selectActiveAccountId(state, device?.accountId))
  const membership = useSelector((state: State) => selectMembership(state, accountId))
  const roles = useSelector((state: State) => selectOrganization(state, accountId).roles)

  let roleId = membership.roleId
  if (roleId === 'OWNER' && device?.owner.id !== membership.account.id) roleId = 'GUEST'
  const label = roles.find(r => r.id === roleId)?.name || 'Unknown'

  return <Chip size="small" label={label} variant="outlined" />
}

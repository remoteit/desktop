import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectOrganization } from '../selectors/organizations'
import { accountFromDevice } from '../models/accounts'
import { selectMembership } from '../selectors/accounts'
import { Chip } from '@mui/material'

type Props = { device?: IDevice }

export const DeviceRole: React.FC<Props> = ({ device }) => {
  const { membership, roles } = useSelector((state: ApplicationState) => {
    const accountId = accountFromDevice(state, device)
    return {
      membership: selectMembership(state, accountId),
      roles: selectOrganization(state, accountId).roles,
    }
  })

  if (membership.roleId === 'OWNER' && device?.owner.id !== membership.account.id) {
    membership.roleId = 'GUEST'
  }

  let label = roles.find(r => r.id === membership.roleId)?.name || 'Unknown'

  return <Chip size="small" label={label} variant="outlined" />
}

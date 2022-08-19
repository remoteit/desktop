import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { memberOrganization } from '../models/organization'
import { accountFromDevice, getMembership } from '../models/accounts'
import { Chip } from '@mui/material'

type Props = { device?: IDevice }

export const DeviceRole: React.FC<Props> = ({ device }) => {
  const { membership, roles } = useSelector((state: ApplicationState) => {
    const accountId = accountFromDevice(state, device)
    return {
      membership: getMembership(state, accountId),
      roles: memberOrganization(state.organization.all, accountId).roles,
    }
  })

  if (membership.roleId === 'OWNER' && device?.owner.id !== membership.account.id) {
    membership.roleId = 'GUEST'
  }

  let label = roles.find(r => r.id === membership.roleId)?.name || 'Unknown'

  return <Chip size="small" label={label} variant="outlined" />
}

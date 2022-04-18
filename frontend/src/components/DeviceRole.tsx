import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectMembershipFromDevice } from '../models/accounts'
import { Chip } from '@material-ui/core'

type Props = {
  device?: IDevice
}

export const DeviceRole: React.FC<Props> = ({ device }) => {
  const { membership, roles } = useSelector((state: ApplicationState) => {
    const membership = selectMembershipFromDevice(state, device)
    return {
      membership,
      roles: membership?.organization.roles || state.organization.roles,
    }
  })

  if (device?.shared) return null

  const roleId = membership?.roleId || 'OWNER'
  const label = roles?.find(r => r.id === roleId)?.name

  return <Chip size="small" label={label} variant="outlined" />
}

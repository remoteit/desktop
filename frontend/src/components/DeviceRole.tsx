import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectMembershipFromDevice } from '../models/accounts'
import { Chip } from '@material-ui/core'

type Props = {
  device?: IDevice
}

export const DeviceRole: React.FC<Props> = ({ device }) => {
  const { membership, roles } = useSelector((state: ApplicationState) => ({
    membership: selectMembershipFromDevice(state, device),
    roles: state.organization.roles,
  }))
  const roleId = membership?.roleId || device?.shared ? 'MEMBER' : 'OWNER'
  const label = roles.find(r => r.id === roleId)?.name
  return <Chip size="small" label={label} variant="outlined" />
}

import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectMembershipFromDevice } from '../models/accounts'
import { ROLE } from '../models/organization'
import { Chip } from '@material-ui/core'

type Props = {
  device?: IDevice
}

export const DeviceRole: React.FC<Props> = ({ device }) => {
  const membership = useSelector((state: ApplicationState) => selectMembershipFromDevice(state, device))
  const label = ROLE[membership?.role || 'OWNER']
  return <Chip size="small" label={label} variant="outlined" />
}

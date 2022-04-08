import React from 'react'
import network from '../../services/Network'
import { getDeviceModel } from '../../models/accounts'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { IconButton, ButtonProps } from '../IconButton'

type Props = ButtonProps & {
  device?: IDevice
}

export const RefreshButton: React.FC<Props> = ({ device, ...props }) => {
  const fetching = useSelector(
    (state: ApplicationState) => getDeviceModel(state).fetching || (device && state.logs.fetching)
  )
  const { devices, ui, logs } = useDispatch<Dispatch>()
  const location = useLocation()
  const logPage = location.pathname.includes('/logs')

  let title = device ? (logPage ? 'Refresh device logs' : 'Refresh device') : 'Refresh application'

  const onClick = async () => {
    if (device) {
      devices.fetchSingle({ id: device.id })
      if (logPage) {
        logs.set({ from: 0, maxDate: new Date() })
        logs.fetch()
      }
    } else {
      ui.refreshAll()
      network.connect()
    }
  }

  return (
    <IconButton onClick={onClick} disabled={fetching} title={title} icon="sync" spin={fetching} fixedWidth {...props} />
  )
}

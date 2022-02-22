import React from 'react'
import network from '../../services/Network'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { IconButton } from '../IconButton'

export const RefreshButton: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { fetching } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching || (device && state.logs.fetching),
  }))
  const { devices, ui, logs } = useDispatch<Dispatch>()
  const location = useLocation()
  const logPage = location.pathname.includes('/logs')

  let title = device ? (logPage ? 'Refresh device logs' : 'Refresh device') : 'Refresh application'

  const onClick = async () => {
    if (device) {
      devices.fetchSingle({ id: device.id })
      if (logPage) logs.fetch()
    } else {
      ui.refreshAll()
      network.connect()
    }
  }

  return (
    <IconButton
      onClick={onClick}
      disabled={fetching}
      title={title}
      icon="sync"
      size="sm"
      type="regular"
      spin={fetching}
      fixedWidth
    />
  )
}

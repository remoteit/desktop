import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Icon } from '../../components/Icon'

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
    }
  }

  return (
    <Tooltip title={title}>
      <div>
        <IconButton onClick={onClick} disabled={fetching}>
          <Icon name="sync" size="sm" type="regular" spin={fetching} />
        </IconButton>
      </div>
    </Tooltip>
  )
}

import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../components/Icon'
import { useLocation } from 'react-router-dom'

export const RefreshButton: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { fetching, maxDate, minDate, from } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching,
    maxDate: state.logs.maxDate,
    minDate: state.logs.minDate,
    from: state.logs.from,
  }))
  const { devices, ui, logs } = useDispatch<Dispatch>()
  const location = useLocation()

  const onClick = async () => {
    if (location.pathname.includes('/logs')) {
      logs.fetchLogs({ id: device?.id || '', from, maxDate, minDate })
    } else {
      if (device) {
        devices.fetchSingle({ id: device.id })
      } else {
        ui.refreshAll()
      }
    }
  }

  return (
    <Tooltip title={device ? 'Refresh device' : 'Refresh application'}>
      <div>
        <IconButton onClick={onClick} disabled={fetching}>
          <Icon name="sync" size="sm" type="regular" spin={fetching} />
        </IconButton>
      </div>
    </Tooltip>
  )
}

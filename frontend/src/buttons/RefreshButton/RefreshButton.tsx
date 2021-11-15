import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../components/Icon'

export const RefreshButton: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { fetching } = useSelector((state: ApplicationState) => ({
    fetching: state.devices.fetching || (device && state.logs.fetching),
  }))
  const { devices, ui } = useDispatch<Dispatch>()

  const onClick = async () => {
    if (device) {
      devices.fetchSingle({ id: device.id })
    } else {
      ui.refreshAll()
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

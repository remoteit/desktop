import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '@remote.it/components'

export const RefreshButton: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { fetching } = useSelector((state: ApplicationState) => state.devices)
  const { devices, licensing } = useDispatch<Dispatch>()

  const onClick = () => {
    if (device) {
      devices.fetchSingle({ deviceId: device.id })
    } else {
      devices.set({ from: 0 })
      devices.fetch()
    }
    licensing.fetch()
  }

  return (
    <Tooltip title="Refresh device">
      <div>
        <IconButton onClick={onClick} disabled={fetching}>
          <Icon name="sync" size="xs" spin={fetching} />
        </IconButton>
      </div>
    </Tooltip>
  )
}

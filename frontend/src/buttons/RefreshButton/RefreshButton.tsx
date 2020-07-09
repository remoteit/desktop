import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../components/Icon'

export const RefreshButton: React.FC<{ device: IDevice }> = ({ device }) => {
  const { getting } = useSelector((state: ApplicationState) => state.devices)
  const { devices } = useDispatch<Dispatch>()

  return (
    <Tooltip title="Refresh device">
      <div>
        <IconButton onClick={() => devices.get(device.id)} disabled={getting}>
          <Icon name="sync" size="sm" type="regular" spin={getting} />
        </IconButton>
      </div>
    </Tooltip>
  )
}

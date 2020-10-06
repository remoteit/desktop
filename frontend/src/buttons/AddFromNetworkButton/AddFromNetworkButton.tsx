import React from 'react'
import { useHistory } from 'react-router-dom'
import { IconButton, Tooltip } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { Icon } from '../../components/Icon'

export const AddFromNetworkButton: React.FC<{ device?: IDevice; thisDevice?: boolean }> = ({ device, thisDevice }) => {
  const { scanEnabled } = useSelector((state: ApplicationState) => state.ui)
  const history = useHistory()

  if (!device || !thisDevice || !scanEnabled) return null

  return (
    <Tooltip title="Scan for Services">
      <IconButton onClick={() => history.push(`/devices/${device.id}/edit/add-service/network`)}>
        <Icon name="radar" size="md" type="light" />
      </IconButton>
    </Tooltip>
  )
}

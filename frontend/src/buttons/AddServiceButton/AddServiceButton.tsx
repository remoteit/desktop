import React from 'react'
import { useHistory } from 'react-router-dom'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const AddServiceButton: React.FC<{ device?: IDevice; thisDevice?: boolean }> = ({ device, thisDevice }) => {
  const history = useHistory()

  if (!device || !thisDevice) return null

  return (
    <Tooltip title="Add Service">
      <IconButton onClick={() => history.push(`/devices/${device.id}/serviceAdd`)}>
        <Icon name="plus-circle" size="md" type="light" />
      </IconButton>
    </Tooltip>
  )
}

import React from 'react'
import { useHistory } from 'react-router-dom'
import { IconButton, Tooltip } from '@mui/material'
import { Icon } from '../../components/Icon'

type Props = { device?: IDevice; editable?: boolean; link: string }

export const AddServiceButton: React.FC<Props> = ({ device, editable, link }) => {
  const history = useHistory()

  if (!device || device.state === 'inactive' || !editable) return null

  return (
    <Tooltip title="Add Service">
      <IconButton onClick={() => history.push(link)} size="large">
        <Icon name="plus" size="md" />
      </IconButton>
    </Tooltip>
  )
}

import React from 'react'
import { useHistory } from 'react-router-dom'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = { device?: IDevice; editable?: boolean; link: string }

export const AddServiceButton: React.FC<Props> = ({ device, editable, link }) => {
  const history = useHistory()

  if (!device || !editable) return null

  return (
    <Tooltip title="Add Service">
      <IconButton onClick={() => history.push(link)}>
        <Icon name="plus-circle" size="md" type="light" />
      </IconButton>
    </Tooltip>
  )
}

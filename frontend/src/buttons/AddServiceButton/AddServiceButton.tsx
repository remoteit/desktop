import React from 'react'
import { useHistory } from 'react-router-dom'
import { IconButton } from '../IconButton'

type Props = { device?: IDevice; editable?: boolean; link: string }

export const AddServiceButton: React.FC<Props> = ({ device, editable, link }) => {
  const history = useHistory()

  if (!device || device.state === 'inactive' || !editable) return null

  return <IconButton icon="plus" size="md" title="Add Service" onClick={() => history.push(link)} />
}

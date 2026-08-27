import React from 'react'
import { GUIDE_START_DATE } from '../../constants'
import { useHistory } from 'react-router-dom'
import { IconButton } from '../IconButton'
import { GuideBubble } from '../../components/GuideBubble'
import { Typography } from '@mui/material'

type Props = { device?: IDevice; editable?: boolean; link: string }

export const AddServiceButton: React.FC<Props> = ({ device, editable, link }) => {
  const history = useHistory()

  if (!device || !editable) return null

  return (
    <GuideBubble
      highlight
      guide="addService"
      enterDelay={400}
      placement="bottom"
      startDate={GUIDE_START_DATE}
      queueAfter="usingConnection"
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>Add a service (application)</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            This device can be dynamically set up to host new services.
          </Typography>
        </>
      }
    >
      <IconButton icon="plus" size="md" title="Add Service" onClick={() => history.push(link)} />
    </GuideBubble>
  )
}
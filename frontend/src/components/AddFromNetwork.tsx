import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { IconButton, Tooltip } from '@mui/material'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Link } from './Link'
import { Icon } from './Icon'

type Props = {
  allowScanning?: boolean
  button?: boolean
}

export const AddFromNetwork: React.FC<Props> = ({ allowScanning, button }) => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { scanEnabled } = useSelector((state: ApplicationState) => state.ui)
  const history = useHistory()

  if (!allowScanning || !scanEnabled) return null

  return button ? (
    <Tooltip title="Scan for Services">
      <IconButton onClick={() => history.push(`/devices/${deviceID}/add/scan`)} size="large">
        <Icon name="radar" size="md" />
      </IconButton>
    </Tooltip>
  ) : (
    <Link to={`/devices/${deviceID}/add/scan`}>Scan&nbsp;network</Link>
  )
}

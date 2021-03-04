import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { IconButton, Tooltip, Link } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
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
      <IconButton onClick={() => history.push(`/devices/${deviceID}/add/scan`)}>
        <Icon name="radar" size="md" type="light" />
      </IconButton>
    </Tooltip>
  ) : (
    <Link onClick={() => history.push(`/devices/${deviceID}/add/scan`)}>Scan network</Link>
  )
}

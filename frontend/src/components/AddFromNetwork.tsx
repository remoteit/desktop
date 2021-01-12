import React from 'react'
import { useHistory } from 'react-router-dom'
import { IconButton, Tooltip, Link } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { getLinks } from '../helpers/routeHelper'
import { Icon } from './Icon'

type Props = {
  deviceId?: string
  thisDevice?: boolean
  button?: boolean
}

export const AddFromNetwork: React.FC<Props> = ({ deviceId, thisDevice, button }) => {
  const { scanEnabled, links } = useSelector((state: ApplicationState) => ({
    scanEnabled: state.ui.scanEnabled,
    links: getLinks(state, deviceId),
  }))
  const history = useHistory()

  if (!thisDevice || !scanEnabled) return null

  return button ? (
    <Tooltip title="Scan for Services">
      <IconButton onClick={() => history.push(links.scan)}>
        <Icon name="radar" size="md" type="light" />
      </IconButton>
    </Tooltip>
  ) : (
    <Link onClick={() => history.push(links.scan)}>Scan network</Link>
  )
}

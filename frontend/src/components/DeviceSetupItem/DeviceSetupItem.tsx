import React from 'react'
import { IService } from 'remote.it'
import { makeStyles } from '@material-ui/styles'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ServiceName } from '../ServiceName'
import { ApplicationState } from '../../store'
import { colors } from '../../styling'
import { ListItemIcon, Typography, List, ListItemText } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC = () => {
  const css = useStyles()
  const { device } = useSelector((state: ApplicationState) => ({
    device: state.backend.device,
  }))

  let title: any = <span className={css.title}>Setup this device</span>
  let subTitle = 'Host or port forward services with this system.'

  if (device.name) {
    title = device.name
    subTitle = 'This system’s hosted or port forwarded services.'
  }

  return (
    <List>
      <ListItemLocation pathname={'/settings/setup'}>
        <ListItemIcon>
          <Icon name="hdd" size="md" weight="light" />
        </ListItemIcon>
        <ListItemText primary={title} secondary={subTitle} />
      </ListItemLocation>
    </List>
  )
}

const useStyles = makeStyles({
  title: { color: colors.primary },
})

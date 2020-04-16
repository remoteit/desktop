import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { osName } from '../../helpers/nameHelper'
import { colors } from '../../styling'
import { ListItemIcon, List, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC = () => {
  const css = useStyles()
  const { device, os } = useSelector((state: ApplicationState) => ({
    device: state.backend.device,
    os: state.backend.environment.os,
  }))

  let title: any = <span className={css.title}>Set up remote access</span>
  let subTitle = `Set up remote access to this ${osName(os)} or any other service on the network.`

  if (device.name) {
    title = device.name
    subTitle = `Remote access to this ${osName(os)} or any other service on the network.`
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

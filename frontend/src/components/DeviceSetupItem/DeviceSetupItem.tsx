import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { useSelector } from 'react-redux'
import { usePermissions } from '../../hooks/usePermissions'
import { ApplicationState } from '../../store'
import { ListItemIcon, List, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { osName } from '../../helpers/nameHelper'
import { colors } from '../../styling'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC = () => {
  const css = useStyles()
  const { guest, notElevated } = usePermissions()
  const { device, os } = useSelector((state: ApplicationState) => ({
    device: state.backend.device,
    os: state.backend.environment.os,
  }))

  const registered = !!device.uid
  let title: any = <span className={css.title}>Set up remote access</span>
  let subTitle = `Set up remote access to this ${osName(os)} or any other service on the network.`

  if (registered) {
    title = device.name
    subTitle = `Remote access to this ${osName(os)} or any other service on the network.`
  }

  let pathname = '/settings/setupDevice'
  if (registered) pathname = '/settings/setupServices'
  if (guest || notElevated) pathname = '/settings/setupView'

  return (
    <List>
      <ListItemLocation pathname={pathname}>
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

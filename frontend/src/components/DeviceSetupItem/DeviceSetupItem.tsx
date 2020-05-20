import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemIcon, ListItemText } from '@material-ui/core'
import { ListItemLocation } from '../ListItemLocation'
import { osName } from '../../helpers/nameHelper'
import { colors } from '../../styling'
import { Icon } from '../Icon'

export const DeviceSetupItem: React.FC<{ thisDevice?: boolean }> = ({ thisDevice }) => {
  const css = useStyles()
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

  if (thisDevice) {
    title = 'Set up remote access to this device'
  }

  return (
    <ListItemLocation pathname="/settings/setup">
      <ListItemIcon>
        <Icon name="hdd" size="md" weight="light" />
      </ListItemIcon>
      <ListItemText primary={title} secondary={subTitle} />
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  title: { color: colors.primary },
})

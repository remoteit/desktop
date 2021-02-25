import React from 'react'
import { IP_PRIVATE } from '../shared/constants'
import { makeStyles, Typography, List, ListItem, ListItemText, Box, Divider } from '@material-ui/core'
import { spacing, colors, fontSizes } from '../styling'
import { useSelector } from 'react-redux'
import { isRemote } from '../services/Browser'
import { ApplicationState } from '../store'
import { attributeName } from '../shared/nameHelper'
import { getOwnDevices } from '../models/accounts'
import { isRemoteUI } from '../helpers/uiHelper'
import onLanGraphic from '../assets/remote-on-lan.svg'
import onRemoteGraphic from '../assets/remote-on-remote.svg'

type NetworkType = { primary: string; secondary?: string }

export const RemoteManagement: React.FC = () => {
  const { hostname } = window.location
  const isLocalhost = hostname === 'localhost' || hostname === IP_PRIVATE

  const { name, remoteUI } = useSelector((state: ApplicationState) => {
    const device = getOwnDevices(state).find(d => d.id === state.backend.device.uid)
    return {
      label: state.labels.find(l => l.id === device?.attributes.color),
      name: attributeName(device),
      remoteUI: isRemoteUI(state),
    }
  })

  const css = useStyles()
  if (!isRemote()) return null

  let graphic = onLanGraphic
  let diagram: NetworkType[] = [
    { primary: 'You' },
    { primary: 'Local network' },
    { primary: 'This device', secondary: name },
    { primary: 'Internet devices' },
  ]

  if (isLocalhost) {
    graphic = onRemoteGraphic
    diagram = [diagram[0], diagram[3], diagram[2], diagram[1]]
  }

  return (
    <Box className={css.container}>
      <section>
        <Typography variant="h2" gutterBottom>
          You are managing <br />a remote device
        </Typography>
        {!remoteUI && name && (
          <Typography variant="body2" color="textSecondary">
            Any connections you create will be to <em>{name}</em>, not your local machine.
          </Typography>
        )}
        <Box className={css.graphic}>
          <img src={graphic} alt="From remote network graphic" />
          <List>
            {diagram.map((i: NetworkType, key) => (
              <ListItem key={key} disableGutters>
                <ListItemText primary={i.primary} secondary={i.secondary} />
              </ListItem>
            ))}
          </List>
        </Box>
      </section>
    </Box>
  )
}

const useStyles = makeStyles({
  container: {
    padding: spacing.sm,
  },
  graphic: {
    display: 'flex',
    marginTop: spacing.lg,
    '& ul': {
      padding: 0,
      display: 'flex',
      flexGrow: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    '& li > div': { justifyContent: 'left', minWidth: 45 },
    '& li > div span': { fontSize: fontSizes.base, color: colors.grayDarker },
    '& li > div + div': { flexGrow: 1 },
  },
})

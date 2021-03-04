import React from 'react'
import { IP_PRIVATE } from '../shared/constants'
import { makeStyles, Typography, List, ListItem, ListItemText, Box, Divider } from '@material-ui/core'
import { spacing, colors, fontSizes } from '../styling'
import { useSelector } from 'react-redux'
import { isRemote } from '../services/Browser'
import { ApplicationState } from '../store'
import { attributeName } from '../shared/nameHelper'
import { TargetPlatform } from '../components/TargetPlatform'
import { getOwnDevices } from '../models/accounts'
import { isRemoteUI } from '../helpers/uiHelper'
import onLanGraphic from '../assets/remote-on-lan.svg'
import onRemoteGraphic from '../assets/remote-on-remote.svg'

type NetworkType = { primary: string; secondary?: string }

export const RemoteManagement: React.FC = () => {
  const { hostname } = window.location
  const isLocalhost = hostname === 'localhost' || hostname === IP_PRIVATE

  const { name, device, remoteUI } = useSelector((state: ApplicationState) => {
    const device = getOwnDevices(state).find(d => d.id === state.backend.device.uid)
    return {
      device,
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
        <TargetPlatform id={device?.targetPlatform} size="max" />
        <Typography variant="h2">
          You are managing <br />a remote device
        </Typography>
        {!remoteUI && name && (
          <Typography variant="body2">
            Any connections you create will be to <em>{name}</em>, not your local machine.
          </Typography>
        )}
      </section>
      <Divider />
      <section>
        <Box className={css.graphic}>
          <img src={graphic} alt="From remote network graphic" />
          <List>
            {diagram.map((i: NetworkType, key) => (
              <ListItem key={key}>
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
    '& section': { padding: `${spacing.xl}px ${spacing.lg}px ${spacing.xl}px ${spacing.xl}px` },
    '& svg': { marginBottom: spacing.lg },
    '& hr': { opacity: 0.3 },
    // '& span': { color: colors.white },
    '& h2': { fontSize: fontSizes.lg },
    // '& h2, & p': { color: colors.white },
    '& section > p': { marginTop: spacing.lg },
    '& section > div': { marginBottom: spacing.xl },
  },
  graphic: {
    display: 'flex',
    '& ul': {
      padding: 0,
      display: 'flex',
      flexGrow: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    '& li': { padding: `0 0 0 ${spacing.md}px` },
    '& li > div': { justifyContent: 'left', minWidth: 45 },
    '& li > div span': { fontSize: fontSizes.base },
    '& li > div + div': { flexGrow: 1 },
    '& path': { fill: colors.grayDark, color: colors.grayDark },
    '& line': { stroke: colors.grayDark },
  },
})

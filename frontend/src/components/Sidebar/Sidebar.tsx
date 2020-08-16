import React, { useState } from 'react'
import { PORT, IP_PRIVATE } from '../../shared/constants'
import {
  makeStyles,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Tooltip,
  IconButton,
} from '@material-ui/core'
import { spacing, colors, fontSizes } from '../../styling'
import { useSelector } from 'react-redux'
import { isElectron } from '../../services/Browser'
import { ApplicationState } from '../../store'
import { deviceName } from '../../shared/nameHelper'
import { Icon } from '../../components/Icon'
import onLanGraphic from '../../assets/remote-on-lan.svg'
import onRemoteGraphic from '../../assets/remote-on-remote.svg'

type NetworkType = { primary: string; secondary?: string }

export const Sidebar: React.FC = () => {
  const [shown, setShown] = useState<boolean>(true)
  const { hostname, port } = window.location
  const isLocalhost = hostname === 'localhost' || hostname === IP_PRIVATE
  const { name, label } = useSelector((state: ApplicationState) => {
    const device = state.devices.all.find(d => d.id === state.backend.device.uid)
    return {
      label: state.labels.find(l => l.id === device?.attributes.labelId),
      name: deviceName(device),
    }
  })
  const css = useStyles()

  let graphic = onLanGraphic
  let diagram: NetworkType[] = [
    { primary: 'You' },
    { primary: 'Local network' },
    { primary: 'This system', secondary: name },
    { primary: 'Remote devices' },
  ]

  if (isElectron() || (isLocalhost && port === PORT.toString())) return null

  if (isLocalhost) {
    graphic = onRemoteGraphic
    diagram = [diagram[0], diagram[3], diagram[2], diagram[1]]
  }

  return (
    <Box
      style={{ backgroundColor: label?.id ? label.color : colors.primary }}
      className={(shown ? css.open : css.closed) + ' ' + css.drawer}
    >
      <Box className={css.sideBar}>
        <Tooltip className={css.button} title={shown ? 'Hide sidebar' : 'Show sidebar'}>
          <IconButton onClick={() => setShown(!shown)}>
            <Icon name={shown ? 'arrow-to-left' : 'arrow-from-left'} size="md" />
          </IconButton>
        </Tooltip>
        <section>
          <Typography variant="h2">
            You are managing <br />a remote device
          </Typography>
        </section>
        <Divider />
        <section>
          <Box className={css.graphic}>
            <img src={graphic} alt="From remote network graphic" />
            <List>
              {diagram.map((i: NetworkType) => (
                <ListItem>
                  <ListItemText primary={i.primary} secondary={i.secondary} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Typography variant="body2">
            Any connections you initiate in these panels can be used by this remote device or if LAN sharing is turned
            on, by other devices on the network.
          </Typography>
        </section>
      </Box>
    </Box>
  )
}

const SIDEBAR_WIDTH = 230

const useStyles = makeStyles({
  drawer: {
    color: colors.white,
    backgroundColor: colors.primary,
    transition: 'width 200ms ease-out',
    boxShadow: 'inset -5px 0px 3px -4px rgba(0,0,0,0.1)',
    zIndex: -1,
  },
  open: { width: SIDEBAR_WIDTH },
  closed: { width: spacing.xl },
  button: { position: 'absolute' },
  sideBar: {
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    height: '100%',
    position: 'relative',
    '& section': { padding: `${spacing.xl}px ${spacing.lg}px ${spacing.xl}px ${spacing.xl}px` },
    '& hr': { opacity: 0.3 },
    '& span': { color: colors.white },
    '& h2': { fontSize: fontSizes.lg },
    '& h2, & p': { color: colors.white },
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
  },
})

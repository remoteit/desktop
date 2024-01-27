import React from 'react'
import { State } from '../store'
import { IP_PRIVATE } from '@common/constants'
import { makeStyles } from '@mui/styles'
import { Typography, List, ListItem, ListItemText, Box } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { attributeName } from '@common/nameHelper'
import { selectOwnDevices } from '../selectors/devices'
import { useSelector } from 'react-redux'
import { isRemoteUI } from '../helpers/uiHelper'
import { RemoteOnLan } from '../assets/RemoteOnLan'
import { RemoteOnRemote } from '../assets/RemoteOnRemote'
import browser from '../services/Browser'

type NetworkType = { primary: string; secondary?: string }

export const RemoteManagement: React.FC = () => {
  const { hostname } = window.location
  const isLocalhost = hostname === 'localhost' || hostname === IP_PRIVATE
  const device = useSelector(selectOwnDevices).find(d => d.thisDevice)
  const remoteUI = useSelector((state: State) => isRemoteUI(state))
  const name = attributeName(device)
  const css = useStyles()

  if (!browser.isRemote) return null

  let Graphic = RemoteOnLan
  let diagram: NetworkType[] = [
    { primary: 'You' },
    { primary: 'Local network' },
    { primary: 'This system', secondary: name },
    { primary: 'Internet devices' },
  ]

  if (isLocalhost) {
    Graphic = RemoteOnRemote
    diagram = [diagram[0], diagram[3], diagram[2], diagram[1]]
  }

  return (
    <Box className={css.container}>
      <section>
        <Typography variant="h3" gutterBottom>
          You are managing <br />a remote device
        </Typography>
        {!remoteUI && name && (
          <Typography variant="body2" color="textSecondary">
            Any connections you create will be to <em>{name}</em>, not your local machine.
          </Typography>
        )}
        <Box className={css.graphic}>
          <Graphic />
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

const useStyles = makeStyles(({ palette }) => ({
  container: {
    padding: spacing.sm,
  },
  graphic: {
    display: 'flex',
    marginTop: spacing.lg,
    '& svg': { height: 220, margin: spacing.xs, marginRight: spacing.md },
    '& ul': {
      padding: 0,
      display: 'flex',
      flexGrow: 1,
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    '& li > div': { justifyContent: 'left', minWidth: 45 },
    '& li > div span': { fontSize: fontSizes.base, color: palette.grayDarker.main },
    '& li > div + div': { flexGrow: 1 },
  },
}))

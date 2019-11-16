import React, { useState } from 'react'
import { IP_OPEN, IP_LATCH, IP_CLASS_A, IP_CLASS_B, IP_CLASS_C, IP_PRIVATE, REGEX_IP_SAFE } from '../../constants'
import {
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Switch,
  TextField,
  MenuItem,
} from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { findService } from '../../models/devices'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { Icon } from '../../components/Icon'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { colors, spacing, fontSizes } from '../../styling'
import { ApplicationState } from '../../store'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'

type Selections = { value: string | Function; name: string; note: string }

export const LanSharePage: React.FC = () => {
  // prettier-ignore
  const selections: Selections[] = [
    { value: IP_LATCH, name: 'IP Latching', note: 'Allow any single device on the local network to connect. IP restriction will be set to the IP address of the first device that connects.' },
    { value: IP_CLASS_A, name: 'Class-A Local Restriction', note: 'IP restricted to the local network' },
    { value: IP_CLASS_B, name: 'Class-B Local Restriction', note: 'Narrowly IP restrict on the local network' },
    { value: IP_CLASS_C, name: 'Class-C Local Restriction', note: 'Focused IP restriction on the local network' },
    { value: () => address, name: 'Single IP Restriction', note: 'Only allow a single IP address to connect to this device on the local network.' },
    { value: IP_OPEN, name: 'None', note: 'Available to all incoming requests.' },
  ]

  const { serviceID = '' } = useParams()
  const privateIP = useSelector((state: ApplicationState) => state.backend.privateIP)
  const connection = useSelector((state: ApplicationState) => {
    let c = state.backend.connections.find(c => c.id === serviceID)
    if (c) return c
    const [service] = findService(state.devices.all, serviceID)
    return newConnection(service)
  })

  const [enabled, setEnabled] = useState<boolean>(connection.host !== IP_PRIVATE)
  const restriction: ipAddress = enabled && connection.restriction ? connection.restriction : IP_LATCH
  const [selection, setSelection] = useState<number>(() => {
    let s = selections.findIndex(s => s.value === restriction)
    if (s === -1) s = selections.findIndex(s => typeof s.value === 'function')
    return s
  })
  const [address, setAddress] = useState<string>(restriction || '192.168.')
  const selected = selections[selection] || {}
  const history = useHistory()
  const css = useStyles()

  if (!connection) return null

  const getSelectionValue = () => {
    if (!enabled) return undefined
    const value = selected.value
    return typeof value === 'function' ? value() : value
  }

  const save = () => {
    const value = getSelectionValue()
    setConnection({ ...connection, host: enabled ? IP_OPEN : IP_PRIVATE, restriction: enabled ? value : IP_OPEN })
    history.goBack()
  }

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="subtitle1">Local Network Sharing</Typography>
        </>
      }
    >
      <List>
        <ListItem button onClick={() => setEnabled(!enabled)}>
          <ListItemIcon>
            <Icon name="network-wired" color={enabled ? 'primary' : 'gray'} size="lg" />
          </ListItemIcon>
          <ListItemText
            primary="Enable local sharing"
            primaryTypographyProps={{ style: { color: enabled ? colors.primary : colors.grayDarker } }}
          />
          <ListItemSecondaryAction>
            <Switch checked={enabled} onChange={() => setEnabled(!enabled)} />
          </ListItemSecondaryAction>
        </ListItem>
      </List>

      <div className={css.indent}>
        <Typography variant="caption">Your local IP address</Typography>
        <Typography variant="subtitle2">{privateIP}</Typography>
        <div className={css.note}>
          Allow users to connect to your remote device through your IP address using a custom port.
        </div>
        {enabled && (
          <>
            <TextField
              select
              className={css.textField}
              variant="filled"
              label="Local Network Security"
              value={selection.toString()}
              onChange={event => setSelection(parseInt(event.target.value as string))}
            >
              {selections.map((option, key) => (
                <MenuItem key={key} value={key.toString()}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
            <div className={css.note}>
              {selected.note}
              <span className={css.mask}>Mask {getSelectionValue()}</span>
            </div>
            {typeof selected.value === 'function' && (
              <div className={css.quote}>
                <TextField
                  className={css.textField}
                  value={address}
                  variant="filled"
                  label="IP address"
                  onChange={event => setAddress(event.target.value.replace(REGEX_IP_SAFE, ''))}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className={css.indent}>
        <Button onClick={save} variant="contained" color="primary">
          Done
          <Icon name="check" color="white" weight="regular" inline />
        </Button>
      </div>
    </Container>
  )
}

const useStyles = makeStyles({
  indent: {
    paddingLeft: spacing.lg,
    margin: `${spacing.md}px ${spacing.xxl}px ${spacing.xl}px`,
  },
  note: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    color: colors.grayDark,
  },
  textField: {
    minWidth: 300,
  },
  mask: {
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    marginLeft: spacing.sm,
  },
  quote: {
    margin: `${spacing.xl}px 0`,
    paddingLeft: spacing.lg,
    borderLeft: `1px solid ${colors.grayLighter}`,
  },
})

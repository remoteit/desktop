import React, { useState, useEffect } from 'react'
import { Button, List, Typography, TextField, MenuItem } from '@material-ui/core'
import { IP_OPEN, IP_LATCH, IP_PRIVATE, REGEX_IP_SAFE, REGEX_VALID_HOSTNAME } from '../../shared/constants'
import { ListItemSetting } from '../../components/ListItemSetting'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { findService } from '../../models/devices'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { getDevices } from '../../models/accounts'
import { spacing } from '../../styling'
import { ApplicationState } from '../../store'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { maskIPClass } from '../../helpers/lanSharing'
import { Quote } from '../../components/Quote'
import analyticsHelper from '../../helpers/analyticsHelper'

type Selections = { value: string | Function; name: string; note: string }

export const LanSharePage: React.FC = () => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const { service, lanIP, connection } = useSelector((state: ApplicationState) => {
    let connection = state.connections.all.find(c => c.id === serviceID)
    const [service] = findService(getDevices(state), serviceID)
    return {
      service,
      lanIP: state.backend.environment.privateIP,
      connection: connection || newConnection(service),
    }
  })

  const [currentIp, setCurrentIp] = useState((connection && connection.ip) || IP_PRIVATE)

  // prettier-ignore
  const selections: Selections[] = [
    { value: IP_LATCH, name: 'IP Latching', note: 'Allow any single device on the local network to connect. IP restriction will be set to the IP address of the first device that connects.' },
    { value: maskIPClass(currentIp, 'A'), name: 'Class-A Restriction', note: 'IP restricted to the local network' },
    { value: maskIPClass(currentIp, 'B'), name: 'Class-B Restriction', note: 'Narrowly IP restrict on the local network' },
    { value: maskIPClass(currentIp, 'C'), name: 'Class-C Restriction', note: 'Focused IP restriction on the local network' },
    { value: () => address, name: 'Single IP Restriction', note: 'Only allow a single IP address to connect to this device on the local network.' },
    { value: IP_OPEN, name: 'None', note: 'Available to all incoming requests.' },
  ]

  useEffect(() => {
    analyticsHelper.page('LanSharePage')
  }, [])

  const [enabledLocalSharing, setEnabledLocalSharing] = useState<boolean>(connection.ip !== IP_PRIVATE)
  const restriction: ipAddress = enabledLocalSharing && connection.restriction ? connection.restriction : IP_LATCH
  const [selection, setSelection] = useState<number>(() => {
    let s = selections.findIndex(s => s.value === restriction)
    if (s === -1) s = selections.findIndex(s => typeof s.value === 'function')
    return s
  })
  const [address, setAddress] = useState<string>(restriction || '192.168.')
  const selected = selections[selection] || {}
  const history = useHistory()
  const css = useStyles()
  const [error, setError] = useState<string>()
  const [disabled, setDisabled] = useState(true)

  const getSelectionValue = () => {
    if (!enabledLocalSharing) return IP_PRIVATE
    const value = selected.value
    return typeof value === 'function' ? value() : value
  }

  if (!connection || !service) return null

  const save = () => {
    setConnection({
      ...connection,
      ip: enabledLocalSharing ? currentIp : IP_PRIVATE,
      restriction: getSelectionValue(),
    })
    history.push(`/connections/${serviceID}`)
  }

  const handleLocalNetworkSecurity = event => {
    setSelection(parseInt(event.target.value as string))
    setDisabled(false)
  }

  const handleBindIP = event => {
    const { value } = event.target
    setCurrentIp(value)

    if (!REGEX_VALID_HOSTNAME.test(value)) {
      setError('invalid IP')
      setDisabled(true)
    } else {
      setError('')
      setDisabled(false)
    }
  }

  const handleEnableLocalSharing = () => {
    setCurrentIp(enabledLocalSharing ? IP_PRIVATE : IP_OPEN)
    setEnabledLocalSharing(!enabledLocalSharing)
    setDisabled(false)
  }

  return (
    <Container header={<Typography variant="h1">Local Network Sharing</Typography>}>
      <List>
        <ListItemSetting
          icon="network-wired"
          toggle={enabledLocalSharing}
          onClick={handleEnableLocalSharing}
          label="Enable local sharing"
        />
      </List>

      <div className={css.container}>
        <p>
          <Typography variant="caption">Your local IP address</Typography>
          <Typography variant="h2">{lanIP}</Typography>
        </p>
        <Typography variant="body2" color="textSecondary">
          Allow users to connect to your remote device through your IP address using a custom port.
        </Typography>
        {enabledLocalSharing && (
          <>
            <TextField
              className={css.textField}
              multiline={currentIp.toString().length > 30}
              label="Bind IP Address"
              error={!!error}
              defaultValue={currentIp}
              variant="filled"
              helperText={error}
              onChange={handleBindIP}
            />
            <TextField
              select
              size="small"
              className={css.textField}
              variant="filled"
              label="Local Network Security"
              value={selection.toString()}
              onChange={handleLocalNetworkSecurity}
            >
              {selections.map((option, key) => (
                <MenuItem key={key} value={key.toString()}>
                  {option.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="textSecondary">
              {selected.note}
              <span className={css.mask}>Mask {getSelectionValue()}</span>
            </Typography>
            {typeof selected.value === 'function' && (
              <Quote>
                <TextField
                  className={css.textField}
                  value={address}
                  variant="filled"
                  label="IP address"
                  onChange={event => setAddress(event.target.value.replace(REGEX_IP_SAFE, ''))}
                />
              </Quote>
            )}
          </>
        )}
      </div>
      <div className={css.container}>
        <Button onClick={save} variant="contained" color="primary" disabled={disabled}>
          Save
        </Button>
        <Button onClick={() => history.push(`/connections/${serviceID}`)}>Cancel</Button>
      </div>
    </Container>
  )
}

const useStyles = makeStyles({
  container: {
    paddingLeft: spacing.xl,
    margin: `${spacing.sm}px ${spacing.xxl}px ${spacing.lg}px`,
    '& > p': { marginBottom: spacing.md },
    '& > div': { marginBottom: spacing.sm },
  },
  textField: {
    minWidth: 300,
  },
  mask: {
    fontStyle: 'italic',
    marginLeft: spacing.sm,
  },
})

import React, { useState, useEffect } from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { IP_OPEN, IP_LATCH, IP_CLASS_A, IP_CLASS_B, IP_CLASS_C, REGEX_IP_SAFE } from '../../constants'
import { Select, Button, ButtonBase, Typography, Switch, TextField, MenuItem } from '@material-ui/core'
import { findService } from '../../models/devices'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { colors, spacing } from '../../styling'
import { ApplicationState } from '../../store'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'

type State = { enabled: boolean; selection: number; address: string; myAddress: string }
type Selections = { value: string | Function; name: string; note: string }

export const LanSharePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const connection = useSelector((state: ApplicationState) => {
    let c = state.jump.connections.find(c => c.id === serviceID)
    if (c) return c
    const [service] = findService(state.devices.all, serviceID)
    return { id: serviceID, name: service ? service.name : undefined }
  })

  const lanShare: boolean = connection.host === IP_OPEN
  const restriction: ipAddress = (lanShare && connection.restriction) || IP_OPEN
  const history = useHistory()
  const css = useStyles()

  // prettier-ignore
  const selections: Selections[] = [
    { value: IP_LATCH, name: 'IP Latching', note: 'Allow any single device on the local network to connect. IP restriction will be set to the IP address of the first device that connects.' },
    { value: IP_CLASS_A, name: 'Class-A Local Restriction', note: 'IP restricted to the local network' },
    { value: IP_CLASS_B, name: 'Class-B Local Restriction', note: 'Narrowly IP restrict on the local network' },
    { value: IP_CLASS_C, name: 'Class-C Local Restriction', note: 'Focused IP restriction on the local network' },
    { value: () => address, name: 'Single IP Restriction', note: 'Only allow a single IP address to connect to this device on the local network.' },
    { value: IP_OPEN, name: 'None', note: 'Available to all incoming requests.' },
  ]

  const [enabled, setEnabled] = useState<boolean>(!!lanShare)
  const [selection, setSelection] = useState<number>(selections.findIndex(s => s.value === restriction))
  const [address, setAddress] = useState<string>(restriction || '192.168.')
  const [myAddress, setMyAddress] = useState<string>('unknown')

  if (lanShare && selection === -1) {
    setSelection(selections.findIndex(s => typeof s.value === 'function'))
    setAddress(restriction)
  } else if (selection === -1) {
    setSelection(0)
  }

  useEffect(() => {
    // setMyAddress(await DeviceInfo.getIPAddress())
  }, [])

  const ipAddressOnly = (address: string) => address.replace(REGEX_IP_SAFE, '')
  const switchHandler = () => setEnabled(!enabled)
  const getSelectionValue = () => {
    if (!enabled) return undefined
    const value = selections[selection].value
    return typeof value === 'function' ? value() : value
  }
  const save = () => {
    console.log('set connection lanShare', connection, getSelectionValue())
    const selection = getSelectionValue()
    BackendAdaptor.emit('connection', {
      ...connection,
      host: selection ? IP_OPEN : connection.host,
      restriction: selection || IP_OPEN,
    })
    history.goBack()
  }

  return (
    <div>
      <Breadcrumbs />
      <Typography variant="subtitle1">Local Network Sharing</Typography>

      <ButtonBase onClick={switchHandler}>
        <div className={css.switch}>
          <Icon className={css.icon} name="network-wired" size="lg" color={enabled ? 'primary' : 'gray'} />
          <div style={{ flexGrow: 1, color: enabled ? colors.primary : colors.grayDarker }}>Enable local sharing</div>
          <Switch value={enabled} onChange={switchHandler} />
        </div>
      </ButtonBase>

      <section className={css.page}>
        <div className={css.indent}>
          <div>Your local IP address</div>
          <div>{myAddress}</div>
          <div className={css.note}>
            Allow users to connect to your remote device through your IP address using a custom port.
          </div>
        </div>
        {enabled && (
          <div className={css.indent}>
            <Select
              inputProps={{ name: 'Local Network Security' }}
              value={selection.toString()}
              onChange={event => setSelection(parseInt(event.target.value as string))}
            >
              {selections.map((option, key) => (
                <MenuItem key={key} value={key.toString()}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
            <div className={css.note}>
              {selections[selection].note}
              <div className={css.mask}> {getSelectionValue()}</div>
            </div>
            {typeof selections[selection].value === 'function' && (
              <div className={css.input}>
                <div className={css.quote} />
                <TextField
                  value={address}
                  onChange={event => setAddress(ipAddressOnly(event.target.value))}
                  label="IP address"
                />
              </div>
            )}
          </div>
        )}
        <Button onClick={save} variant="contained" color="primary">
          Save
          <Icon name="check" color="white" weight="regular" />
        </Button>
      </section>
    </div>
  )
}

const useStyles = makeStyles({
  page: {
    margin: spacing.lg,
  },
  icon: {
    marginRight: spacing.lg,
    marginLeft: spacing.sm,
  },
  switch: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  indent: {
    marginLeft: spacing.xl,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    color: colors.gray,
  },
  note: {
    marginTop: spacing.lg,
  },
  mask: {
    color: colors.grayDark,
  },
  input: {
    paddingTop: spacing.sm,
    flexDirection: 'row',
  },
  quote: {
    paddingLeft: spacing.lg,
    marginTop: 18,
    borderLeftWidth: 1,
    borderLeftColor: colors.grayLightest,
    height: 45,
  },
})

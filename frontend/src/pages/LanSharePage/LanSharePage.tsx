import React, { useState, useEffect } from 'react'
import { IP_OPEN, IP_LATCH, IP_CLASS_A, IP_CLASS_B, IP_CLASS_C, IP_PRIVATE, REGEX_IP_SAFE } from '../../constants'
import { Select, Button, ButtonBase, Typography, Switch, TextField, MenuItem } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { findService } from '../../models/devices'
import { makeStyles } from '@material-ui/styles'
import { Icon } from '../../components/Icon'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { colors, spacing } from '../../styling'
import { ApplicationState } from '../../store'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'

type Selections = { value: string | Function; name: string; note: string }

export const LanSharePage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const privateIP = useSelector((state: ApplicationState) => state.backend.privateIP)
  const connection = useSelector((state: ApplicationState) => {
    let c = state.backend.connections.find(c => c.id === serviceID)
    if (c) return c
    const [service] = findService(state.devices.all, serviceID)
    return service && newConnection(service)
  })

  const lanShare: boolean = !!connection && connection.host !== IP_PRIVATE
  const restriction: ipAddress = (connection && connection.restriction) || IP_OPEN
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

  const [enabled, setEnabled] = useState<boolean>(lanShare)
  const [selection, setSelection] = useState<number>(selections.findIndex(s => s.value === restriction))
  const [address, setAddress] = useState<string>(restriction || '192.168.')

  if (!connection) return null

  if (lanShare && selection === -1) {
    setSelection(selections.findIndex(s => typeof s.value === 'function'))
    setAddress(restriction)
  } else if (selection === -1) {
    setSelection(0)
  }

  const ipAddressOnly = (address: string) => address.replace(REGEX_IP_SAFE, '')
  const switchHandler = () => setEnabled(!enabled)
  const getSelectionValue = () => {
    if (!enabled) return undefined
    const value = selections[selection].value
    return typeof value === 'function' ? value() : value
  }

  const save = () => {
    const value = getSelectionValue()
    setConnection({ ...connection, host: enabled ? IP_OPEN : IP_PRIVATE, restriction: value })
    history.goBack()
  }

  return (
    <Breadcrumbs>
      <Typography variant="subtitle1">Local Network Sharing</Typography>

      <ButtonBase onClick={switchHandler}>
        <div className={css.switch}>
          <Icon className={css.icon} name="network-wired" size="lg" color={enabled ? 'primary' : 'gray'} />
          <div style={{ flexGrow: 1, color: enabled ? colors.primary : colors.grayDarker }}>Enable local sharing</div>
          <Switch checked={enabled} onChange={switchHandler} />
        </div>
      </ButtonBase>

      <section className={css.page}>
        <div className={css.indent}>
          <div>Your local IP address</div>
          <div>{privateIP}</div>
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
                  variant="filled"
                  label="IP address"
                  onChange={event => setAddress(ipAddressOnly(event.target.value))}
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
    </Breadcrumbs>
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

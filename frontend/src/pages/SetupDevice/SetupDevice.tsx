import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { LocalhostScanForm } from '../../components/LocalhostScanForm'
import { TextField, Button, Typography } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { safeHostname, osName } from '../../helpers/nameHelper'
import { REGEX_NAME_SAFE } from '../../constants'
import { makeStyles } from '@material-ui/styles'
import { Container } from '../../components/Container'
import { emit } from '../../services/Controller'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'
import Analytics from '../../helpers/Analytics'

type Props = {
  os?: Ios
  device: IDevice
}

export const SetupDevice: React.FC<Props> = ({ os, device }) => {
  const { hostname, loading, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    loading: !state.backend.scanData.localhost,
    nameBlacklist: state.devices.all
      .filter(device => device.shared !== 'shared-from')
      .map(device => device.name.toLowerCase()),
  }))
  const history = useHistory()
  const css = useStyles()
  const [name, setName] = useState<string>(safeHostname(hostname, nameBlacklist))
  const [disableRegister, setDisableRegister] = useState<boolean>(false)
  const [nameError, setNameError] = useState<string>()
  const [selected, setSelected] = useState<ITarget[]>([])

  const onRegistration = () => {
    console.log({ device: { ...device, name }, targets: selected })
    Analytics.Instance.track('deviceCreated', { deviceId: device.uid, deviceName: name })
    selected.forEach(target => {
      Analytics.Instance.track('serviceCreated', {
        serviceId: target.uid,
        serviceName: target.name,
        serviceType: target.type,
      })
    })
    emit('registration', { device: { ...device, name }, targets: selected })
    history.push('/settings/setupWaiting')
  }

  useEffect(() => {
    Analytics.Instance.track('ScanLocalNetwork')
    emit('scan', 'localhost')
  }, [])

  return (
    <Container header={<Breadcrumbs />}>
      <Body center={true}>
        <Typography variant="body2" align="center" color="textSecondary">
          Register your {osName(os)} for remote access
        </Typography>
        <form
          onSubmit={event => {
            if (!name) return
            event.preventDefault()
            onRegistration()
          }}
        >
          <section className={css.device}>
            <TextField
              label="Name"
              className={css.input}
              value={name}
              variant="filled"
              error={!!nameError}
              onChange={event => {
                const value = event.target.value.replace(REGEX_NAME_SAFE, '')
                if (value !== event.target.value) {
                  setNameError('Device names can only contain alpha numeric characters.')
                } else if (nameBlacklist.includes(value.toLowerCase().trim())) {
                  setNameError('That device name is already in use.')
                  setDisableRegister(true)
                } else {
                  setNameError(undefined)
                  setDisableRegister(false)
                }
                setName(value)
              }}
              onFocus={event => event.target.select()}
              helperText={nameError || '*Must be unique'}
              inputProps={{ 'data-lpignore': 'true' }}
            />
            <Button
              className={css.button}
              color="primary"
              variant="contained"
              size="medium"
              disabled={!name || disableRegister || loading}
              type="submit"
            >
              {loading ? (
                <>
                  Loading
                  <Icon name="spinner-third" spin={true} weight="regular" inline />
                </>
              ) : (
                <>
                  Register
                  <Icon name="check" weight="regular" inline />
                </>
              )}
            </Button>
          </section>
          <LocalhostScanForm setSelected={setSelected} />
        </form>
      </Body>
    </Container>
  )
}

const useStyles = makeStyles({
  button: {
    marginTop: styles.spacing.xxs,
    marginLeft: styles.spacing.lg,
  },
  device: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
  },
  input: {
    width: 300,
  },
})

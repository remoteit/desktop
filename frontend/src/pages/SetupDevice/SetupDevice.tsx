import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { LocalhostScanForm } from '../../components/LocalhostScanForm'
import { TextField, Button, Typography } from '@material-ui/core'
import { useHistory } from 'react-router-dom'
import { safeHostname, osName, serviceNameValidation} from '../../shared/nameHelper'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { emit } from '../../services/Controller'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'
import analytics from '../../helpers/Analytics'

type Props = {
  os?: Ios
  device: ITargetDevice
}

export const SetupDevice: React.FC<Props> = ({ os, device }) => {
  const { hostname, loading, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    loading: !state.backend.scanData.localhost || state.devices.fetching,
    nameBlacklist: state.devices.all
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))
  const history = useHistory()
  const css = useStyles()
  const [name, setName] = useState<string>(safeHostname(hostname, nameBlacklist))
  const [disableRegister, setDisableRegister] = useState<boolean>(false)
  const [nameError, setNameError] = useState<string>()
  const [selected, setSelected] = useState<ITarget[]>([])

  const onRegistration = () => {
    analytics.track('deviceCreated', { ...device, id: device.uid })
    selected.forEach(t => analytics.track('serviceCreated', { ...t, id: t.uid }))
    emit('registration', { device: { ...device, name }, targets: selected })
    history.push('/settings/setupWaiting')
  }

  useEffect(() => {
    if (!loading) setName(safeHostname(hostname, nameBlacklist))
  }, [loading])

  useEffect(() => {
    // Refresh device data
    analytics.track('networkScan')
    emit('device')
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
              disabled={loading}
              onChange={event => {
                const validation = serviceNameValidation(event.target.value, true)
                setName(validation.value)
                if ( validation.error ) {
                  setNameError( validation.error )
                  return
                }
                if (nameBlacklist.includes(validation.value.toLowerCase().trim())) {
                  setNameError('That device name is already in use.')
                  setDisableRegister(true)
                } else {
                  setNameError(undefined)
                  setDisableRegister(false)
                }
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
                  <Icon name="spinner-third" spin={true} type="regular" inline />
                </>
              ) : (
                <>
                  Register
                  <Icon name="check" type="regular" inline />
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

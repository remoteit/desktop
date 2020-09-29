import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { safeHostname, osName, serviceNameValidation } from '../../shared/nameHelper'
import { TextField, Button, Typography } from '@material-ui/core'
import { LocalhostScanForm } from '../../components/LocalhostScanForm'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { getDevices } from '../../models/accounts'
import { Container } from '../../components/Container'
import { emit } from '../../services/Controller'
import { Body } from '../../components/Body'
import { Icon } from '../../components/Icon'
import styles from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = { os?: Ios }

export const SetupDevice: React.FC<Props> = ({ os }) => {
  const { hostname, loading, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    loading: !state.backend.scanData.localhost,
    nameBlacklist: getDevices(state)
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))
  const css = useStyles()
  const history = useHistory()
  const { backend } = useDispatch<Dispatch>()
  const [name, setName] = useState<string>(safeHostname(hostname, nameBlacklist))
  const [disableRegister, setDisableRegister] = useState<boolean>(false)
  const [nameError, setNameError] = useState<string>()
  const [selected, setSelected] = useState<ITarget[]>([])

  useEffect(() => {
    if (loading) {
      emit('scan', 'localhost')
      analyticsHelper.track('networkScan')
    } else {
      setName(safeHostname(hostname, nameBlacklist))
    }
  }, [loading])

  useEffect(() => {
    // Refresh device data
    emit('device')
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
            backend.registerDevice({ targets: selected, name })
            history.push('./setupWaiting')
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
                const validation = serviceNameValidation(event.target.value)
                setName(validation.value)
                if (validation.error) {
                  setNameError(validation.error)
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
              helperText={nameError}
              inputProps={{ 'data-lpignore': 'true' }}
            />
            <Button
              className={css.button}
              color="primary"
              variant="contained"
              size="medium"
              disabled={!name || disableRegister}
              type="submit"
            >
              Register
              <Icon name="check" type="regular" inline />
            </Button>
          </section>
          <LocalhostScanForm setSelected={setSelected} loading={loading} />
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

import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { safeHostname, osName, serviceNameValidation } from '../../shared/nameHelper'
import { TextField, Button, Typography } from '@mui/material'
import { LocalhostScanForm } from '../../components/LocalhostScanForm'
import { useNavigate } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { getDevices } from '../../models/accounts'
import { emit } from '../../services/Controller'
import { Body } from '../../components/Body'
import { spacing } from '../../styling'

type Props = { os?: Ios }

export const SetupDevice: React.FC<Props> = ({ os }) => {
  const { hostname, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    nameBlacklist: getDevices(state)
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))
  const css = useStyles()
  const navigate = useNavigate()
  const { backend } = useDispatch<Dispatch>()
  const [name, setName] = useState<string>(safeHostname(hostname, nameBlacklist) || '')
  const [disableRegister, setDisableRegister] = useState<boolean>(false)
  const [nameError, setNameError] = useState<string>()
  const [selected, setSelected] = useState<IService[]>([])

  useEffect(() => {
    setName(safeHostname(hostname, nameBlacklist))
  }, [hostname])

  useEffect(() => {
    emit('device')
  }, [])

  return (
    <Body center maxHeight="85%">
      <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
        Register your {osName(os)} for remote access
      </Typography>
      <form
        onSubmit={event => {
          if (!name) return
          event.preventDefault()
          backend.registerDevice({ services: selected, name })
          navigate('/devices/setupWaiting')
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
          />
          <Button
            className={css.button}
            color="primary"
            variant="contained"
            size="large"
            disabled={!name || disableRegister}
            type="submit"
          >
            Register
          </Button>
        </section>
        <LocalhostScanForm onSelect={setSelected} />
      </form>
    </Body>
  )
}

const useStyles = makeStyles({
  button: {
    marginTop: spacing.xxs,
    marginLeft: spacing.lg,
  },
  device: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: spacing.xl,
  },
  input: {
    width: 300,
  },
})

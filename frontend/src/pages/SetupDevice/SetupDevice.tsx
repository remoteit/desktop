import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { State, Dispatch } from '../../store'
import { safeHostname, osName, serviceNameValidation } from '@common/nameHelper'
import { Box, TextField, Button, Typography } from '@mui/material'
import { LocalhostScanForm } from '../../components/LocalhostScanForm'
import { selectActiveUser } from '../../selectors/accounts'
import { spacing, radius } from '../../styling'
import { useHistory } from 'react-router-dom'
import { getDevices } from '../../selectors/devices'
import { emit } from '../../services/Controller'
import { Body } from '../../components/Body'
import { Link } from '../../components/Link'

type Props = { os?: Ios }

export const SetupDevice: React.FC<Props> = ({ os }) => {
  const { activeUser, hostname, nameBlacklist } = useSelector((state: State) => ({
    activeUser: selectActiveUser(state),
    hostname: state.backend.environment.hostname,
    nameBlacklist: getDevices(state)
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))
  const history = useHistory()
  const { backend } = useDispatch<Dispatch>()
  const { t } = useTranslation()
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
    <Body center>
      <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
        {t('setupDevice.setupFor', { os: osName(os), defaultValue: 'Setup your {{os}} for remote access or' })}
        <Link to={`/add/${os}`}>
          {t('setupDevice.addDifferent', { os: osName(os), defaultValue: 'add different {{os}}' })}
        </Link>
      </Typography>
      <form
        onSubmit={event => {
          if (!name) return
          event.preventDefault()
          backend.registerDevice({ services: selected, name, accountId: activeUser.id })
          history.push('/devices/setupWaiting')
        }}
      >
        <Box
          component="section"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: `${spacing.xl}px`,
          }}
        >
          <TextField
            label={t('setupDevice.name', 'Name')}
            sx={{ width: 325, maxWidth: 325 }}
            InputProps={{
              sx: { borderRadius: radius.lg + radius.sm, paddingX: 1, marginLeft: -1 },
            }}
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
                setNameError(t('setupDevice.nameInUse', 'That device name is already in use.'))
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
            sx={{ marginTop: 0.5, marginLeft: 0.5 }}
            color="primary"
            variant="contained"
            size="large"
            disabled={!name || disableRegister}
            type="submit"
          >
            {t('setupDevice.addDevice', 'Add Device')}
          </Button>
        </Box>
        <LocalhostScanForm onSelect={setSelected} />
      </form>
    </Body>
  )
}

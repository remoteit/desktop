import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Button, List, TextField, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLAddExitDevice } from '../services/graphQLDeviceRuns'
import { Exit, graphQLCreateExit } from '../services/graphQLExits'
import { RunDevicePicker } from '../components/RunDevicePicker'
import { refusalWhy } from '../helpers/exitWords'
import { useAccountExits } from '../hooks/useAccountExits'
import { Container } from '../components/Container'
import { FormField } from '../components/FormField'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* Creating an exit in one step: its name and the device to carry its traffic, then Create exit. The exit is made, the
   device added, and its page opens. A device refused is said here, the exit kept: choose another, or open the exit. */
export const ExitAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const accountId = useSelector(selectActiveAccountId)
  const [name, setName] = useState('')
  const [device, setDevice] = useState<string>()
  const [exit, setExit] = useState<Exit>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const { reload } = useAccountExits()

  const create = async () => {
    setBusy(true)
    setRefusal(undefined)
    let made = exit
    if (!made) {
      const created = await graphQLCreateExit(name.trim(), accountId)
      if ('reason' in created) {
        setBusy(false)
        return setRefusal(created.reason || t('exitAdd.notMade', 'Couldn’t create the exit. Try again.'))
      }
      made = created
      setExit(created)
      reload()
    }
    if (device) {
      const added = await graphQLAddExitDevice(made.id, device)
      if ('reason' in added) {
        setBusy(false)
        reload()
        return setRefusal(
          t('exitAdd.deviceRefused', 'Exit created, but that device couldn’t be added. {{reason}}', {
            reason: added.reason
              ? refusalWhy(t, 'exit', added.reason).reason
              : t('exitAdd.tryAnother', 'Choose another device.'),
          })
        )
      }
    }
    setBusy(false)
    reload()
    history.push(`/exits/${made.id}`)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('exitAdd.title', 'Create exit')}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t('exitAdd.intro', 'Name the exit and choose the device that will carry its traffic.')}
            </Typography>
          </Gutters>
        </>
      }
    >
      <List>
        <FormField>
          <TextField
            autoFocus
            variant="filled"
            label={t('exitAdd.name', 'Name')}
            placeholder={t('exitAdd.namePlaceholder', 'Home, Office, Lab')}
            value={exit ? exit.name : name}
            disabled={!!exit}
            inputProps={{ maxLength: 255 }}
            InputLabelProps={{ shrink: true }}
            onChange={event => setName(event.target.value)}
            data-name
          />
        </FormField>
      </List>
      <Typography variant="subtitle1">{t('exitAdd.device', 'Exit device')}</Typography>
      <Gutters top={null} bottom="xs">
        <Typography variant="caption">
          {t('exitAdd.deviceHint', 'Traffic routed through this exit leaves the internet from this device.')}
        </Typography>
      </Gutters>
      <RunDevicePicker
        kind="exit"
        target={exit?.id}
        ownerId={exit?.owner?.id || accountId}
        single
        onChoose={setDevice}
      />
      {refusal && (
        <Gutters>
          <Notice severity="error" fullWidth>
            {refusal}
          </Notice>
        </Gutters>
      )}
      <Gutters top="lg">
        <Button variant="contained" disabled={busy || (!exit && !name.trim())} onClick={create} data-create>
          {exit ? t('exitAdd.addDevice', 'Add device') : t('exitAdd.create', 'Create exit')}
        </Button>
        <Button disabled={busy} onClick={() => history.push(exit ? `/exits/${exit.id}` : '/exits')}>
          {exit ? t('exitAdd.openExit', 'Open exit') : t('exitAdd.cancel', 'Cancel')}
        </Button>
      </Gutters>
    </Container>
  )
}

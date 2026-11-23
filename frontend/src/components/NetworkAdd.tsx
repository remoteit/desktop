import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MAX_NAME_LENGTH } from '@common/constants'
import { useHistory } from 'react-router-dom'
import { List, TextField, Button } from '@mui/material'
import { selectNetwork } from '../models/networks'
import { selectActiveAccountId } from '../selectors/accounts'
import { reloadDeviceNetworks } from '../hooks/useDeviceNetworks'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { FormField } from './FormField'
import { Gutters } from './Gutters'
import { Notice } from './Notice'

export const NetworkAdd: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [name, setName] = useState<string>('')
  const [adding, setAdding] = useState<boolean>(false)
  const [failed, setFailed] = useState<boolean>(false)
  const network = useSelector((state: State) => selectNetwork(state))
  const accountId = useSelector(selectActiveAccountId)
  const deviceSessions = useDeviceSessions()

  return (
    <form
      onSubmit={async event => {
        event.preventDefault()
        setAdding(true)
        setFailed(false)
        const id = await dispatch.networks.addNetwork({ ...network, name })
        // A device network's page reads its own list, which must hold the new network before the page opens.
        if (id && deviceSessions) await reloadDeviceNetworks(accountId)
        setAdding(false)
        if (!id) return setFailed(true)
        setName('')
        history.push(`/networks/${id}`)
      }}
    >
      <List>
        <FormField>
          <TextField
            required
            autoFocus
            variant="filled"
            label={t('networkAdd.name', 'Name')}
            value={name}
            disabled={adding}
            onChange={event => setName(event.target.value.toString().substring(0, MAX_NAME_LENGTH))}
          />
        </FormField>
      </List>
      {failed && (
        <Gutters>
          <Notice severity="error" fullWidth>
            {t('networkAdd.failed', 'Couldn’t create the network. Try again.')}
          </Notice>
        </Gutters>
      )}
      <Gutters top="lg">
        <Button color="primary" disabled={name.length < 2 || adding} variant="contained" type="submit">
          {adding ? t('networkAdd.adding', 'Creating…') : t('networkAdd.add', 'Create network')}
        </Button>
        <Button onClick={() => history.goBack()}>{t('networkAdd.cancel', 'Cancel')}</Button>
      </Gutters>
    </form>
  )
}

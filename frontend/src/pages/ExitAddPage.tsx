import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Box, Button, TextField, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLAddExitDevice } from '../services/graphQLDeviceRuns'
import { Exit, graphQLCreateExit } from '../services/graphQLExits'
import { RunDevicePicker, addEach } from '../components/RunDevicePicker'
import { useAccountExits } from '../hooks/useAccountExits'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* A new exit (graphql-api docs/PROXY-GROUPS.md §13, "No shortcuts"): made in the account by its name, then the devices
   that run it are chosen and added — two steps, as graphql has them. One refused is said by name and left to choose
   again; the exit is kept either way, and its page opens once its devices are added, or skipped. */
export const ExitAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const accountId = useSelector(selectActiveAccountId)
  const [name, setName] = useState('')
  const [exit, setExit] = useState<Exit>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const [refusals, setRefusals] = useState<ILookup<string>>({})
  const { reload } = useAccountExits()

  const create = async () => {
    setBusy(true)
    const made = await graphQLCreateExit(name.trim(), accountId)
    setBusy(false)
    if ('reason' in made) return setRefusal(made.reason || t('exitAdd.notMade', 'It was not made: try again.'))
    setRefusal(undefined)
    setExit(made)
    reload()
  }

  const add = async (ids: string[]) => {
    if (!exit) return
    setBusy(true)
    const refused = await addEach(ids, id => graphQLAddExitDevice(exit.id, id))
    setBusy(false)
    setRefusals(refused)
    reload()
    if (!Object.keys(refused).length) history.push(`/exits/${exit.id}`)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1">
          <Title>{exit ? exit.name : t('exitAdd.title', 'New exit')}</Title>
        </Typography>
      }
    >
      <Gutters>
        {!exit ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="textSecondary">
              {t(
                'exitAdd.description',
                'Name it, then choose the devices that run it. Those you allow — you, roles, people you share it with, networks — send their traffic out through it.'
              )}
            </Typography>
            <TextField
              autoFocus
              size="small"
              label={t('exitAdd.name', 'Name')}
              value={name}
              inputProps={{ maxLength: 255 }}
              onChange={event => setName(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && name.trim() && !busy && create()}
            />
            <Box>
              <Button variant="contained" size="small" disabled={busy || !name.trim()} onClick={create}>
                {t('exitAdd.create', 'Make the exit')}
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {t(
                'exitAdd.chooseDevices',
                'Made. Now choose the devices that run it: each goes into service once its checks pass.'
              )}
            </Typography>
            <RunDevicePicker
              kind="exit"
                  target={exit.id}
              ownerId={exit.owner?.id || accountId}
              busy={busy}
              refusals={refusals}
              onAdd={add}
              onSkip={() => history.push(`/exits/${exit.id}`)}
            />
          </>
        )}
        {refusal && (
          <Notice severity="error" fullWidth gutterTop>
            {refusal}
          </Notice>
        )}
      </Gutters>
    </Container>
  )
}

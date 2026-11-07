import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Box, Button, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import { Proxy, graphQLCreateProxy } from '../services/graphQLProxy'
import { NAME_MAX, validLabel } from '../services/subnetNames'
import { RunDevicePicker, addEach } from '../components/RunDevicePicker'
import { useAccountProxies } from '../hooks/useAccountExits'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* A new proxy (graphql-api docs/PROXY-GROUPS.md §13, "No shortcuts"): made in the account — its name, the label its
   host takes before the account's slug (made from the name when none is given), your own domain for its https names if
   it has one, and whether it takes public endpoints —, then the devices that run it are chosen and added: two steps,
   as graphql has them. One refused is said by name and left to choose again; the proxy is kept either way. */
export const ProxyAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const accountId = useSelector(selectActiveAccountId)
  const { reload } = useAccountProxies()
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [domain, setDomain] = useState('')
  const [publicEndpoints, setPublicEndpoints] = useState(true)
  const [proxy, setProxy] = useState<Proxy>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const [refusals, setRefusals] = useState<ILookup<string>>({})
  const labelProblem = label && !validLabel(label)

  const create = async () => {
    setBusy(true)
    const made = await graphQLCreateProxy({
      name: name.trim(),
      label: label || undefined,
      domain: domain.trim() || undefined,
      publicEndpoints,
      accountId,
    })
    setBusy(false)
    if ('reason' in made) return setRefusal(made.reason || t('proxyAdd.notMade', 'It was not made: try again.'))
    setRefusal(undefined)
    setProxy(made)
    reload()
  }

  const add = async (ids: string[]) => {
    if (!proxy) return
    setBusy(true)
    const refused = await addEach(ids, id => graphQLAddProxyDevice(proxy.id, id))
    setBusy(false)
    setRefusals(refused)
    reload()
    if (!Object.keys(refused).length) history.push(`/proxies/${proxy.id}`)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1">
          <Title>{proxy ? proxy.name : t('proxyAdd.title', 'New proxy')}</Title>
        </Typography>
      }
    >
      <Gutters>
        {!proxy ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="textSecondary">
              {t(
                'proxyAdd.description',
                'Name it, then choose the devices that run it. Endpoints made on it are reached under its host, served by each of its devices in service.'
              )}
            </Typography>
            <TextField
              autoFocus
              size="small"
              label={t('proxyAdd.name', 'Name')}
              value={name}
              inputProps={{ maxLength: 255 }}
              onChange={event => setName(event.target.value)}
            />
            <TextField
              size="small"
              label={t('proxyAdd.label', 'Host label, before your account slug')}
              placeholder={t('proxyAdd.labelAutomatic', 'none: made from its name')}
              value={label}
              error={!!labelProblem}
              helperText={
                labelProblem
                  ? t('proxyAdd.labelProblem', 'Lower case letters and digits, at most {{max}}', { max: NAME_MAX })
                  : undefined
              }
              inputProps={{ maxLength: NAME_MAX }}
              onChange={event => setLabel(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
            />
            <TextField
              size="small"
              label={t('proxyAdd.domain', 'Your own domain for its https names (optional)')}
              placeholder="proxy.example.com"
              value={domain}
              onChange={event => setDomain(event.target.value)}
            />
            <FormControlLabel
              control={<Switch checked={publicEndpoints} onChange={event => setPublicEndpoints(event.target.checked)} />}
              label={t('proxyAdd.publicEndpoints', 'Takes public endpoints: anyone with the address')}
            />
            <Box>
              <Button variant="contained" size="small" disabled={busy || !name.trim() || !!labelProblem} onClick={create}>
                {t('proxyAdd.create', 'Make the proxy')}
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {t(
                'proxyAdd.chooseDevices',
                'Made: it is reached under {{host}}. Now choose the devices that run it: each goes into service once its checks pass.',
                { host: proxy.host }
              )}
            </Typography>
            <RunDevicePicker
              kind="proxy"
                  target={proxy.id}
              ownerId={proxy.owner?.id || accountId}
              busy={busy}
              refusals={refusals}
              onAdd={add}
              onSkip={() => history.push(`/proxies/${proxy.id}`)}
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

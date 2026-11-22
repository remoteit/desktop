import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Box, Button, Collapse, FormControlLabel, Switch, TextField, Typography } from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import { graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import { Proxy, graphQLCreateProxy } from '../services/graphQLProxy'
import { NAME_MAX, validLabel } from '../services/subnetNames'
import { refusalWhy } from '../helpers/exitWords'
import { RunDevicePicker } from '../components/RunDevicePicker'
import { ProxyKindChoice } from '../components/ProxyKindChoice'
import { useAccountProxies } from '../hooks/useAccountExits'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

/* Creating a proxy server in one step: its name, where it is reached from, and the device to run it, then Create proxy
   server. Its host label and whether it takes public addresses for anyone sit under More options. A device refused is
   said here, the proxy server kept. */
export const ProxyAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const accountId = useSelector(selectActiveAccountId)
  const { reload } = useAccountProxies()
  const [name, setName] = useState('')
  const [local, setLocal] = useState(false)
  const [label, setLabel] = useState('')
  const [publicEndpoints, setPublicEndpoints] = useState(true)
  const [more, setMore] = useState(false)
  const [device, setDevice] = useState<string>()
  const [proxy, setProxy] = useState<Proxy>()
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()
  const labelProblem = label && !validLabel(label)

  const create = async () => {
    setBusy(true)
    setRefusal(undefined)
    let made = proxy
    if (!made) {
      const created = await graphQLCreateProxy({
        name: name.trim(),
        label: label || undefined,
        publicEndpoints,
        local,
        accountId,
      })
      if ('reason' in created) {
        setBusy(false)
        return setRefusal(created.reason || t('proxyAdd.notMade', 'Couldn’t create the proxy server. Try again.'))
      }
      made = created
      setProxy(created)
      reload()
    }
    if (device) {
      const added = await graphQLAddProxyDevice(made.id, device)
      if ('reason' in added) {
        setBusy(false)
        reload()
        return setRefusal(
          t('proxyAdd.deviceRefused', 'Proxy server created, but that device couldn’t be added. {{reason}}', {
            reason: added.reason
              ? refusalWhy(t, 'proxy', added.reason).reason
              : t('exitAdd.tryAnother', 'Choose another device.'),
          })
        )
      }
    }
    setBusy(false)
    reload()
    history.push(`/proxies/${made.id}`)
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('proxyAdd.title', 'Create proxy server')}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t('proxyAdd.intro', 'Name it and choose the device that will run it.')}
            </Typography>
          </Gutters>
        </>
      }
    >
      <Gutters>
        <Box display="flex" flexDirection="column" gap={3} maxWidth={560}>
          <TextField
            autoFocus
            label={t('proxyAdd.name', 'Name')}
            value={proxy ? proxy.name : name}
            disabled={!!proxy}
            inputProps={{ maxLength: 255 }}
            onChange={event => setName(event.target.value)}
            data-name
          />
          {!proxy && <ProxyKindChoice local={local} disabled={busy} onChange={setLocal} />}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('proxyAdd.device', 'Device to run it')}
            </Typography>
            <RunDevicePicker
              kind="proxy"
              target={proxy?.id}
              ownerId={proxy?.owner?.id || accountId}
              single
              onChoose={setDevice}
            />
          </Box>
          {!proxy && (
            <Box>
              <Button
                size="small"
                onClick={() => setMore(!more)}
                endIcon={<Icon name={more ? 'chevron-up' : 'chevron-down'} size="sm" />}
                data-more
              >
                {t('proxyAdd.more', 'More options')}
              </Button>
              <Collapse in={more}>
                <Box display="flex" flexDirection="column" gap={2} marginTop={2}>
                  <TextField
                    size="small"
                    label={t('proxyAdd.label', 'Address label')}
                    placeholder={t('proxyAdd.labelAutomatic', 'Made from the name')}
                    value={label}
                    error={!!labelProblem}
                    helperText={
                      labelProblem
                        ? t('proxyAdd.labelProblem', 'Lower case letters and digits, at most {{max}}', {
                            max: NAME_MAX,
                          })
                        : t('proxyAdd.labelHint', 'The first part of its addresses.')
                    }
                    inputProps={{ maxLength: NAME_MAX }}
                    onChange={event => setLabel(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  />
                  <FormControlLabel
                    control={
                      <Switch checked={publicEndpoints} onChange={event => setPublicEndpoints(event.target.checked)} />
                    }
                    label={t('proxyAdd.publicEndpoints', 'Allow public addresses anyone can open')}
                  />
                </Box>
              </Collapse>
            </Box>
          )}
          {refusal && (
            <Notice severity="error" fullWidth>
              {refusal}
            </Notice>
          )}
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              disabled={busy || (!proxy && (!name.trim() || !!labelProblem))}
              onClick={create}
              data-create
            >
              {proxy ? t('proxyAdd.addDevice', 'Add device') : t('proxyAdd.create', 'Create proxy server')}
            </Button>
            <Button disabled={busy} onClick={() => history.push(proxy ? `/proxies/${proxy.id}` : '/proxies')}>
              {proxy ? t('proxyAdd.open', 'Open proxy server') : t('exitAdd.cancel', 'Cancel')}
            </Button>
          </Box>
        </Box>
      </Gutters>
    </Container>
  )
}
